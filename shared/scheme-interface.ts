export interface Scheme {
    player_limit: number;
    player_scheme: PlayerScheme;
}

export interface PlayerScheme {
    weapons: {
        name: string,
        amount: number,
        delay: number
    }[];
    worm_count: number;
    worm_hp: number;
    worm_name: string[][];
}
