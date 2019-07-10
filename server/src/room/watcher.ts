import { EventEmitter } from 'events';
import SocketIO from 'socket.io';

import { beautify } from '~/util/id-gen';

import { Room } from './class';
import { dummy } from './dummy';

/**
 * Events:
 * * `game_started(room: Room)`
 * * `new_room(room: Room)`
 * * `player_joined(room: Room)`
 * * `player_left(room: Room, player_id: string, player_index: number)`
 * * `player_ready(room: Room, player_index: number)`
 */
export class RoomWatcher extends EventEmitter {
    public static readonly instance = new RoomWatcher();

    protected lobbies = new Set<string>();
    protected rooms = new Map<string, Room>();

    /**
     * Emits:
     * * `server:room#join(public_id: string)`
     * * `server:room#ready(public_id: string, ready: boolean)`
     * * `server:room#first(public_id: string)`
     * * `server:room#enable(enabled: boolean)`
     * * `server:room#leave(public_id: string)`
     */
    protected io: SocketIO.Server;

    protected constructor() {
        super();

        this.on_game_started = this.on_game_started.bind(this);
        this.on_new_room = this.on_new_room.bind(this);
        this.on_player_joined = this.on_player_joined.bind(this);
        this.on_player_left = this.on_player_left.bind(this);
        this.on_player_ready = this.on_player_ready.bind(this);

        this.on('game_started', this.on_game_started);
        this.on('new_room', this.on_new_room);
        this.on('player_joined', this.on_player_joined);
        this.on('player_left', this.on_player_left);
        this.on('player_ready', this.on_player_ready);
    }

    public can_join(room_id: string) {
        return this.lobbies.has(room_id);
    }

    public get(room_id: string) {
        return this.rooms.get(room_id) || dummy;
    }

    public has_lobbies() {
        return this.lobbies.size != 0;
    }

    public join_id() {
        return this.lobbies.values().next().value;
    }

    public use(io: SocketIO.Server) {
        this.io = io;
    }

    protected emit_enable(room: Room) {
        this.io.sockets.connected[room.players[0].id].emit(
            'server:room#enable',
            room.players.every(({ ready }) => ready)
        );
    }    

    protected emit_first(room: Room) {
        this.io.to(room.id).emit(
            'server:room#first',
            beautify(room.players[0].id)
        );
    }

    protected on_game_started(room: Room) {
        this.rooms.delete(room.id);
        this.lobbies.delete(room.id);
    }

    protected on_new_room(room: Room) {
        this.lobbies.add(room.id);
        this.rooms.set(room.id, room);
    }

    protected on_player_joined(room: Room) {
        this.io.to(room.id).emit(
            'server:room#join',
            beautify(room.players.slice(-1)[0].id)
        );
        if (room.is_full()) {
            this.lobbies.delete(room.id);
        }
        if (room.players.length == 1) {
            this.emit_first(room);
        }
        this.emit_enable(room);
    }

    protected on_player_left(room: Room, player_id: string, player_index: number) {
        this.io.to(room.id).emit(
            'server:room#leave',
            beautify(player_id)
        );
        if (player_index == 0 && room.players.length != 0) {
            this.emit_first(room);
        }
        if (room.players.length != 0) {
            this.emit_enable(room);
        }
        this.lobbies.add(room.id);
    }

    protected on_player_ready(room: Room, player_index: number) {
        this.io.to(room.id).emit(
            'server:room#ready',
            beautify(room.players[player_index].id),
            room.players[player_index].ready
        );
        this.emit_enable(room);
    }
}
