import { IGame } from './interface';

import default_scheme from '~/../data/schemes/default.json';
import default_player_info from '~/../data/default-player-info.json';

export const dummy: IGame = {
    get_me: () => ({ ...default_player_info }),
    get_scheme: () => ({ ...default_scheme }),
    has_player: (_) => false,
    hide_player: (_) => {},
    join: (_, __) => false,
    set_ready: (_) => {},
};
