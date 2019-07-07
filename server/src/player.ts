
/**
 * Represents a player during the game.
 */
export class Player {
    /**
     * Id on first connection.
     */
    readonly first_id: string;

    /**
     * Id on last connection.
     */
    last_id: string;

    /**
     * List of all worms.
     */
    worms: Worm[];

    /**
     * List of weapons' ammo (indexable via `Weapon` enum).
     */
    weapons: Ammo[];

    /**
     * Creates an instance of Player.
     * @param id first connection id.
     */
    constructor(id: string) {
        this.first_id = id;
        this.last_id = id;
        this.worms = [];
        this.weapons = [];
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
