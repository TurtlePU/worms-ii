import io from 'socket.io-client';

import * as Cookie from './js/cookie';
import { $, fail, request } from './js/util';

/**
 * Checkbox for state: ready/not ready.
 * @type {HTMLInputElement}
 */
var inp_ready;

/**
 * 'Start' button.
 * @type {HTMLButtonElement}
 */
var b_start;

/**
 * List of players.
 * @type {HTMLTableSectionElement}
 */
var t_room;

/**
 * @type {SocketIOClient.Socket}
 */
var socket;

/**
 * @type {string}
 */
var room_id;

async function main() {
    inp_ready = $('inp-ready');
    b_start = $('b-start');
    t_room = $('t-room');

    inp_ready.addEventListener('click', () => {
        console.log(inp_ready.checked);
        socket.emit('client:room#ready', inp_ready.checked);
    });

    b_start.addEventListener('click', () => {
        socket.emit('client:room#start');
    });

    room_id = window.location.pathname.match(/\/room=(.*)/)[1];

    socket = io();

    let join_result = await new Promise((resolve, reject) => {
        socket.emit('client:room#join', room_id, resolve);
        setTimeout(reject, 10000);
    });
    if (join_result.error) {
        return fail(join_result.error);
    }
    let me = join_result.me;

    let members = await request(`/.room.get_members/id=${room_id}`, 'json');
    console.log(members);
    for (let { id, ready } of members) {
        display_socket(id, ready, id == me, id == members[0].id);
    }

    socket
        .on('server:room#join', (id) => {
            display_socket(id);
        })
        .on('server:room#ready', (id, ready) => {
            $(`ready-${id}`).innerText = ready_sign(ready);
        })
        .on('server:room#first', (id) => {
            $(`first-${id}`).innerText = first_sign(true);
        })
        .on('server:room#enable', (enabled) => {
            console.log(b_start);
            b_start.disabled = !enabled;
        })
        .on('server:room#leave', (id) => {
            t_room.removeChild($(`socket-${id}`));
        })
        .on('server:game#start', () => {
            Cookie.set('id', socket.id);
            Cookie.set('room', room_id);
            window.location.href = `game/${room_id}`;
        });
}

/**
 * Adds new line to the players list.
 * No side effects.
 *
 * @param {string} id id of a player.
 * @param {boolean} [ready=false] true if player is ready.
 * @param {boolean} [is_me=false] true if player is this client.
 * @param {boolean} [first=false] true if player is an admin.
 */
function display_socket(id, ready = false, is_me = false, first = false) {
    if ($(`socket-${id}`)) {
        return;
    }
    let row = t_room.insertRow();
    row.id = `socket-${id}`;
    row.innerHTML = `
        <td>${id}</td>
        <td id="ready-${id}">${ready_sign(ready)}</td>
        <td>${is_me_sign(is_me)}</td>
        <td id="first-${id}">${first_sign(first)}</td>
    `;
}

/**
 * Emoji to show readiness of a player.
 * Pure.
 *
 * @param {boolean} ready true if player is ready.
 * @returns an emoji.
 */
function ready_sign(ready) {
    return ready ? '✔️' : '❌';
}

/**
 * Emoji to show _this_ player.
 * Pure.
 *
 * @param {boolean} is_me true if a player is this client.
 * @returns an emoji or empty string.
 */
function is_me_sign(is_me) {
    return is_me ? '⬅️' : '';
}

/**
 * Emoji to show an admin.
 * Pure.
 *
 * @param {boolean} first true if a player is an admin.
 * @returns an emoji or empty string.
 */
function first_sign(first) {
    return first ? '🥇' : '';
}

main();
