import express from 'express';
import http from 'http';
import os from 'os';
import path from 'path';
import socket from 'socket.io';

import { init_id_generator } from './util/id-gen';

import { setup_game_api } from './game/api';
import { Game } from './game/class';

import { setup_room_api } from './room/api';
import { Room } from './room/class';
import { RoomWatcher } from './room/watcher';

import words from '../data/id-digits.json';

const folder = process.env.DEV_SERVER ? 'dist' : 'build';
const port   = +process.env.PORT || 3000;

const client_dir = path.join(__dirname, `../../client/${folder}/`);

init_id_generator(words, 3);

const app = express();
const server = new http.Server(app);
const io = socket(server);

app.use('/', express.static(client_dir));
app.use('/assets', express.static(path.join(__dirname, '../../client/assets')));

app.get('/', (_, res) => {
    res.sendFile(path.join(client_dir, 'index.html'));
});

setup_room_api(app, io);
setup_game_api(app, io);

RoomWatcher.instance.on('game_started', (room: Room) => {
    console.log('start');
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
