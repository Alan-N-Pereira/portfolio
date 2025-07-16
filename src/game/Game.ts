import Phaser from 'phaser'
import MainScene from './scenes/MainScene'

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-container',
    backgroundColor: '#1d1d1d',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [MainScene]
}

class Game extends Phaser.Game{
    constructor(){
        super(config)
    }
}

export default Game