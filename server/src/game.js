import { EventEmitter } from 'events';

import { Player } from './player';

// player ID is a first socket ID with which a player entered the game

export class Game extends EventEmitter {
    /**
     * @protected
     * @memberof Game
     * @type {Map<string, Game>}
     */
    static games = new Map();

    /**
     * @protected
     * @memberof Game
     * @type {Map<string, string>}
     */
    static game_of = new Map();

    /**
     * Checks if there is game with ```game_id``` which has player with ```socket_id```.
     *
     * @param {string} game_id
     * @param {string} socket_id
     * @memberof Game
     */
    static can_join(game_id, socket_id) {
        return this.games.has(game_id) &&
               this.games.get(game_id).has(socket_id);
    }

    static delete_socket(socket_id) {
        let game_id = this.game_of.get(socket_id);
        if (this.games.has(game_id)) {
            this.games.get(game_id).delete(socket_id);
        }
    }

    /**
     *Creates an instance of Game.
     * @param {string} id
     * @param {string[]} socket_ids
     * @memberof Game
     */
    constructor(id, socket_ids) {
        this.id = id;
        this.players = new Map(socket_ids.map(id => [id, new Player(id)]));
        for (let id of socket_ids) {
            Game.game_of.set(id, this.id);
        }
    }

    has(socket_id) {
        return this.players.has(socket_id);
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
export function on_game_events(socket) {
    // TODO
}
