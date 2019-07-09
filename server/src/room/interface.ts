import { PlayerState } from './player-state';

export interface IRoom {
    add_player(player_id: string): boolean;
    delete_player(player_id: string): void;
    get_players(): PlayerState[];
    player_index(player_id: string): number;
    set_ready(player_id: string, ready: boolean): void;
    start_game(): void;
}
