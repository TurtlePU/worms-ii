import * as Express from 'express';
import SocketIO from 'socket.io';

import { beautify } from '../id-gen';
import { pages } from '../util';

import { Room } from './class';
import { dummy } from './dummy';
import { RoomWatcher } from './watcher';

export function setup_room_api(app: Express.Application, io: SocketIO.Server) {
    on_room_requests(app);
    on_room_events(io);
    RoomWatcher.instance().use(io);
}

function on_room_requests(application: Express.Application) {
    application
        .get('/room=:room_id?', (req, res) => {
            res.sendFile(pages.get(
                RoomWatcher.instance().can_join(req.params.room_id)
                ? 'room' : 'notfound'
            ));
        })
        .get('/.room.join_id', (_, res) => {
            if (!RoomWatcher.instance().has_lobbies()) {
                new Room();
            }
            res.send(RoomWatcher.instance().join_id());
        })
        .get('/.room.get_players/id=:room_id', (req, res) => {
            res.send(RoomWatcher.instance().get(req.params.room_id).get_players());
        });
}

function on_room_events(io: SocketIO.Server) {
    io.on('connection', (socket) => {
        let room = dummy;
        socket
            .on('client:room#join', (room_id, clb) => {
                room = RoomWatcher.instance().get(room_id);
                if (room.add_player(socket.id)) {
                    socket.join(room_id);
                    clb({ me: beautify(socket.id) });
                } else {
                    clb({ error: `Failed to join room ${room_id}.` });
                }
            })
            .on('client:room#ready', (ready) => {
                room.set_ready(socket.id, ready);
            })
            .on('client:room#start', () => {
                if (room.player_index(socket.id) == 0) {
                    room.start_game();
                }
            })
            .on('disconnect', () => {
                room.delete_player(socket.id);
            });
    });
}
