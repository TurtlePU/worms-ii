/// <reference path="../../../shared/types.d.ts"/>

import { next_id, beautify } from 'util/id-gen';

import { IRoom } from './interface';
import { RoomWatcher } from './watcher';

import default_scheme from 'data/schemes/default.json';

export class Room implements IRoom {
    public readonly id: string;

    public players: PlayerState[];

    protected scheme: Scheme;

    /** @emits RoomWatcher#new_room */
    public constructor() {
        this.id = next_id();
        this.players = [];
        this.scheme = default_scheme;

        RoomWatcher.instance.emit('new_room', this);
    }

    /** @emits RoomWatcher#player_joined */
    public add_player(player_id: string) {
        if (this.is_full()) {
            return false;
        }
        if (this.player_index(player_id) != -1) {
            return false;
        }
        this.players.push({ id: player_id, ready: false });

        RoomWatcher.instance.emit('player_joined', this);

        return true;
    }

    /** @emits RoomWatcher#player_left */
    public delete_player(player_id: string) {
        let i = this.player_index(player_id);
        if (i == -1) {
            return;
        }
        this.players.splice(i, 1);

        RoomWatcher.instance.emit('player_left', this, player_id, i);
    }

    public get_players() {
        return this.players.map(
            ({ id, ready }) => ({ id: beautify(id), ready })
        );
    }

    public get_scheme() {
        return { ...this.scheme };
    }

    public is_full() {
        return this.players.length == this.scheme.player_limit;
    }

    public player_index(player_id: string) {
        return this.players.findIndex(({ id }) => id == player_id);
    }

    /** @emits RoomWatcher#player_ready */
    public set_ready(player_id: string, ready: boolean) {
        let i = this.player_index(player_id);
        if (i == -1) {
            return;
        }
        this.players[i].ready = ready;

        RoomWatcher.instance.emit('player_ready', this, i);
    }

    /** @emits RoomWatcher#game_started */
    public start_game() {
        if (!this.players.every(({ ready }) => ready)) {
            return;
        }

        RoomWatcher.instance.emit('game_started', this);
    }
}
