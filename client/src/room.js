import { $ } from './js/util';

/**
 * @type {HTMLAnchorElement}
 */
var a_back;

/**
 * @type {HTMLInputElement}
 */
var inp_ready;

/**
 * @type {HTMLButtonElement}
 */
var b_start;

/**
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
var public_id;

/**
 * @type {string}
 */
var room_id;

async function main() {
    a_back = $('a-back');
    inp_ready = $('inp-ready');
    b_start = $('b-start');
    t_room = $('t-room');

    a_back.addEventListener('click', () => {
        socket.emit('client:room#leave');
    });

    inp_ready.addEventListener('click', () => {
        socket.emit('client:room#ready');
    });

    b_start.addEventListener('click', () => {
        socket.emit('client:room#start');
    });

    public_id = await (await fetch('/room.get_me')).text();

    room_id = document.location.pathname.match(/\/room\/(.*)/)[1];

    socket = io();

    socket.on('server:room#join', id => display_socket(id))
          .on('server:room#ready', id => swap($(`ready-${id}`)))
          .on('server:room#first', id => $(`first-${id}`).innerText = first_sign(true))
          .on('server:room#enable', enabled => b_start.enabled = enabled)
          .on('server:room#leave', id => t_room.removeChild($(`socket-${id}`)))
          .on('server:room#start', () => window.location.href = `game/${room_id}`);

    socket.emit('client:room#join', room_id);
}

function display_socket(id, ready = false, first = false) {
    if ($(`socket-${id}`)) {
        return;
    }
    let row = t_room.insertRow();
    row.id = `socket-${id}`;
    row.innerHTML = html`
        <td>${id}</td>
        <td id="ready-${id}">${ready_sign(ready)}</td>
        <td>${is_me_sign(id)}</td>
        <td id="first-${id}">${first_sign(first)}</td>
    `;
}

function is_me_sign(id) {
    return id == public_id ? '⬅️' : '';
}

const not_ready = '❌';

function ready_sign(ready) {
    return ready ? '✔️' : not_ready;
}

/**
 * @param {HTMLTableCellElement} sign
 */
function swap(sign) {
    sign.innerText = ready_sign(sign.innerText == not_ready);
}

function first_sign(first) {
    return first ? '🥇' : '';
}

main();
