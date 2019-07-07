import io from 'socket.io-client';

import * as Cookie from './js/cookie';
import { $, fail, request } from './js/util';

/** Checkbox for state: ready/not ready. */
var inp_ready: HTMLInputElement;

/** 'Start' button. */
var b_start: HTMLButtonElement;

/** List of players. */
var t_room: HTMLTableSectionElement;

var socket: SocketIOClient.Socket;

var room_id: string;

async function main() {
    inp_ready = <HTMLInputElement> $('inp-ready');
    b_start = <HTMLButtonElement> $('b-start');
    t_room = <HTMLTableSectionElement> $('t-room');

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
    }) as ErrType | { me: string };
    if (isError(join_result)) {
        return fail(join_result.error);
    }
    let me = join_result.me;

    let members = await request(`/.room.get_members/id=${room_id}`, 'json');
    console.log(members);
    for (let { id, ready } of members) {
        display_socket(id, ready, id == me, id == members[0].id);
    }

    socket
        .on('server:room#join', (id: string) => {
            display_socket(id);
        })
        .on('server:room#ready', (id: string, ready: boolean) => {
            $(`ready-${id}`).innerText = ready_sign(ready);
        })
        .on('server:room#first', (id: string) => {
            $(`first-${id}`).innerText = first_sign(true);
        })
        .on('server:room#enable', (enabled: boolean) => {
            console.log(b_start);
            b_start.disabled = !enabled;
        })
        .on('server:room#leave', (id: string) => {
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
 * @param id id of a player.
 * @param true if player is ready.
 * @param true if player is this client.
 * @param true if player is an admin.
 */
function display_socket(id: string, ready?: boolean, is_me?: boolean, first?: boolean) {
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
 * @param ready true if player is ready.
 * @returns an emoji.
 */
function ready_sign(ready: boolean) {
    return ready ? '✔️' : '❌';
}

/**
 * Emoji to show _this_ player.
 * Pure.
 * @param is_me true if a player is this client.
 * @returns an emoji or empty string.
 */
function is_me_sign(is_me: boolean) {
    return is_me ? '⬅️' : '';
}

/**
 * Emoji to show an admin.
 * Pure.
 * @param first true if a player is an admin.
 * @returns an emoji or empty string.
 */
function first_sign(first: boolean) {
    return first ? '🥇' : '';
}

/**
 * Tests the type of server response.
 * @returns true if response is an error.
 */
function isError(res: ErrType | { me: string }): res is ErrType {
    return (res as ErrType).error !== undefined;
}

main();

type ErrType = { error: string };
