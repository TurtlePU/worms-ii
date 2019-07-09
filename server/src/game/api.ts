import * as Express from 'express';
import SocketIO from 'socket.io';

import { pages } from '../util';

import { game_watcher } from './watcher';
import { dummy } from './dummy';

export function setup_game_api(app: Express.Application, io: SocketIO.Server) {
    setup_express_requests(app);
    setup_socket_events(io);
    game_watcher.use(io);
}

function setup_express_requests(app: Express.Application) {
    app.get('/game=:game_id?/player=:player_id?', (req, res) => {
        res.sendFile(pages.get(
            game_watcher.get(req.params.game_id).has_player(req.params.player_id)
            ? 'game' : 'notfound'
        ));
    });
}

function setup_socket_events(io: SocketIO.Server) {
    io.on('connection', (socket) => {
        var game = dummy;
        socket
            .on('client:game#join', (game_id: string, socket_id: string, ack: (result: any) => void) => {
                game = game_watcher.get(game_id);
                socket.join(game_id);
                if (game.join(socket_id, socket.id)) {
                    ack({ scheme: game.get_scheme() });
                } else {
                    socket.leave(game_id);
                    ack({ error: `Failed to join game ${game_id}.` });
                }
            })
            .on('client:game#ready', () => {
                game.set_ready(socket.id);
            })
            .on('disconnect', () => {
                game.hide_player(socket.id);
            });
    });
}