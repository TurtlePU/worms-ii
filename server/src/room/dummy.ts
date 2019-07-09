import { IRoom } from './interface';

export const dummy: IRoom = {
    add_player: (_) => false,
    delete_player: (_) => {},
    get_players: () => [],
    player_index: (_) => -1,
    set_ready: (_, __) => {},
    start_game: () => {},
};
