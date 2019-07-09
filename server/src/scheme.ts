import { Ammo } from './game/engine/ammo';

export interface Scheme {
    player_limit: number;
    player_scheme: PlayerScheme;
}

export interface PlayerScheme {
    weapons: Ammo[];
    worm_count: number;
    worm_hp: number;
    worm_name: string[][];
}
