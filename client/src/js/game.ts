import io from 'socket.io-client';

import { PublicPlayerInfo } from 'shared/public-player-info';
import { Scheme } from 'shared/scheme-interface';

import Cookie from './lib/cookie';
import { ErrType, is_error, fail } from './lib/util';

var socket: SocketIOClient.Socket;

async function main() {
    socket = io();

    let join_result = await new Promise((resolve, reject) => {
        socket.emit(
            'client:game#join',
            Cookie.get('room'), Cookie.get('id'),
            resolve
        );
        setTimeout(reject, 3000);
    }) as ErrType | { scheme: Scheme, me: PublicPlayerInfo };

    if (is_error(join_result)) {
        return fail(join_result.error);
    }

    let { scheme, me } = join_result;

    // TODO: game logic

    socket.emit('client:game#ready');
}

main();
