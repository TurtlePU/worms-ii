import io from 'socket.io-client';

import Cookie from './lib/cookie';

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
    });

    // TODO: game logic
}

main();
