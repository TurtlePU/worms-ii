import { Scheme } from 'shared/scheme-interface';

import { Room } from '../room/class';

import { IGame } from './interface';
import { GameWatcher } from './watcher';

import { Player, PlayerIdType } from './engine/player';

export class Game implements IGame {
    public readonly id: string;

    protected looping: boolean;
    protected players: Player[];
    protected scheme: Scheme;

    /** @emits GameWatcher#new_game */
    public constructor(room: Room) {
        this.id = room.id;
        this.players = room.players.map(
            ({ id }, i) => new Player(id, i, this.scheme.player_scheme)
        );
        this.looping = false;
        this.scheme = room.get_scheme();
        
        GameWatcher.instance.emit('new_game', this);
    }

    public can_start() {
        return !this.looping && this.players.every(({ ready }) => ready);
    }

    public get_scheme() {
        return { ...this.scheme };
    }

    public get_me(first_id: string) {
        let i = this.player_index(first_id, PlayerIdType.FIRST);
        if (i == -1) {
            return;
        }
        return this.players[i].public_info();
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

        GameWatcher.instance.emit('player_hidden', this, this.players[i]);
    }

    public join(first_id: string, last_id: string) {
        let i = this.player_index(first_id, PlayerIdType.FIRST);
        if (i == -1) {
            return false;
        }
        this.players[i].join_with(last_id, this.scheme.player_scheme);

        GameWatcher.instance.emit('player_joined', this, this.players[i]);

        return true;
    }

    public set_ready(last_id: string) {
        let i = this.player_index(last_id, PlayerIdType.LAST);
        if (i == -1) {
            return;
        }
        this.players[i].ready = true;

        GameWatcher.instance.emit('player_ready', this, this.players[i]);
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
