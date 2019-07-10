/// <reference path="./lib/page.d.ts"/>

import Cookie from './lib/cookie';
import { $, request } from './lib/util';

class IndexPage implements Page {
    /** Reconnect button. */
    protected a_back: HTMLAnchorElement;
    /** Join button. */
    protected a_join: HTMLAnchorElement;
    /** 'Join random' button. */
    protected b_rand: HTMLButtonElement;
    /** Input of room id. */
    protected inp_room: HTMLInputElement;

    public constructor() {
        this.a_back = <HTMLAnchorElement> $('a-back');
        this.a_join = <HTMLAnchorElement> $('a-join');
        this.b_rand = <HTMLButtonElement> $('b-rand');
        this.inp_room = <HTMLInputElement> $('inp-room');
    }

    public setup_html() {
        this.a_back.href = `/game=${Cookie.get('room')}/player=${Cookie.get('id')}`;

        this.a_join.addEventListener('click', () => {
            this.a_join.href = `/room=${this.inp_room.value.replace(/\s/g, '')}`;
        });

        this.b_rand.addEventListener('click', async () => {
            this.inp_room.value = await request('/.room.join_id', 'text');
            this.a_join.click();
        });

        this.inp_room.addEventListener('keypress', event => {
            if (event.key == 'Enter') {
                this.a_join.click();
            }
        });

        return this;
    }

    public setup_socket(): this {
        throw new Error("Method not implemented.");
    }

    public validate(): Promise<this> {
        throw new Error("Method not implemented.");
    }

    public finalize(): Promise<this> {
        throw new Error("Method not implemented.");
    }
}

new IndexPage().setup_html();
