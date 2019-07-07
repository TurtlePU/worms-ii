/**
 * Shortcut for `document.getElementById`.
 * Pure.
 * @param id id of an element
 */
export function $ (id: string) {
    return document.getElementById(id);
}

/**
 * Shows error message & redirects to index.
 * Pure.
 * @param msg message to show.
 */
export function fail(msg: string) {
    alert(msg);
    window.location.href = '/';
}

/**
 * Small wrapper above fetch().
 * Pure.
 * @param href address of a request.
 * @param type type of a response.
 * @returns response of given type.
 */
export async function request(href: string, type: 'blob' | 'buffer' | 'json' | 'text') {
    let res = await fetch(href);
    switch (type) {
        case 'text':
            return res.text();
        case 'json':
            return res.json();
        case 'blob':
            return res.blob();
        case 'buffer':
            return res.arrayBuffer();
    }
}
