function get (name: string)
{
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function set (
    name: string,
    value: string,
    options: {
        expires?: number | Date | string
    } = {}
) {
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

export default { get, set };
