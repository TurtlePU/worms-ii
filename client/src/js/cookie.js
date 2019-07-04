/**
 * Gets a cookie by given name.
 * Pure.
 * 
 * @export
 * @param {string} name name of the cookie.
 * @returns cookie by given name.
 */
export function get(name) {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

/**
 * Sets new cookie on given name.
 * No side effects.
 *
 * @export
 * @param {string} name name of the new cookie.
 * @param {string} value cookie itself.
 * @param {{ expires?: number | Date }} [options={}] options of a cookie. 
 */
export function set(name, value, options = {}) {
    if (options.expires) {
        if (typeof options.expires == 'number') {
            let d = new Date();
            d.setTime(d.getTime() + options.expires * 1000);
            options.expires = d;
        } else if (options.expires instanceof Date) {
            options.expires = options.expires.toUTCString();
        }
    }

    value = encodeURIComponent(value);

    let updatedCookie = `${name}=${value}`;

    for (let propName in options) {
        updatedCookie += `;${propName}`;
        var propValue = options[propName];
        if (propValue !== true) {
            updatedCookie += `=${propValue}`;
        }
    }

    document.cookie = updatedCookie;
}