import * as Express from 'express';
import SocketIO from 'socket.io';

import { beautify } from '~/util/id-gen';

import { Room } from './class';
import { dummy } from './dummy';
import { RoomWatcher } from './watcher';

export function setup_room_api(app: Express.Application, io: SocketIO.Server) {
    on_room_requests(app);
    on_room_events(io);
    RoomWatcher.instance.use(io);
}

function on_room_requests(application: Express.Application) {
    application
        .get('/.room.can_join/id=:room_id?', (req, res) => {
            res.send({
                response: RoomWatcher.instance
                    .can_join(req.params.room_id)
            } as CheckResponse);
        })
        .get('/.room.join_id', (_, res) => {
            if (!RoomWatcher.instance.has_lobbies()) {
                new Room();
            }
            res.send(RoomWatcher.instance.join_id());
        })
        .get('/.room.get_players/id=:room_id?', (req, res) => {
            res.send(RoomWatcher.instance.get(req.params.room_id).get_players());
        });
}

function on_room_events(io: SocketIO.Server) {
    io.on('connection', (socket) => {
        let room = dummy;
        socket
            .on('client:room#join', (room_id, clb) => {
                room = RoomWatcher.instance.get(room_id);
                socket.join(room_id);
                if (room.add_player(socket.id)) {
                    clb({ me: beautify(socket.id) });
                } else {
                    socket.leave(room_id);
                    clb({ error: `Failed to join room ${room_id}.` });
                }
            })
            .on('client:room#ready', (ready) => {
                room.set_ready(socket.id, ready);
            })
            .on('client:room#leave', () => {
                room.delete_player(socket.id);
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
