import { EventEmitter } from 'events';
import * as express from 'express';
import SocketIO from 'socket.io';

import { next_id, beautify } from './id-gen';
import { Scheme } from './scheme';
import { pages } from './pages';

import default_scheme from '../data/schemes/default.json';

/**
 * Events:
 * * `new(room: Room)`
 * * `delete(room: Room, socket_id: string, socket_index: number)`
 * * `join(room: Room)`
 * * `ready(room: Room, socket_index: number)`
 * * `start(room: Room)`
 */
export const RoomWatcher = new EventEmitter();

/**
 * Interface of a `Room`.
 * @see {Room}
 */
export interface IRoom {
    /**
     * Deletes player if present.
     * Must have no side effects.
     * @emits RoomWatcher#delete
     * @param socket_id id of a player.
     */
    delete_player(socket_id: string): void;

    /**
     * Gets index of a player.
     * Must be pure.
     * @param socket_id id of a player.
     * @returns index of a player in the list of players.
     */
    find_index(socket_id: string): number;

    /**
     * Gets list of players.
     * Must be pure.
     * @returns a formatted list of players in this room.
     */
    get_members(): PlayerState[];

    /**
     * Adds player to the list if possible.
     * Must have no side effects.
     * @emits RoomWatcher#join
     * @param socket_id id of a socket.
     * @returns true if player successfully joined.
     */
    join(socket_id: string): boolean;

    /**
     * Marks that player is ready.
     * Must have no side effects.
     * @emits RoomWatcher#ready
     * @param socket_id id of a player.
     * @param ready readiness of a player.
     */
    set_ready(socket_id: string, ready: boolean): void;

    /**
     * Starts the game.
     * Must be pure.
     * @emits RoomWatcher#start
     */
    start(): void;
}

/**
 * Represents room in which players are preparing for a game.
 */
export class Room implements IRoom {
    /**
     * Rooms which have place for another player.
     */
    public static lobbies = new Set<string>();

    /**
     * Collection of all rooms.
     */
    public static rooms = new Map<string, Room>();

    /**
     * Checks if player can join the room.
     * Pure.
     * @param room_id id of some room.
     * @returns true if there is a joinable room with given id.
     */
    public static can_join(room_id: string) {
        return Room.lobbies.has(room_id);
    }

    /**
     * Gets room by id.
     * Pure.
     * @param room_id id of some room.
     * @returns a room with given id (or dummy, if there's no such room).
     */
    public static get(room_id: string) {
        return Room.rooms.get(room_id) || dummy;
    }

    /**
     * Returns id of room which can fit another player.
     * Creates `new Room` only if necessary.
     * @returns id of room with a place for another player.
     */
    public static join_id() {
        if (Room.lobbies.size == 0) {
            new Room();
        }
        return Room.lobbies.values().next().value;
    }

    /**
     * ID of a room.
     */
    public readonly id: string;

    /**
     * States of players in the room.
     */
    public players: PlayerState[];

    /**
     * Scheme used for following game.
     */
    protected scheme: Scheme;

    /**
     * Creates an instance of Room.
     * No side effects.
     * @emits RoomWatcher#new
     */
    protected constructor() {
        this.id = next_id();
        this.players = [];
        this.scheme = default_scheme;

        RoomWatcher.emit('new', this);
    }

    public delete_player(socket_id: string) {
        let i = this.find_index(socket_id);
        if (i == -1) {
            return;
        }
        this.players.splice(i, 1);

        RoomWatcher.emit('delete', this, socket_id, i);
    }

    public find_index(socket_id: string) {
        return this.players.findIndex(({ id }) => id == socket_id);
    }

    public get_members() {
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

    public join(socket_id: string) {
        if (this.is_full()) {
            return false;
        }
        if (this.find_index(socket_id) != -1) {
            return false;
        }
        this.players.push({ id: socket_id, ready: false });

        RoomWatcher.emit('join', this);

        return true;
    }

    public set_ready(socket_id: string, ready: boolean) {
        let i = this.find_index(socket_id);
        if (i == -1) {
            return;
        }
        this.players[i].ready = ready;

        RoomWatcher.emit('ready', this, i);
    }

    public start() {
        if (!this.players.every(({ ready }) => ready)) {
            return;
        }

        RoomWatcher.emit('start', this);
    }
}

/**
 * Represents state of a player in a room.
 */
export interface PlayerState {
    /**
     * Unique identifier of player. Can be private (socket id) and public.
     */
    id: string;

    /**
     * True if player is ready.
     */
    ready: boolean;
}

/**
 * Appends HTTP request listeners (part of Room API).
 * No side effects.
 * @param application an Express application.
 */
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
        .get('/.room.get_members/id=:room_id', (req, res) => {
            res.send(Room.get(req.params.room_id).get_members());
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

/**
 * Appends SocketIO event listeners (part of Room API).
 * No side effects.
 * @param _io Socket.IO server.
 */
export function on_room_events(_io: SocketIO.Server) {
    (io = _io).on('connection', (socket) => {
        let room = dummy;
        socket
            .on('client:room#join', (room_id, clb) => {
                room = Room.get(room_id);
                if (room.join(socket.id)) {
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
                if (room.find_index(socket.id) == 0) {
                    room.start();
                }
            })
            .on('disconnect', () => {
                room.delete_player(socket.id);
            });
    });
}

const dummy: IRoom = {
    delete_player: (_) => {},
    find_index: (_) => -1,
    get_members: () => [],
    join: (_) => false,
    set_ready: (_, __) => {},
    start: () => {},
};

/**
 * Emits `server:room#first` event (on change of admin in the room).
 * Pure.
 * @param room
 */
function emit_first(room: Room) {
    io.to(room.id).emit(
        'server:room#first',
        beautify(room.players[0].id)
    );
}

/**
 * Emits `server:room#enable` event (on change of total readiness in the room).
 * Pure.
 * @param room
 */
function emit_enable(room: Room) {
    io.sockets.connected[room.players[0].id].emit(
        'server:room#enable',
        room.players.every(({ ready }) => ready)
    );
}

RoomWatcher
    .on('new', (room: Room) => {
        RoomWatcher.emit('free', room.id);
        Room.rooms.set(room.id, room);
    })
    .on('delete', (room: Room, socket_id: string, socket_index: number) => {
        io.to(room.id).emit(
            'server:room#leave',
            beautify(socket_id)
        );
        if (socket_index == 0 && room.players.length != 0) {
            emit_first(room);
        }
        if (room.players.length != 0) {
            emit_enable(room);
        }
        RoomWatcher.emit('free', room.id);
    })
    .on('join', (room: Room) => {
        io.to(room.id).emit(
            'server:room#join',
            beautify(room.players.slice(-1)[0].id)
        );
        if (room.is_full()) {
            RoomWatcher.emit('full', room.id);
        }
        if (room.players.length == 1) {
            emit_first(room);
        }
        emit_enable(room);
    })
    .on('ready', (room: Room, socket_index: number) => {
        io.to(room.id).emit(
            'server:room#ready',
            beautify(room.players[socket_index].id),
            room.players[socket_index].ready
        );
        emit_enable(room);
    })
    .on('start', (room: Room) => {
        Room.rooms.delete(room.id);
        RoomWatcher.emit('full', room.id);
    })
    .on('free', (room_id: string) => {
        Room.lobbies.add(room_id);
    })
    .on('full', (room_id: string) => {
        Room.lobbies.delete(room_id);
    });
