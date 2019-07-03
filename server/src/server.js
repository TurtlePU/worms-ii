import express from 'express';
import http    from 'http';
import os      from 'os';
import path    from 'path';
import socket  from 'socket.io';

import { init_id_generator } from './id-gen';
import { Room, on_room_events } from './room';
import { Game, on_game_events } from './game';

import words from '../data/id-digits.json';

const folder = process.env.DEV_SERVER ? 'dist' : 'build';
const port   = +process.env.PORT || 3000;

const client_dir = path.join(__dirname, `../../client/${folder}/`);
const pages = new Map(
    ['game', 'index', 'notfound', 'room'].map(name =>
        [name, path.join(client_dir, `${name}.html`)]
    )
);

init_id_generator(words, 3);

const app = express();
const server = new http.Server(app);
const io = socket(server);

app.use(express.static(client_dir));

app.get('/', (_, res) => {
    res.sendFile(pages.get('index'));
});

app.get('/game/:game_id?/socket/:socket_id?', (req, res) => {
    res.sendFile(pages.get(
        Game.can_join(req.params.game_id, req.params.socket_id)
        ? 'game' : 'notfound'
    ));
});

app.get('/.room_id', (_, res) => {
    res.send(Room.join_id());
});

app.get('/room/:room_id?', (req, res) => {
    res.sendFile(pages.get(
        Room.can_join(req.params.room_id)
        ? 'room' : 'notfound'
    ));
});

server.listen(port, () => {
    for (let ifaceinfo of Object.values(os.networkInterfaces())) {
        for (let iface of ifaceinfo) {
            if (!iface.internal && iface.family == 'IPv4') {
                console.log(`Listening on http://${iface.address}:${port}`);
            }
        }
    }
});

io.on('connection', socket => {
    socket.on('disconnect', () => {
        Room.delete_socket(socket.id);
        Game.delete_socket(socket.id);
    });
    on_room_events(socket);
    on_game_events(socket);
});
