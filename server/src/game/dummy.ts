import { IGame } from './interface';

import default_scheme from '../../data/schemes/default.json';

export const dummy: IGame = {
    get_scheme: () => ({ ...default_scheme }),
    has_player: (_) => false,
    hide_player: (_) => {},
    join: (_, __) => false,
    set_ready: (_) => {},
};
