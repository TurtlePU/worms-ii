/// <reference path="../../../shared/types.d.ts"/>

import * as Phaser from 'phaser';

import { beautify } from 'util/id-gen';
import { array_map } from 'util/other';

import { Weapon } from './weapon-types';

export class Player {
    public readonly first_id: string;

    public last_id: string;

    public online: boolean;
    public ready: boolean;

    protected weapons: {
        amount: number,
        delay: number
    }[];

    protected worms: {
        hp: number;
        name: string;
        position: Phaser.Geom.Point;
    }[];

    public constructor(id: string, index: number, scheme: PlayerScheme) {
        this.first_id = id;
        this.last_id = id;
        this.online = false;
        this.ready = false;
        this.weapons = array_map(Weapon.count, (index) => ({
            amount: scheme.weapons[index].amount,
            delay: scheme.weapons[index].delay
        }));
        this.worms = array_map(scheme.worm_count, (jndex) => ({
            hp: scheme.worm_hp,
            name: scheme.worm_name[index][jndex],
            position: new Phaser.Geom.Point()
        }));
    }

    public join_with(last_id: string, game_context: any) {
        this.last_id = last_id;
        if (!this.ready) {
            // TODO in join_with [Player]
            // init worms' positions. For each worm:
            // 1. throw it in random coords
            // 2. make it fall
            // 3. if in water -- reroll
        }
        this.online = true;
    }

    public public_id() {
        return beautify(this.first_id);
    }

    public public_info(): PublicPlayerInfo {
        // TODO public_info [Player]
        return {};
    }
}

export enum PlayerIdType { FIRST, LAST }
