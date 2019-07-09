import { EventEmitter } from 'events';
import * as express from 'express';
import SocketIO from 'socket.io';

import { next_id, beautify } from './id-gen';
import { Scheme } from './scheme';
import { pages } from './util';

import default_scheme from '../data/schemes/default.json';

/**
 * Events:
 * * `new_room(room: Room)`
 * * `player_joined(room: Room)`
 * * `player_ready(room: Room, player_index: number)`
 * * `player_left(room: Room, player_id: string, player_index: number)`
 * * `game_started(room: Room)`
 */
export const RoomWatcher = new EventEmitter();

export interface IRoom {
    add_player(player_id: string): boolean;
    delete_player(player_id: string): void;
    get_players(): PlayerState[];
    player_index(player_id: string): number;
    set_ready(player_id: string, ready: boolean): void;
    start_game(): void;
}

export class Room implements IRoom {
    public static lobbies = new Set<string>();
    public static rooms = new Map<string, Room>();

    public static can_join(room_id: string) {
        return Room.lobbies.has(room_id);
    }

    public static get(room_id: string) {
        return Room.rooms.get(room_id) || dummy;
    }

    public static join_id() {
        if (Room.lobbies.size == 0) {
            new Room();
        }
        return Room.lobbies.values().next().value;
    }

    public readonly id: string;

    public players: PlayerState[];

    protected scheme: Scheme;

    /** @emits RoomWatcher#new_room */
    protected constructor() {
        this.id = next_id();
        this.players = [];
        this.scheme = default_scheme;

        RoomWatcher.emit('new_room', this);
    }

    /** @emits RoomWatcher#player_joined */
    public add_player(player_id: string) {
        if (this.is_full()) {
            return false;
        }
        if (this.player_index(player_id) != -1) {
            return false;
        }
        this.players.push({ id: player_id, ready: false });

        RoomWatcher.emit('player_joined', this);

        return true;
    }

    /** @emits RoomWatcher#player_left */
    public delete_player(player_id: string) {
        let i = this.player_index(player_id);
        if (i == -1) {
            return;
        }
        this.players.splice(i, 1);

        RoomWatcher.emit('player_left', this, player_id, i);
    }

    public get_players() {
        return this.players.map(
            ({ id, ready }) => ({ id: beautify(id), ready })
        );
    }

    public get_scheme() {
        return { ...this.scheme };
    }

    public is_full() {
        return this.players.length == this.scheme.player_limit;
    }

    public player_index(player_id: string) {
        return this.players.findIndex(({ id }) => id == player_id);
    }

    /** @emits RoomWatcher#player_ready */
    public set_ready(player_id: string, ready: boolean) {
        let i = this.player_index(player_id);
        if (i == -1) {
            return;
        }
        this.players[i].ready = ready;

        RoomWatcher.emit('player_ready', this, i);
    }

    /** @emits RoomWatcher#game_started */
    public start_game() {
        if (!this.players.every(({ ready }) => ready)) {
            return;
        }

        RoomWatcher.emit('game_started', this);
    }
}

export interface PlayerState {
    id: string;
    ready: boolean;
}

export function on_room_requests(application: express.Application) {
    application
        .get('/room=:room_id?', (req, res) => {
            res.sendFile(pages.get(
                Room.can_join(req.params.room_id)
                ? 'room' : 'notfound'
            ));
        })
        .get('/.room.join_id', (_, res) => {
            res.send(Room.join_id());
        })
        .get('/.room.get_players/id=:room_id', (req, res) => {
            res.send(Room.get(req.params.room_id).get_players());
        });
}

/**
 * Emits:
 * * `server:room#join(public_id: string)`
 * * `server:room#ready(public_id: string, ready: boolean)`
 * * `server:room#first(public_id: string)`
 * * `server:room#enable(enabled: boolean)`
 * * `server:room#leave(public_id: string)`
 */
var io: SocketIO.Server;

export function on_room_events(_io: SocketIO.Server) {
    (io = _io).on('connection', (socket) => {
        let room = dummy;
        socket
            .on('client:room#join', (room_id, clb) => {
                room = Room.get(room_id);
                if (room.add_player(socket.id)) {
                    socket.join(room_id);
                    clb({ me: beautify(socket.id) });
                } else {
                    clb({ error: `Failed to join room ${room_id}.` });
                }
            })
            .on('client:room#ready', (ready) => {
                room.set_ready(socket.id, ready);
            })
            .on('client:room#start', () => {
                if (room.player_index(socket.id) == 0) {
                    room.start_game();
                }
            })
            .on('disconnect', () => {
                room.delete_player(socket.id);
            });
    });
}

const dummy: IRoom = {
    add_player: (_) => false,
    delete_player: (_) => {},
    get_players: () => [],
    player_index: (_) => -1,
    set_ready: (_, __) => {},
    start_game: () => {},
};

function emit_first(room: Room) {
    io.to(room.id).emit(
        'server:room#first',
        beautify(room.players[0].id)
    );
}

function emit_enable(room: Room) {
    io.sockets.connected[room.players[0].id].emit(
        'server:room#enable',
        room.players.every(({ ready }) => ready)
    );
}

RoomWatcher
    .on('new_room', (room: Room) => {
        RoomWatcher.emit('new_lobby', room.id);
        Room.rooms.set(room.id, room);
    })
    .on('new_lobby', (room_id: string) => {
        Room.lobbies.add(room_id);
    })
    .on('not_a_lobby', (room_id: string) => {
        Room.lobbies.delete(room_id);
    })
    .on('player_joined', (room: Room) => {
        io.to(room.id).emit(
            'server:room#join',
            beautify(room.players.slice(-1)[0].id)
        );
        if (room.is_full()) {
            RoomWatcher.emit('not_a_lobby', room.id);
        }
        if (room.players.length == 1) {
            emit_first(room);
        }
        emit_enable(room);
    })
    .on('player_ready', (room: Room, player_index: number) => {
        io.to(room.id).emit(
            'server:room#ready',
            beautify(room.players[player_index].id),
            room.players[player_index].ready
        );
        emit_enable(room);
    })
    .on('player_left', (room: Room, player_id: string, player_index: number) => {
        io.to(room.id).emit(
            'server:room#leave',
            beautify(player_id)
        );
        if (player_index == 0 && room.players.length != 0) {
            emit_first(room);
        }
        if (room.players.length != 0) {
            emit_enable(room);
        }
        RoomWatcher.emit('new_lobby', room.id);
    })
    .on('game_started', (room: Room) => {
        Room.rooms.delete(room.id);
        RoomWatcher.emit('not_a_lobby', room.id);
    });
