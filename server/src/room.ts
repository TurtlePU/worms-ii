import { EventEmitter } from "events";

import { next_id, beautify } from './id-gen';
import { pages } from './pages';

import default_scheme from '../data/schemes/default.json';

/**
 * Events:
 * 
 * * `new(room: Room)`
 * * `delete(room: Room, socket_id: string, socket_index: number)`
 * * `join(room: Room)`
 * * `ready(room: Room, socket_index: number)`
 * * `start(room: Room)`
 */
export const RoomWatcher = new EventEmitter();

/**
 * Represents room in which players are preparing for a game.
 *
 * @export
 * @class Room
 */
export class Room {
    /**
     * Rooms which have place for another player.
     * 
     * @type {Set<string>}
     * @memberof Room
     */
    static lobbies = new Set();

    /**
     * Collection of all rooms.
     * 
     * @type {Map<string, Room>}
     * @memberof Room
     */
    static rooms = new Map();

    scheme: { "player_limit": number; };
    players: any[];
    id: string;

    /**
     * Checks if player can join the room.
     * Pure.
     * 
     * @param {string} room_id id of some room.
     * @returns true if there is a room with given id.
     * @memberof Room
     */
    static can_join(room_id) {
        return Room.lobbies.has(room_id);
    }

    /**
     * Gets room by id.
     * Pure.
     * 
     * @param {string} room_id id of some room.
     * @returns a room with given id (or dummy, if there's no such room).
     * @memberof Room
     */
    static get(room_id) {
        return Room.rooms.get(room_id) || dummy;
    }

    /**
     * Returns id of room which can fit another player.
     * Creates `new Room` only if necessary.
     * 
     * @returns id of room with a place for another player.
     * @memberof Room
     */
    static join_id() {
        if (Room.lobbies.size == 0) {
            new Room();
        }
        return Room.lobbies.values().next().value;
    }

    /**
     * Creates an instance of Room.
     * No side effects.
     * 
     * @emits RoomWatcher#new
     * @memberof Room
     */
    constructor() {
        this.id = next_id();
        this.players = [];
        this.scheme = default_scheme;

        RoomWatcher.emit('new', this);
    }

    /**
     * Deletes player if present.
     * No side effects.
     * 
     * @emits RoomWatcher#delete
     * @param {string} socket_id id of a player.
     * @memberof Room
     */
    delete_player(socket_id) {
        let i = this.find_index(socket_id);
        if (i == -1) {
            return;
        }
        this.players.splice(i, 1);

        RoomWatcher.emit('delete', this, socket_id, i);
    }

    /**
     * Gets index of a player.
     * Pure.
     * 
     * @param {string} socket_id id of a player.
     * @returns index of a player in the list of players.
     * @memberof Room
     */
    find_index(socket_id) {
        return this.players.findIndex(({ id }) => id == socket_id);
    }

    /**
     * Gets list of players.
     * Pure.
     *  
     * @returns a formatted list of players in this room.
     * @memberof Room
     */
    get_members() {
        console.log(this.players);
        return this.players.map(
            ({ id, ready }) => ({ id: beautify(id), ready })
        );
    }

    /**
     * Adds player to the list if possible.
     * No side effects.
     *
     * @emits RoomWatcher#join
     * @param {string} socket_id id of a socket.
     * @returns true if player successfully joined.
     * @memberof Room
     */
    join(socket_id) {
        if (this.players.length == this.scheme.player_limit) {
            return false;
        }
        if (this.find_index(socket_id) != -1) {
            return false;
        }
        this.players.push({ id: socket_id, ready: false });

        RoomWatcher.emit('join', this);

        return true;
    }

    /**
     * Marks that player is ready.
     * No side effects.
     *
     * @emits RoomWatcher#ready
     * @param {string} socket_id
     * @param {boolean} ready
     * @memberof Room
     */
    set_ready(socket_id, ready) {
        let i = this.find_index(socket_id);
        if (i == -1) {
            return;
        }
        this.players[i].ready = ready;

        RoomWatcher.emit('ready', this, i);
    }

    /**
     * Starts the game.
     * Pure.
     *
     * @emits RoomWatcher#start
     * @memberof Room
     */
    start() {
        if (!this.players.every(({ ready }) => ready)) {
            return;
        }

        RoomWatcher.emit('start', this);
    }
}

/**
 * Appends HTTP request listeners (part of Room API).
 * No side effects.
 *
 * @export
 * @param application an Express application.
 */
export function on_room_requests(application) {
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
 * 
 * * `server:room#join(public_id: string)`
 * * `server:room#ready(public_id: string, ready: boolean)`
 * * `server:room#first(public_id: string)`
 * * `server:room#enable(enabled: boolean)`
 * * `server:room#leave(public_id: string)`
 * 
 * @type {SocketIO.Server}
 */
var io;

/**
 * Appends SocketIO event listeners (part of Room API).
 * No side effects.
 *
 * @export
 * @param {SocketIO.Server} _io
 */
export function on_room_events(_io) {
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

/**
 * @type {Room}
 */
const dummy = {
    delete_player: (_) => {},
    find_index: (_) => -1,
    get_members: () => [],
    join: (_) => false,
    set_ready: (_, __) => {},
    start: () => {},
};

/**
 * Emits `server:room#first` event.
 * Pure.
 *
 * @param {Room} room
 */
function emit_first(room) {
    io.to(room.id).emit(
        'server:room#first',
        beautify(room.players[0].id)
    );
}

/**
 * Emits `server:room#enable` event.
 * Pure.
 *
 * @param {Room} room
 */
function emit_enable(room) {
    io.sockets.connected[room.players[0].id].emit(
        'server:room#enable',
        room.players.every(({ ready }) => ready)
    );
}

RoomWatcher
    .on('new', (room) => {
        RoomWatcher.emit('free', room.id);
        Room.rooms.set(room.id, room);
    })
    .on('delete', (/** @type {Room} */ room, socket_id, socket_index) => {
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
    .on('join', (/** @type {Room} */ room) => {
        io.to(room.id).emit(
            'server:room#join',
            beautify(room.players.slice(-1)[0].id)
        );
        if (room.players.length == room.scheme.player_limit) {
            RoomWatcher.emit('full', room.id);
        }
        if (room.players.length == 1) {
            emit_first(room);
        }
        emit_enable(room);
    })
    .on('ready', (/** @type {Room} */ room, socket_index) => {
        io.to(room.id).emit(
            'server:room#ready',
            beautify(room.players[socket_index].id),
            room.players[socket_index].ready
        );
        emit_enable(room);
    })
    .on('start', (room) => {
        Room.rooms.delete(room.id);
        RoomWatcher.emit('full', room.id);
    })
    .on('free', (room_id) => {
        Room.lobbies.add(room_id);
    })
    .on('full', (room_id) => {
        Room.lobbies.delete(room_id);
    });
