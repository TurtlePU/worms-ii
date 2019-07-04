import { EventEmitter } from 'events';

import { pages } from './pages';
import { Player } from './player';
import { Room } from './room';

// player ID is a first socket ID with which a player entered the game

export class Game extends EventEmitter {
    /**
     * @protected
     * @memberof Game
     * @type {Map<string, Game>}
     */
    static games = new Map();

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

    /**
     *Creates an instance of Game.
     * @param {Room} room
     * @memberof Game
     */
    constructor(room) {
        // TODO
        console.log('New game!');
        // Don't forget to emit server:game#start
    }

    has(socket_id) {
        return this.players.has(socket_id);
    }

    delete_player(socket_id) {
        // TODO
    }
}

export function on_game_requests(app) {    
    app.get('/game=:game_id?/socket=:socket_id?', (req, res) => {
        res.sendFile(pages.get(
            Game.can_join(req.params.game_id, req.params.socket_id)
            ? 'game' : 'notfound'
        ));
    });
}

/**
 * @type {SocketIO.Server}
 */
var io;

/**
 *
 *
 * @export
 * @param {SocketIO.Server} _io
 */
export function on_game_events(_io) {
    (io = _io).on('connection', (socket) => {
        // TODO
        /**
         * @type {Game}
         */
        var game;
        socket
            .on('disconnect', () => {
                game.delete_player(socket.id);
            });
    });
}
