import 'phaser';

import { $, request, game_has_player } from '../lib/util';
import Cookie from '../lib/Cookie';

import OverlayedScene from './overlayed';

export default class JoinScene extends OverlayedScene
{
    /** Reconnect button. */
    protected b_back: HTMLButtonElement;
    /** Join button. */
    protected b_join: HTMLButtonElement;
    /** 'Join random' button. */
    protected b_rand: HTMLButtonElement;
    /** Input of room id. */
    protected inp_room: HTMLInputElement;

    protected socket: SocketIOClient.Socket;

    public constructor ()
    {
        super({ key: 'join' }, 'assets/overlay/join.html');
    }

    public init (
        args: {
            socket: SocketIOClient.Socket
        }
    ) {
        this.socket = args.socket;
    }

    protected setup_overlay_fields ()
    {
        this.b_back = <HTMLButtonElement> $('b-back');
        this.b_join = <HTMLButtonElement> $('b-join');
        this.b_rand = <HTMLButtonElement> $('b-rand');
        this.inp_room = <HTMLInputElement> $('inp-room');
    }

    protected setup_overlay_behavior ()
    {
        this.b_back.onclick = async () => {
            let res = await game_has_player(Cookie.get('room'), Cookie.get('id'));
            if (res.response) {
                this.scene.start('game', { socket: this.socket });
            }
        }

        this.b_join.onclick = async () => {
            let room_id = this.inp_room.value.replace(/\s/g, '');
            let check_result = await request(
                `/.room.can_join/id=${room_id}`,
            'json') as CheckResponse;
            if (check_result.response) {
                this.scene.start('room', { room_id, socket: this.socket });
            }
        };

        this.b_rand.onclick = async () => {
            this.inp_room.value = await request('/.room.join_id', 'text');
            this.b_join.click();
        };

        this.inp_room.addEventListener('keypress', (event) => {
            if (event.key == 'Enter') {
                this.b_join.click();
            }
        });
    }
}
