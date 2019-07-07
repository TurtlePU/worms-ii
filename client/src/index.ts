import * as Cookie from './js/cookie';
import { $, request } from './js/util';

/** Reconnect button. */
var a_back: HTMLAnchorElement;

/** Join button. */
var a_join: HTMLAnchorElement;

/** 'Join random' button. */
var b_rand: HTMLButtonElement;

/** Input of room id. */
var inp_room: HTMLInputElement;

function main() {
    a_back = <HTMLAnchorElement> $('a-back');
    a_join = <HTMLAnchorElement> $('a-join');
    b_rand = <HTMLButtonElement> $('b-rand');
    inp_room = <HTMLInputElement> $('inp-room');

    a_back.href += Cookie.get('room');

    a_join.addEventListener('click', () => {
        a_join.href += inp_room.value.replace(/\s/g, '');
    });

    b_rand.addEventListener('click', async () => {
        inp_room.value = await request('/.room.join_id', 'text');
        a_join.click();
    });

    inp_room.addEventListener('keypress', event => {
        if (event.key == 'Enter') {
            a_join.click();
        }
    });
}

main();
