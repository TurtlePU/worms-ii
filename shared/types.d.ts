declare interface CheckResponse {
    response: boolean;
}

declare interface PlayerState {
    id: string;
    ready: boolean;
}

declare interface PublicPlayerInfo {
    //
}

declare interface Scheme {
    player_limit: number;
    player_scheme: PlayerScheme;
}

declare interface PlayerScheme {
    weapons: {
        name: string,
        amount: number,
        delay: number
    }[];
    worm_count: number;
    worm_hp: number;
    worm_name: string[][];
}
