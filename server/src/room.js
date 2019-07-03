import { EventEmitter } from "events";

import { next_id } from './id-gen';

/**
 * Events:
 * 
 * 1. ```ready(room_id: string)```
 */
export const RoomWatcher = new EventEmitter();

/**
 * Represents room in which players are preparing for a game.
 *
 * @export
 * @class Room
 */
export class Room extends EventEmitter {
    /**
     * @protected
     * @type {Map<string, Room>}
     * @memberof Room
     */
    static rooms = new Map();

    /**
     * @protected
     * @type {Set<string>}
     * @memberof Room
     */
    static lobbies = new Set();

    /**
     * @protected
     * @type {Map<string, string>}
     * @memberof Room
     */
    static room_of = new Map();

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
     * Checks if there is a lobby on given id.
     *
     * @public
     * @param {string} room_id
     * @memberof Room
     */
    static can_join(room_id) {
        return this.lobbies.has(room_id);
    }

    /**
     * Deletes socket from the room to which it was attached.
     *
     * @public
     * @param {string} socket_id
     * @memberof Room
     */
    static delete_socket(socket_id) {
        let room_id = this.room_of.get(socket_id);
        if (this.rooms.has(room_id)) {
            this.rooms.get(room_id).delete(socket_id);
        }
    }

    /**
     * Creates an instance of Room.
     * 
     * @public
     * @memberof Room
     */
    constructor() {
        this.id = next_id();
        Room.rooms.set(this.id, this);
        this.on('free', () => Room.lobbies.add(this.id))
            .on('full', () => Room.lobbies.delete(this.id));
        this.emit('free');
    }

    delete(socket_id) {
        // TODO
    }
}

/**
 *
 *
 * @export
 * @param {SocketIO.Socket} socket
 */
export function on_room_events(socket) {
    // TODO
}
