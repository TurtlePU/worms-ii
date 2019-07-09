const { floor, pow, random } = Math;

var id: IterableIterator<number>;

function* ShuffledGenerator(N: number) {
    let index = 0;
    let order = shuffle([...new Array(N).keys()]);
    while (index < order.length) {
        yield order[index++];
    }
}

function shuffle(array: any[]) {
    for (let i = array.length - 1; i != 0; --i) {
        let j = floor(random() * (i + 1));
        [ array[i], array[j] ] = [ array[j], array[i] ];
    }
    return array;
}

var digits: string[];
var id_length: number;

function to_string(num: number) {
    let ans = '', n = digits.length;
    for (let i = 0; i != id_length; ++i) {
        ans += `-${digits[num % n]}`;
        num = floor(num / n);
    }
    return ans.substr(1);
}

export function init_id_generator(words: string[], length: number) {
    digits = words;
    id_length = length;
    const N = pow(digits.length, length);
    id = ShuffledGenerator(N);
};

export function next_id() {
    let nxt = id.next();
    if (nxt.done) {
        throw new RangeError('All IDs are used');
    }
    return to_string(nxt.value);
};

export function beautify(id: string) {
    let number = id
        .substr(0, id_length)
        .split('')
        .map(char => char.charCodeAt(0) % digits.length)
        .reduce((number, digit) => number * digits.length + digit);
    return to_string(number);
}
