/// <reference path="../../../../shared/types.d.ts"/>
/// <reference path="./lib/page.d.ts"/>

import io from 'socket.io-client';

import Cookie from './lib/cookie';
import { ErrType, is_error, fail } from './lib/util';

class GamePage implements Page {
    protected me: PublicPlayerInfo;
    protected scheme: Scheme;
    protected socket: SocketIOClient.Socket;

    public constructor() {
        this.socket = io();
    }

    public setup_html(): this {
        throw new Error("Method not implemented.");
    }

    public setup_socket(): this {
        throw new Error("Method not implemented.");
    }

    public async validate() {
        let join_result = await new Promise((resolve, reject) => {
            this.socket.emit(
                'client:game#join',
                Cookie.get('room'), Cookie.get('id'),
                resolve
            );
            setTimeout(reject, 3000);
        }) as ErrType | { me: PublicPlayerInfo, scheme: Scheme };

        if (is_error(join_result)) {
            fail(join_result.error);
        } else {
            this.me = join_result.me;
            this.scheme = join_result.scheme;
        }

        return this;
    }

    public async finalize() {
        this.socket.emit('client:game#ready');
        return this;
    }
}

new GamePage()
    .setup_html()
    .setup_socket()
    .validate()
    .then(page => page.finalize());
