import 'phaser';

import io from 'socket.io-client';

import JoinScene from './scenes/join';
import RoomScene from './scenes/room';
import GameScene from './scenes/game';

class WormsGame extends Phaser.Game
{
    constructor ()
    {
        super({
            title: 'Worms II',
            width: 800,
            height: 600,
            backgroundColor: 0xFFFFFF,
            parent: 'game',
            dom: {
                createContainer: true
            },
            scene: [ JoinScene, RoomScene, GameScene ]
        });
    }
}

window.onload = () => {
    let game = new WormsGame();
    game.scene.start('join', { socket: io() });
};
