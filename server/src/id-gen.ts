const { floor, pow, random } = Math;

/**
 * Current random permutation.
 */
var id: IterableIterator<number>;

/**
 * Generator of random permutation (1 .. N).
 * @param N
 */
function* ShuffledGenerator(N: number) {
    let index = 0;
    let order = shuffle([...new Array(N).keys()]);
    while (index < order.length) {
        yield order[index++];
    }
}

/**
 * Random shuffle on array.
 * @param array
 * @returns same array, randomly shuffled.
 */
function shuffle(array: any[]) {
    for (let i = array.length - 1; i != 0; --i) {
        let j = floor(random() * (i + 1));
        [ array[i], array[j] ] = [ array[j], array[i] ];
    }
    return array;
}

/**
 * Digits of beautiful ids.
 */
var digits: string[];

/**
 * Length of beautiful ids.
 */
var idLength: number;

/**
 * Casts given number to the beautiful base.
 * @param num a number.
 * @returns string in result of cast.
 */
function to_string(num: number) {
    let ans = '', n = digits.length;
    for (let i = 0; i != idLength; ++i) {
        ans += `-${digits[num % n]}`;
        num = floor(num / n);
    }
    return ans.substr(1);
}

/**
 * Prepares generator of beautiful ids.
 * @param words digits of beautiful ids.
 * @param length length of beautiful ids.
 */
export function init_id_generator(words: string[], length: number) {
    digits = words;
    idLength = length;
    const N = pow(digits.length, length);
    id = ShuffledGenerator(N);
};

/**
 * Returns a new beautiful id.
 */
export function next_id() {
    let nxt = id.next();
    if (nxt.done) {
        throw new RangeError('All IDs are used');
    }
    return to_string(nxt.value);
};

/**
 * Casts several first chars of given id to the beatiful id.
 * @param socket_id given id.
 * @returns casted chars.
 */
export function beautify(socket_id: string) {
    let number = socket_id
        .substr(0, idLength)
        .split('')
        .map(char => char.charCodeAt(0) % digits.length)
        .reduce((number, digit) => number * digits.length + digit);
    return to_string(number);
}
