/// <reference path="../../../shared/types.d.ts"/>

export function $ (id: string) {
    return document.getElementById(id);
}

export type ErrType = { error: string };

export function is_error<T> (obj: ErrType | T) : obj is ErrType {
    return (obj as ErrType).error !== undefined;
}

export async function request (
    href: string,
    type: 'blob' | 'buffer' | 'json' | 'text'
) {
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

export function game_has_player (
    room_id: string,
    player_id: string
) {
    return request(
        `/.game.has_player/game=${room_id}/player=${player_id}`,
    'json') as Promise<CheckResponse>;
}
