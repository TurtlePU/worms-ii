import path from 'path';

/**
 * The collection of paths to the HTML pages in the project.
 */
export var pages: Map<string, string>;

/**
 * Prepares `pages`.
 * @see {@link pages}
 * @param client_dir A directory where all HTMLs are stored.
 */
export function setup_pages(client_dir: string) {
    pages = new Map(
        ['game', 'index', 'notfound', 'room'].map(name =>
            [name, path.join(client_dir, `${name}.html`)]
        )
    );
}
