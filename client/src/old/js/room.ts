/// <reference path="../../../../shared/types.d.ts"/>
/// <reference path="./lib/page.d.ts"/>

import io from 'socket.io-client';

import Cookie from './lib/cookie';
import { $, fail, request, ErrType, is_error } from './lib/util';

class RoomPage implements Page {
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
        this.b_start = <HTMLButtonElement> $('b-start');
        this.inp_ready = <HTMLInputElement> $('inp-ready');
        this.t_room = <HTMLTableSectionElement> $('t-room');
        this.room_id = window.location.pathname.match(/\/room=(.*)/)[1];
        this.socket = io();
    }

    public setup_html() {
        this.inp_ready.addEventListener('click', () => {
            this.socket.emit('client:room#ready', this.inp_ready.checked);
        });

        this.b_start.addEventListener('click', () => {
            this.socket.emit('client:room#start');
        });

        return this;
    }

    public setup_socket() {
        this.socket
            .on('server:room#join', (id: string) => {
                this.display_socket(id);
            })
            .on('server:room#ready', (id: string, ready: boolean) => {
                $(`ready-${id}`).innerText = ready_sign(ready);
            })
            .on('server:room#first', (id: string) => {
                $(`first-${id}`).innerText = first_sign(true);
            })
            .on('server:room#enable', (enabled: boolean) => {
                this.b_start.disabled = !enabled;
            })
            .on('server:room#leave', (id: string) => {
                this.t_room.removeChild($(`socket-${id}`));
            })
            .on('server:game#start', () => {
                Cookie.set('id', this.socket.id);
                Cookie.set('room', this.room_id);
                window.location.href = `/game=${this.room_id}/player=${this.socket.id}`;
            });
        
        return this;
    }

    public async validate() {
        let join_result: ErrType | { me: string } = await new Promise((resolve, reject) => {
            this.socket.emit('client:room#join', this.room_id, resolve);
            setTimeout(reject, 10000);
        });

        if (is_error(join_result)) {
            fail(join_result.error);
        } else {
            this.me = join_result.me;
        }

        return this;
    }

    public async finalize() {
        let members: PlayerState[] = await request(`/.room.get_players/id=${this.room_id}`, 'json');
        for (let { id, ready } of members) {
            this.display_socket(id, ready, id == this.me, id == members[0].id);
        }

        return this;
    }

    protected display_socket(id: string, ready?: boolean, is_me?: boolean, first?: boolean) {
        if ($(`socket-${id}`)) {
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
}

new RoomPage()
    .setup_html()
    .setup_socket()
    .validate()
    .then(page => page.finalize());

function ready_sign(ready: boolean) {
    return ready ? '✔️' : '❌';
}

function is_me_sign(is_me: boolean) {
    return is_me ? '⬅️' : '';
}

function first_sign(first: boolean) {
    return first ? '🥇' : '';
}
