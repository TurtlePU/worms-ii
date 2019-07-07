import { EventEmitter } from 'events';
import * as express     from 'express';
import SocketIO         from 'socket.io';

import { pages } from './pages';
import { Room } from './room';
import { Player } from './player';

// player ID is a first socket ID with which a player entered the game

export const GameWatcher = new EventEmitter();

export interface IGame {
    has(socket_id: string): boolean;
}

/**
 * Represents game itself.
 */
export class Game implements IGame {
    /**
     * Collection of live games.
     */
    static games = new Map<string, Game>();

    id: string;
    scheme: any;
    players: Player[];

    /**
     * Returns `Game` by given id.
     * @param game_id id of a game.
     * @returns `Game` by given id.
     */
    static get(game_id: string) {
        return this.games.get(game_id) || dummy;
    }

    /**
     * Creates an instance of Game.
     * @param room Room which started a game.
     */
    constructor(room: Room) {
        this.id = room.id;
        this.scheme = room.scheme;
        this.players = room.players.map(({ id }) => new Player(id));

        GameWatcher.emit('new', this);
    }

    /**
     * Hides player with given id from players queue.
     * @param socket_id last known id of a player.
     */
    delete_player(socket_id: string) {
        // TODO: delete_player [Game]
    }

    /**
     * Returns index of a player with given id.
     * @param socket_id id with which a player started the game.
     * @returns index of a player with given id.
     */
    find_index(socket_id: string) {
        return this.players.findIndex(({ first_id }) => first_id == socket_id);
    }

    /**
     * Checks if game has player with given id.
     * @param socket_id id with which a player started the game.
     * @returns true if player with given id started this game.
     */
    has(socket_id: string) {
        return this.find_index(socket_id) != -1;
    }
}

/**
 * Appends HTTP request listeners (part of Game API).
 * @param app an Express app.
 */
export function on_game_requests(app: express.Application) {
    app.get('/game=:game_id?/socket=:socket_id?', (req, res) => {
        res.sendFile(pages.get(
            Game.get(req.params.game_id).has(req.params.socket_id)
            ? 'game' : 'notfound'
        ));
    });
}

var io: SocketIO.Server;

/**
 * Appends SocketIO event listeners (part of Game API).
 * @param _io Socket.IO Server.
 */
export function on_game_events(_io: SocketIO.Server) {
    (io = _io).on('connection', (socket) => {
        // TODO: game events
        var game: Game;
        socket
            .on('disconnect', () => {
                if (game) {
                    game.delete_player(socket.id);
                }
            });
    });
}

const dummy: IGame = {
    has: (_) => false,
};

GameWatcher
    .on('new', (game: Game) => {
        Game.games.set(game.id, game);
        // FIXME: emit game start (server:game#start)
    });
