declare type ErrType = {
    error: string;
}

declare type CheckResponse = {
    response: boolean;
}

declare type PlayerState = {
    id: string;
    ready: boolean;
}

declare type PublicPlayerInfo = {
    //
}

declare type Scheme = {
    player_limit: number;
    player_scheme: PlayerScheme;
}

declare type PlayerScheme = {
    weapons: {
        name: string,
        amount: number,
        delay: number
    }[];
    worm_count: number;
    worm_hp: number;
    worm_name: string[][];
}
