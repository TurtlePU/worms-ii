/// <reference path="../../../shared/types.d.ts"/>

import Cookie from './cookie';

export type ErrType = { error: string };

export function is_error<T> (obj: ErrType | T): obj is ErrType {
    return (obj as ErrType).error !== undefined;
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

export async function try_start_game(this: Phaser.Scene) {
    let check_result = await request(
        `/.game.has_player/game=${Cookie.get('room')}/player=${Cookie.get('id')}`,
    'json') as CheckResponse;
    if (check_result.response) {
        this.scene.start('GameScene');
    }
}
