/**
 * Shortcut for `document.getElementById`.
 * Pure.
 * 
 * @export
 * @param {string} id id of an element
 */
export function $ (id) {
    return document.getElementById(id);
}

/**
 * Shows error message & redirects to index.
 * Pure.
 *
 * @export
 * @param {string} msg message to show.
 */
export function fail(msg) {
    alert(msg);
    window.location.href = '/';
}

/**
 * Small wrapper above fetch().
 * Pure.
 *
 * @export
 * @param {string} href address of a request.
 * @param {'blob' | 'buffer' | 'json' | 'text'} type type of a response.
 * @returns response of given type.
 */
export async function request(href, type) {
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
