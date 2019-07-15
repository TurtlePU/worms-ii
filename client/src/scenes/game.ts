import 'phaser';

import Cookie from '../lib/Cookie';

import OverlayedScene from './overlayed';
import { ErrType, is_error } from '../lib/util';

export default class GameScene extends OverlayedScene
{
    protected me: PublicPlayerInfo;
    protected scheme: Scheme;
    protected socket: SocketIOClient.Socket;
    protected watcher: EventTarget;

    public constructor ()
    {
        super({ key: 'game' }, 'assets/overlay/game.html');
        this.watcher = new EventTarget();
    }

    public init (
        args: {
            socket: SocketIOClient.Socket
        }
    ) {
        this.socket = args.socket;
        this.setup_socket();
        this.validate();
    }

    public create ()
    {
        super.create();

        if (!this.me) {
            this.watcher.addEventListener('me-set', () => this.emit_ready());
        } else {
            this.emit_ready();
        }
    }

    protected setup_overlay_fields ()
    {
        // TODO: game overlay
    }

    protected setup_overlay_behavior ()
    {
        // TODO: game overlay behaviour
    }

    protected setup_socket ()
    {
        // TODO: socket events
    }

    protected emit_ready ()
    {
        this.socket.emit('client:game#ready');
    }

    protected async validate ()
    {
        let join_result = await new Promise((resolve, reject) => {
            this.socket.emit(
                'client:game#join',
                Cookie.get('room'), Cookie.get('id'),
                resolve
            );
            setTimeout(reject, 3000);
        }) as ErrType | { me: PublicPlayerInfo, scheme: Scheme };

        if (is_error(join_result)) {
            this.scene.start('join', { error: join_result.error, socket: this.socket });
        } else {
            this.me = join_result.me;
            this.scheme = join_result.scheme;
            this.watcher.dispatchEvent(new Event('me-set'));
            console.log('succ');
        }
    }
}
