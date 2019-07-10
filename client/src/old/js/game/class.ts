import 'phaser';

import { Scene } from './scene';

export class Game extends Phaser.Game {
    constructor() {
        super({
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            scene: [ Scene ]
        });
    }
}
