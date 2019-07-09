import path from 'path';

export var pages: Map<string, string>;

export function setup_pages(client_dir: string) {
    pages = new Map(
        ['game', 'index', 'notfound', 'room'].map(name =>
            [name, path.join(client_dir, `${name}.html`)]
        )
    );
}

export function array_map<T>(N: number, map: (index: number) => T) {
    return [...new Array(N).keys()].map(map);
}
