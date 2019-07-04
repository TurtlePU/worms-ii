import path from 'path';

export var pages = new Map([['', '']]);

export function setup_pages(client_dir) {
    pages = new Map(
        ['game', 'index', 'notfound', 'room'].map(name =>
            [name, path.join(client_dir, `${name}.html`)]
        )
    );
}
