import { Scheme } from 'shared/scheme-interface';
import { PublicPlayerInfo } from 'shared/public-player-info';

export interface IGame {
    get_scheme(): Scheme;
    get_me(first_id: string): PublicPlayerInfo;
    has_player(first_id: string): boolean;
    hide_player(last_id: string): void;
    join(first_id: string, last_id: string): boolean;
    set_ready(last_id: string): void;
}
