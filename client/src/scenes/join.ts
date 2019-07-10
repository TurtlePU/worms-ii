import 'phaser';

import { request, try_start_game } from '../lib/util';

import OverlayedScene from './overlayed';

export default class JoinScene extends OverlayedScene {
    /** Reconnect button. */
    protected b_back: HTMLButtonElement;
    /** Join button. */
    protected b_join: HTMLButtonElement;
    /** 'Join random' button. */
    protected b_rand: HTMLButtonElement;
    /** Input of room id. */
    protected inp_room: HTMLInputElement;

    public constructor() {
        super({ key: 'JoinScene' }, 'assets/join.html');
    }

    protected setup_overlay_fields() {
        this.b_back = <HTMLButtonElement> this.$('b-back');
        this.b_join = <HTMLButtonElement> this.$('b-join');
        this.b_rand = <HTMLButtonElement> this.$('b-rand');
        this.inp_room = <HTMLInputElement> this.$('inp-room');
    }

    protected setup_overlay_behavior() {
        this.b_back.onclick = () =>
            try_start_game.call(this);

        this.b_join.onclick = async () => {
            let room_id = this.inp_room.value.replace(/\s/g, '');
            let check_result = await request(
                `/.room.can_join/id=${room_id}`,
            'json') as CheckResponse;
            if (check_result.response) {
                this.scene.start('RoomScene', { room_id });
            }
        };

        this.b_rand.onclick = async () => {
            this.inp_room.value = await request('/.room.join_id', 'text');
            this.b_join.click();
        };

        this.inp_room.addEventListener('keypress', event => {
            if (event.key == 'Enter') {
                this.b_join.click();
            }
        });
    }
}
