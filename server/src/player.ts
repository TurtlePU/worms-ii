
/**
 * Represents a player during the game.
 *
 * @export
 * @class Player
 */
export class Player {
    old_id: string;
    new_id: string;
    worms: any[];
    weapons: Map<any, any>;
    /**
     * Creates an instance of Player.
     * @param {string} id
     * @memberof Player
     */
    constructor(id: string) {
        this.old_id = id;
        this.new_id = id;
        /**
         * @type {{ hp: number, name: string, position: { x: number, y: number } }[]}
         */
        this.worms = [];
        /**
         * @type {Map<string, { amount: number, delay: number }>}
         */
        this.weapons = new Map();
    }
}
