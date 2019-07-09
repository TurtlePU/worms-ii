import { EventEmitter } from 'events';
import * as express     from 'express';
import SocketIO         from 'socket.io';

import { pages } from './pages';
import { Room } from './room';
import { Player, ID_TYPE } from './player';
import { Scheme } from './scheme';

import default_scheme from '../data/schemes/default.json';

/**
 * Events:
 * * `new(game: Game)`
 */
export const GameWatcher = new EventEmitter();

export interface IGame {
    get_scheme(): Scheme;
    has_player(first_id: string): boolean;
    hide_player(last_id: string): void;
    join(first_id: string, last_id: string): boolean;
    set_ready(last_id: string): void;
}

// TODO: @emits [Game]

export class Game implements IGame {
    public static games = new Map<string, Game>();

    public static get(game_id: string) {
        return this.games.get(game_id) || dummy;
    }

    public readonly id: string;

    public players: Player[];

    protected scheme: Scheme;

    public constructor(room: Room) {
        this.id = room.id;
        this.scheme = room.get_scheme();
        this.players = room.players.map(({ id }) => new Player(id));

        GameWatcher.emit('new', this);
    }

    public can_start() {
        // TODO: can_start [Game]
        // correct state + everyone joined at least once
        return false;
    }

    protected player_index(player_id: string, type: ID_TYPE) {
        if (type == ID_TYPE.first) {
            return this.players.findIndex(({ first_id }) => first_id == player_id);
        } else {
            return this.players.findIndex(({ last_id }) => last_id == player_id);
        }
    }

    public get_scheme() {
        return { ...this.scheme };
    }

    public has_player(first_id: string) {
        return this.player_index(first_id, ID_TYPE.first) != -1;
    }

    public hide_player(last_id: string) {
        let i = this.player_index(last_id, ID_TYPE.last);
        if (i == -1) {
            return;
        }
        this.players[i].online = false;
    }

    public join(first_id: string, last_id: string) {
        let i = this.player_index(first_id, ID_TYPE.first);
        if (i == -1) {
            return false;
        }
        this.players[i].join_with(last_id, this.scheme.player_scheme);

        GameWatcher.emit('join', this, i);

        return true;
    }

    public set_ready(last_id: string) {
        let i = this.player_index(last_id, ID_TYPE.last);
        if (i == -1) {
            return;
        }
        this.players[i].ready = true;

        GameWatcher.emit('ready', this, i);
    }

    public start() {
        // TODO: start [Game]
        GameWatcher.emit('start', this);
    }
}

export function on_game_requests(app: express.Application) {
    app.get('/game=:game_id?/player=:player_id?', (req, res) => {
        res.sendFile(pages.get(
            Game.get(req.params.game_id).has_player(req.params.player_id)
            ? 'game' : 'notfound'
        ));
    });
}

/**
 * Emits:
 * * `server:game#start()`
 */
var io: SocketIO.Server;

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
    has_player: (_) => false,
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
