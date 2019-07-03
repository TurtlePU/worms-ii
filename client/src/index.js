import * as Cookie from './js/cookie';
import { $ } from './js/util';

/**
 * @type {HTMLAnchorElement}
 */
var a_back;

/**
 * @type {HTMLAnchorElement}
 */
var a_join;

/**
 * @type {HTMLButtonElement}
 */
var b_rand;

/**
 * @type {HTMLInputElement}
 */
var inp_room;

function main() {
    a_back = $('a-back');
    a_join = $('a-join');
    b_rand = $('b-rand');
    inp_room = $('inp-room');

    a_back.href += Cookie.get('room');

    a_join.addEventListener('click', () => {
        a_join.href += inp_room.value.replace(/\s/g, '');
    });

    b_rand.addEventListener('click', async () => {
        inp_room.value = await (await fetch('/room_id')).text();
        a_join.click();
    });

    inp_room.addEventListener('keypress', event => {
        if (event.key == 'Enter') {
            a_join.click();
        }
    });
}

main();
