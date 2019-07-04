import { EventEmitter } from "events";

import { next_id, beautify } from './id-gen';
import { pages } from './pages';

import default_scheme from '../data/schemes/default.json';

/**
 * Events:
 * 
 * * ```new(room: Room)```
 * * ```delete(room: Room, socket_id: string, socket_index: number)```
 * * ```join(room: Room)```
 * * ```ready(room: Room, socket_index: number)```
 * * ```start(room: Room)```
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
     * @protected
     * @type {Set<string>}
     * @memberof Room
     */
    static lobbies = new Set();

    /**
     * @protected
     * @type {Map<string, Room>}
     * @memberof Room
     */
    static rooms = new Map();

    /**
     * Checks if there is a lobby on given id.
     *
     * @public
     * @param {string} room_id
     * @memberof Room
     */
    static can_join(room_id) {
        return this.lobbies.has(room_id);
    }

    static get(room_id) {
        return this.rooms.get(room_id) || dummy;
    }

    /**
     * Returns id of next room to join.
     *
     * @public
     * @memberof Room
     */
    static join_id() {
        if (this.lobbies.size() == 0) {
            new Room();
        }
        return this.lobbies.values().next().value;
    }

    /**
     * Creates an instance of Room.
     * 
     * @public
     * @emits RoomWatcher#new
     * @memberof Room
     */
    constructor() {
        this.id = next_id();
        /**
         * @type {{ id: string, ready: boolean }[]}
         */
        this.players = [];
        this.scheme = default_scheme;

        RoomWatcher.emit('new', this);
    }

    /**
     * Deletes player if present.
     * 
     * @emits RoomWatcher#delete
     * @param {string} socket_id
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

    find_index(socket_id) {
        return this.players.findIndex(({ id }) => id == socket_id);
    }

    get_members() {
        return this.players.map(
            ({ id, ready }) => ({ id: beautify(id), ready })
        );
    }

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

    set_ready(socket_id, ready) {
        let i = this.find_index(socket_id);
        if (i == -1) {
            return;
        }
        this.players[i].ready = ready;

        RoomWatcher.emit('ready', this, i);
    }

    start() {
        if (!this.players.every(({ ready }) => ready)) {
            return;
        }

        RoomWatcher.emit('start', this);
    }
}

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
 * @type {SocketIO.Server}
 * 
 * Emits:
 * 
 * * ```server:room#join(public_id: string)```
 * * ```server:room#ready(public_id: string, ready: boolean)```
 * * ```server:room#first(public_id: string)```
 * * ```server:room#enable(enabled: boolean)```
 * * ```server:room#leave(public_id: string)```
 */
var io;

/**
 *
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
            .on('client:room#leave', () => {
                room.delete_player(socket.id);
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

const dummy = {
    delete_player: (_) => {},
    find_index: (_) => -1,
    get_members: () => [],
    join: (_) => false,
    set_ready: (_, __) => {},
    start: () => {},
};

/**
 * @param {Room} room
 */
function emit_first(room) {
    io.to(room.id).emit(
        'server:room#first',
        beautify(room.players[0].id)
    );
}

/**
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
        Room.rooms.set(room.id, room);
        RoomWatcher.emit('free', room.id);
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
