import { beautify } from './id-gen';
import { PlayerScheme } from './scheme';

export class Player {
    public readonly first_id: string;

    public last_id: string;
    public online: boolean;
    public ready: boolean;

    protected weapons: Ammo[];
    protected worms: Worm[];

    public constructor(id: string) {
        this.first_id = id;
        this.last_id = id;
        this.online = false;
        this.ready = false;
        this.worms = [];
        this.weapons = [];
    }

    public join_with(last_id: string, scheme: PlayerScheme) {
        // TODO join_with [Player]
        // Update last_id, set online, init (or restore) worms & weapons.
    }

    public public_id() {
        return beautify(this.first_id);
    }

    public public_info() {
        // TODO public_info [Player]
    }
}

export enum ID_TYPE {
    first, last
}

export enum Weapon {
    // TODO: weapons list
}

export interface Worm {
    hp: number;
    name: string;
    position: Point;
}

export interface Point {
    x: number;
    y: number;
}

export interface Ammo {
    amount: number;
    delay: number;
}
