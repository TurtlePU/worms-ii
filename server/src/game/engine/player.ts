import { beautify } from '../../id-gen';
import { PlayerScheme } from '../../scheme';

import { Ammo } from './ammo';
import { Worm } from './worm';
import { array_map } from '../../util';
import { Weapon } from './weapon-types';

export class Player {
    public readonly first_id: string;

    public last_id: string;

    public online: boolean;
    public ready: boolean;

    protected weapons: Ammo[];
    protected worms: Worm[];

    public constructor(id: string, index: number, scheme: PlayerScheme) {
        this.first_id = id;
        this.last_id = id;
        this.online = false;
        this.ready = false;
        this.weapons = array_map(Weapon.count, (index) => ({
            ...scheme.weapons[index]
        }));
        this.worms = array_map(scheme.worm_count, (jndex) => ({
            hp: scheme.worm_hp,
            name: scheme.worm_name[index][jndex],
            position: { x: 0, y: 0 }
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

    public public_info() {
        // TODO public_info [Player]
    }
}
