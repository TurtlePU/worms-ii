import { Scheme } from '../util/scheme-interface';

export interface IGame {
    get_scheme(): Scheme;
    has_player(first_id: string): boolean;
    hide_player(last_id: string): void;
    join(first_id: string, last_id: string): boolean;
    set_ready(last_id: string): void;
}
