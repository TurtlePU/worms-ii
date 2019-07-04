/**
 * Shorthand for ```document.getElementById```.
 * 
 * @export
 * @param {string} id id of an element
 */
export function $ (id) {
    return document.getElementById(id);
}

/**
 * Shows error message & redirects to index.
 *
 * @export
 * @param {string} msg
 */
export function fail(msg) {
    alert(msg);
    window.location.href = '/';
}

/**
 * Small wrapper above fetch().
 *
 * @export
 * @param {string} href
 * @param {'blob' | 'buffer' | 'json' | 'text'} type
 * @returns
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
