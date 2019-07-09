export function array_map<T>(N: number, map: (index: number) => T) {
    return [...new Array(N).keys()].map(map);
}
