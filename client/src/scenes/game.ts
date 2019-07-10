import 'phaser';
import io from 'socket.io-client';

import Cookie from '../lib/cookie';

import OverlayedScene from './overlayed';
import { ErrType, is_error } from '../lib/util';

export default class GameScene extends OverlayedScene {
    protected me: PublicPlayerInfo;
    protected scheme: Scheme;
    protected socket: SocketIOClient.Socket;

    public constructor() {
        super({ key: 'GameScene' }, 'assets/game.html');
    }

    public create() {
        super.create();
        this.setup_socket();
        this.validate().then(() => this.finalize());
    }

    protected setup_overlay_fields(): void {
        // TODO: game overlay
    }

    protected setup_overlay_behavior(): void {
        // TODO: game overlay behaviour
    }

    protected setup_socket() {
        this.socket = io();
        // TODO: socket events
    }

    protected async validate() {
        let join_result = await new Promise((resolve, reject) => {
            this.socket.emit(
                'client:game#join',
                Cookie.get('room'), Cookie.get('id'),
                resolve
            );
            setTimeout(reject, 3000);
        }) as ErrType | { me: PublicPlayerInfo, scheme: Scheme };

        if (is_error(join_result)) {
            this.socket.disconnect();
            this.scene.start('JoinScene', join_result);
        } else {
            this.me = join_result.me;
            this.scheme = join_result.scheme;
            console.log('succ');
        }
    }

    protected async finalize() {
        this.socket.emit('client:game#ready');
    }
}
