import { Scheme } from './scheme';

/**
 * Represents a player during the game.
 */
export class Player {
    /**
     * Id on first connection.
     */
    public readonly first_id: string;

    /**
     * Id on last connection.
     */
    public last_id: string;

    /**
     * True if player is connected to the game.
     */
    public online: boolean;

    /**
     * True if player is ready.
     */
    public ready: boolean;

    /**
     * List of all worms.
     */
    protected worms: Worm[];

    /**
     * List of weapons' ammo (indexable via `Weapon` enum).
     */
    protected weapons: Ammo[];

    /**
     * Creates an instance of Player.
     * @param id first connection id.
     */
    public constructor(id: string) {
        this.first_id = id;
        this.last_id = id;
        this.online = false;
        this.ready = false;
        this.worms = [];
        this.weapons = [];
    }

    /**
     * Inits player (or restores it).
     * No side effects.
     * @param last_id current id of a player.
     * @param scheme scheme of a game they play.
     */
    public join_with(last_id: string, scheme: Scheme) {
        // TODO join_with [Player]
        // Update last_id, set online, init (or restore) worms & weapons.
    }

    /**
     * A beautiful id of a player based on `first_id`.
     * Pure.
     */
    public public_id() {
        // TODO public_id [Player]
    }

    /**
     * Info on a player to be known on client side.
     * Pure.
     */
    public public_info() {
        // TODO public_info [Player]
    }
}

/**
 * Indices of weapons.
 */
export enum Weapon {
    // TODO: weapons list
}

/**
 * Worm data.
 */
export interface Worm {
    hp: number;
    name: string;
    position: Point;
}

/**
 * 2D point data.
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * Data of Weapon (unique for User).
 */
export interface Ammo {
    amount: number;
    delay: number;
}
