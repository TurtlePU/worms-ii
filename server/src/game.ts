import { EventEmitter } from 'events';
import * as express     from 'express';
import SocketIO         from 'socket.io';

import { pages } from './pages';
import { Room } from './room';
import { Player } from './player';
import { Scheme } from './scheme';

import default_scheme from '../data/schemes/default.json';

// player ID is a first socket ID with which a player entered the game

/**
 * Events:
 * * `new(game: Game)`
 */
export const GameWatcher = new EventEmitter();

/**
 * Interface of a `Game`.
 */
export interface IGame {
    /**
     * Getter of scheme used for the game.
     * Must be pure.
     */
    get_scheme(): Scheme;

    /**
     * Checks if game has player with given id.
     * Must be pure.
     * @param socket_id id with which a player started the game.
     * @returns true if player with given id started this game.
     */
    has(socket_id: string): boolean;

    /**
     * Hides player with given id from players queue.
     * Must have no side effects.
     * @param socket_id last known id of a player.
     */
    hide_player(socket_id: string): void;

    /**
     * Game lets in a player, if it plays this game.
     * Must have no side effects.
     * @param first_id saved id of a player.
     * @param last_id current id of a player.
     * @returns true if join was successful.
     */
    join(first_id: string, last_id: string): boolean;

    /**
     * Tells the game that player is ready.
     * Must have no side effects.
     * @param socket_id current id of a player.
     */
    set_ready(socket_id: string): void;
}

/**
 * Represents game itself.
 */
export class Game implements IGame {
    /**
     * Collection of live games.
     */
    public static games = new Map<string, Game>();

    /**
     * Returns `Game` by given id.
     * Pure.
     * @param game_id id of a game.
     * @returns `Game` by given id.
     */
    public static get(game_id: string) {
        return this.games.get(game_id) || dummy;
    }

    /**
     * Unique identifier of a game.
     */
    public readonly id: string;

    /**
     * List of players in the game.
     */
    public players: Player[];

    /**
     * Scheme used in the game.
     */
    protected scheme: Scheme;

    /**
     * Creates an instance of Game.
     * @param room Room which started a game.
     */
    public constructor(room: Room) {
        this.id = room.id;
        this.scheme = room.get_scheme();
        this.players = room.players.map(({ id }) => new Player(id));

        GameWatcher.emit('new', this);
    }

    /**
     * Checks if game is ready to start.
     * Pure.
     * @returns true if game can start (and hasn't already started).
     */
    public can_start() {
        // TODO: can_start [Game]
        // correct state + everyone joined at least once
        return false;
    }

    /**
     * Returns index of a player with given id.
     * Pure.
     * @param socket_id id of a player.
     * @param first true if given id is the `first_id` of a player.
     * @returns index of a player with given id.
     */
    private find_index(socket_id: string, first?: boolean) {
        if (first) {
            return this.players.findIndex(({ first_id }) => first_id == socket_id);
        } else {
            return this.players.findIndex(({ last_id }) => last_id == socket_id);
        }
    }

    public get_scheme() {
        return { ...this.scheme };
    }

    public has(socket_id: string) {
        return this.find_index(socket_id, true) != -1;
    }

    public hide_player(socket_id: string) {
        let i = this.find_index(socket_id);
        if (i == -1) {
            return;
        }
        this.players[i].online = false;
    }

    public join(first_id: string, last_id: string) {
        let i = this.find_index(first_id, true);
        if (i == -1) {
            return false;
        }
        this.players[i].join_with(last_id, this.scheme.player_scheme);

        GameWatcher.emit('join', this, i);

        return true;
    }

    public set_ready(socket_id: string) {
        let i = this.find_index(socket_id);
        if (i == -1) {
            return;
        }
        this.players[i].ready = true;

        GameWatcher.emit('ready', this, i);
    }

    /**
     * Starts the game loop.
     */
    public start() {
        // TODO: start [Game]
        GameWatcher.emit('start', this);
    }
}

/**
 * Appends HTTP request listeners (part of Game API).
 * No side effects.
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

/**
 * Emits:
 * * `server:game#start()`
 */
var io: SocketIO.Server;

/**
 * Appends SocketIO event listeners (part of Game API).
 * No side effects.
 * @param _io Socket.IO Server.
 */
export function on_game_events(_io: SocketIO.Server) {
    (io = _io).on('connection', (socket) => {
        // TODO: game events
        var game = dummy;
        socket
            .on('client:game#join', (game_id: string, socket_id: string, ack: (result: any) => void) => {
                game = Game.get(game_id);
                socket.join(game_id);
                if (game.join(socket_id, socket.id)) {
                    ack({ scheme: game.get_scheme() });
                } else {
                    socket.leave(game_id);
                    ack({ error: `Failed to join game ${game_id}.` });
                }
            })
            .on('client:game#ready', () => {
                game.set_ready(socket.id);
            })
            .on('disconnect', () => {
                game.hide_player(socket.id);
            });
    });
}

const dummy: IGame = {
    get_scheme: () => ({ ...default_scheme }),
    has: (_) => false,
    hide_player: (_) => {},
    join: (_, __) => false,
    set_ready: (_) => {},
};

GameWatcher
    .on('new', (game: Game) => {
        Game.games.set(game.id, game);
        io.to(game.id).emit('server:game#start');
    })
    .on('join', (game: Game, player_index: number) => {
        io.to(game.id).emit(
            'server:game#join',
            game.players[player_index].public_info()
        );
    })
    .on('ready', (game: Game, player_index: number) => {
        io.to(game.id).emit(
            'server:game#ready',
            game.players[player_index].public_id()
        );
        if (game.can_start()) {
            game.start();
        }
    })
    .on('start', (game: Game) => {
        io.to(game.id).emit('server:game#start');
    });
