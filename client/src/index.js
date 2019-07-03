import * as Cookie from './js/cookie';
import $ from './js/util';

document.addEventListener('load', main);

/**
 * @type {HTMLAnchorElement}
 */
var a_back;

/**
 * @type {HTMLAnchorElement}
 */
var a_join;

/**
 * @type {HTMLInputElement}
 */
var inp_room;

function main() {
    a_back = $('a-back');
    a_join = $('a-join');
    inp_room = $('inp-room');

    a_back.href += Cookie.get('room');

    a_join.addEventListener('click', () => {
        a_join.href += inp_room.value.replace(/\s/g, '');
    });

    inp_room.addEventListener('keypress', event => {
        if (event.key == 'Enter') {
            a_join.click();
        }
    });
}
