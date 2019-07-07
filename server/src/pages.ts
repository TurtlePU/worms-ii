import path from 'path';

/**
 * The collection of paths to the HTML pages in the project.
 * 
 * @export
 */
export var pages = new Map([['', '']]);

/**
 * Prepares ```pages```.
 * @see {@link pages}
 * 
 * @export
 * @param {string} client_dir A directory where all HTMLs are stored.
 */
export function setup_pages(client_dir) {
    pages = new Map(
        ['game', 'index', 'notfound', 'room'].map(name =>
            [name, path.join(client_dir, `${name}.html`)]
        )
    );
}
