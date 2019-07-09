import express from 'express';
import http    from 'http';
import os      from 'os';
import path    from 'path';
import socket  from 'socket.io';

import { init_id_generator } from './id-gen';
import { setup_pages, pages } from './util';
import { RoomWatcher, on_room_events, on_room_requests, Room } from './room';

import { setup_game_api } from './game/api';
import { Game } from './game/class';

import words from '../data/id-digits.json';

const folder = process.env.DEV_SERVER ? 'dist' : 'build';
const port   = +process.env.PORT || 3000;

const client_dir = path.join(__dirname, `../../client/${folder}/`);

setup_pages(client_dir);
init_id_generator(words, 3);

const app = express();
const server = new http.Server(app);
const io = socket(server);

app.use(express.static(client_dir));

app.get('/', (_, res) => {
    res.sendFile(pages.get('index'));
});

on_room_requests(app);
on_room_events(io);

setup_game_api(app, io);

RoomWatcher.on('start', (room: Room) => {
    new Game(room);
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
