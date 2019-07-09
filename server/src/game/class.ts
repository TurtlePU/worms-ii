import { Room } from '../room';
import { Scheme } from '../scheme';

import { Player } from './engine/player';
import { PlayerIdType } from './engine/player-id-types';

import { IGame } from './interface';
import { game_watcher } from './watcher';

export class Game implements IGame {
    public readonly id: string;

    public players: Player[];

    protected looping: boolean;

    protected scheme: Scheme;

    /** @emits GameWatcher#new_game */
    public constructor(room: Room) {
        this.id = room.id;
        this.players = room.players.map(
            ({ id }, i) => new Player(id, i, this.scheme.player_scheme)
        );
        this.looping = false;
        this.scheme = room.get_scheme();
        
        game_watcher.emit('new_game', this);
    }

    public can_start() {
        return !this.looping && this.players.every(({ ready }) => ready);
    }

    public get_scheme() {
        return { ...this.scheme };
    }

    public has_player(first_id: string) {
        return this.player_index(first_id, PlayerIdType.FIRST) != -1;
    }

    public hide_player(last_id: string) {
        let i = this.player_index(last_id, PlayerIdType.LAST);
        if (i == -1) {
            return;
        }
        this.players[i].online = false;

        game_watcher.emit('player_hidden', this, i);
    }

    public join(first_id: string, last_id: string) {
        let i = this.player_index(first_id, PlayerIdType.FIRST);
        if (i == -1) {
            return false;
        }
        this.players[i].join_with(last_id, this.scheme.player_scheme);

        game_watcher.emit('player_joined', this, i);

        return true;
    }

    public set_ready(last_id: string) {
        let i = this.player_index(last_id, PlayerIdType.LAST);
        if (i == -1) {
            return;
        }
        this.players[i].ready = true;

        game_watcher.emit('player_ready', this, i);
    }

    public start() {
        // TODO: start [Game]
        // game_watcher.emit('game_loop_start', this);
    }

    protected player_index(player_id: string, type: PlayerIdType) {
        if (type == PlayerIdType.FIRST) {
            return this.players.findIndex(({ first_id }) => first_id == player_id);
        } else {
            return this.players.findIndex(({ last_id }) => last_id == player_id);
        }
    }
}
