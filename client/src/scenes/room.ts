import 'phaser';
import io from 'socket.io-client';

import Cookie from '../lib/cookie';
import { request, ErrType, is_error } from '../lib/util';

import OverlayedScene from './overlayed';

export default class RoomScene extends OverlayedScene {
    /** 'Back' button. */
    protected b_back: HTMLButtonElement;
    /** 'Start' button. */
    protected b_start: HTMLButtonElement;
    /** Checkbox for state: ready/not ready. */
    protected inp_ready: HTMLInputElement;
    /** List of players. */
    protected t_room: HTMLTableSectionElement;

    protected me: string;
    protected room_id: string;
    protected socket: SocketIOClient.Socket;

    public constructor() {
        super({ key: 'RoomScene' }, 'assets/room.html');
    }

    public init(param: { room_id: string }) {
        this.room_id = param.room_id;
    }

    public create() {
        super.create();
        this.setup_socket();
        this.validate().then(() => this.finalize());
    }

    protected display_socket(id: string, ready?: boolean, is_me?: boolean, first?: boolean) {
        if (this.$(`socket-${id}`)) {
            return;
        }
        let row = this.t_room.insertRow();
        row.id = `socket-${id}`;
        row.innerHTML = `
            <td>${id}</td>
            <td id="ready-${id}">${ready_sign(ready)}</td>
            <td>${is_me_sign(is_me)}</td>
            <td id="first-${id}">${first_sign(first)}</td>
        `;
    }

    protected setup_overlay_fields() {
        this.b_back = <HTMLButtonElement> this.$('b-back');
        this.b_start = <HTMLButtonElement> this.$('b-start');
        this.inp_ready = <HTMLInputElement> this.$('inp-ready');
        this.t_room = <HTMLTableSectionElement> this.$('t-room');
    }

    protected setup_overlay_behavior(): void {
        this.b_back.onclick = () => {
            this.socket.disconnect();
            this.scene.start('JoinScene');
        }

        this.b_start.onclick = () =>
            this.socket.emit('client:room#start');

        this.inp_ready.onclick = () =>
            this.socket.emit('client:room#ready', this.inp_ready.checked);
    }
    
    protected setup_socket() {
        (this.socket = io())
            .on('server:room#join', (id: string) => {
                this.display_socket(id);
            })
            .on('server:room#ready', (id: string, ready: boolean) => {
                this.$(`ready-${id}`).innerHTML = ready_sign(ready);
            })
            .on('server:room#first', (id: string) => {
                this.$(`first-${id}`).innerHTML = first_sign(true);
            })
            .on('server:room#enable', (enabled: boolean) => {
                this.b_start.disabled = !enabled;
            })
            .on('server:room#leave', (id: string) => {
                this.t_room.removeChild(this.$(`socket-${id}`));
            })
            .on('server:game#start', async () => {
                Cookie.set('id', this.socket.id);
                Cookie.set('room', this.room_id);
                let check_result = await request(
                    `/.game.has_player/game=${this.room_id}/player=${this.socket.id}`,
                'json') as CheckResponse;
                if (check_result.response) {
                    this.socket.disconnect();
                    this.scene.start('GameScene');
                }
            });
    }

    protected async validate() {
        let join_result: ErrType | { me: string } = await new Promise((resolve, reject) => {
            this.socket.emit('client:room#join', this.room_id, resolve);
            setTimeout(reject, 10000);
        });

        if (is_error(join_result)) {
            this.socket.disconnect();
            this.scene.start('JoinScene', join_result);
        } else {
            this.me = join_result.me;
        }
    }

    protected async finalize() {
        let members: PlayerState[] = await request(`/.room.get_players/id=${this.room_id}`, 'json');
        for (let { id, ready } of members) {
            this.display_socket(id, ready, id == this.me, id == members[0].id);
        }
    }
}

function ready_sign(ready: boolean) {
    return ready ? '✔️' : '❌';
}

function is_me_sign(is_me: boolean) {
    return is_me ? '⬅️' : '';
}

function first_sign(first: boolean) {
    return first ? '🥇' : '';
}
