import express from 'express';
import http    from 'http';
import os      from 'os';
import path    from 'path';

const folder = process.env.DEV_SERVER ? 'dist' : 'build';
const port   = +process.env.PORT || 3000;

const client_dir = path.join(__dirname, `../../client/${folder}/`);
const pages = new Map(
    ['game', 'index', 'notfound', 'room'].map(name =>
        [name, path.join(client_dir, `${name}.html`)]
    )
);

const app = express();
const server = new http.Server(app);

app.use(express.static(client_dir));

app.get('/', (_, res) => {
    res.sendFile(pages.get('index'));
});

// TODO
const Games = {
    can_join: (_, __) => false
};

app.get('/game/:gameId?/socket/:socketId?', (req, res) => {
    res.sendFile(pages.get(
        Games.can_join(req.params.gameId, req.params.socketId)
        ? 'game' : 'notfound'
    ));
});

// TODO
const Rooms = {
    join_id: () => 'a',
    can_join: _ => false
};

app.get('/room_id', (_, res) => {
    res.send(Rooms.join_id());
});

app.get('/room/:roomId?', (req, res) => {
    res.sendFile(pages.get(
        Rooms.can_join(req.params.roomId)
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
