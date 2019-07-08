/**
 * Shortcut for `document.getElementById`.
 */
export function $ (id: string) {
    return document.getElementById(id);
}

export function fail(msg: string) {
    alert(msg);
    window.location.href = '/';
}

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
