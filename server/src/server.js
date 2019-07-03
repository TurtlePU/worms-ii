import express from 'express';
import http    from 'http';
import os      from 'os';
import path    from 'path';

const folder = process.env.DEV_SERVER ? 'dist' : 'build';
const port   = +process.env.PORT || 3000;

const client = path.join(__dirname, `../../client/${folder}/`);

const app = express();
const server = new http.Server(app);

app.get('/', (_, res) => {
    res.sendFile(path.join(client, 'index.html'));
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
