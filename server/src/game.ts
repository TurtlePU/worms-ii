import { EventEmitter } from 'events';

import { pages } from './pages';
import { Room } from './room';
import { Player } from './player';

// player ID is a first socket ID with which a player entered the game

export const GameWatcher = new EventEmitter();

/**
 * Represents game itself.
 *
 * @export
 * @class Game
 */
export class Game {
    /**
     * Collection of live games.
     * 
     * @memberof Game
     * @type {Map<string, Game>}
     */
    static games = new Map();

    id: string;
    scheme: any;
    players: Player[];

    /**
     * Returns `Game` by given id.
     *
     * @param {string} game_id id of a game.
     * @returns `Game` by given id.
     * @memberof Game
     */
    static get(game_id) {
        return this.games.get(game_id) || dummy;
    }

    /**
     * Creates an instance of Game.
     *
     * @param {Room} room
     * @memberof Game
     */
    constructor(room) {
        this.id = room.id;
        this.scheme = room.scheme;
        this.players = room.players.map(({ id }) => new Player(id));
        GameWatcher.emit('new', this);
    }

    /**
     * Checks if game has player with given id.
     *
     * @param {string} socket_id id with which a player started the game.
     * @memberof Game
     */
    has(socket_id) {
        return false;
        // return this.find_index(socket_id) != -1;
    }

    /**
     * Hides player with given id from players queue.
     *
     * @param {string} socket_id last known id of a player.
     * @memberof Game
     */
    delete_player(socket_id) {
        // TODO
    }
}

/**
 * Appends HTTP request listeners (part of Game API).
 *
 * @export
 * @param app an Express app.
 */
export function on_game_requests(app) {    
    app.get('/game=:game_id?/socket=:socket_id?', (req, res) => {
        res.sendFile(pages.get(
            Game.get(req.params.game_id).has(req.params.socket_id)
            ? 'game' : 'notfound'
        ));
    });
}

/**
 * @type {SocketIO.Server}
 */
var io;

/**
 * Appends SocketIO event listeners (part of Game API).
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
                if (game) {
                    game.delete_player(socket.id);
                }
            });
    });
}

/**
 * @type {Game}
 */
const dummy = {
    //
};

// Don't forget to emit server:game#start

GameWatcher
    .on('new', (game) => {
        Game.games.set(game.id, game);
        //
    });
