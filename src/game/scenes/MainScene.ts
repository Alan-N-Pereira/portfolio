import Phaser from 'phaser'

class MainScene extends Phaser.Scene{
    constructor(){
        super('MainScene')
    }

    preload() {
        //load assets from tiled map and sprites
        this.load.image('logo','/assets/logo.png')
    }
    
    create() {
        this.add.text(100,100,'Hello form Phaser!',{
            fontSize: '32px',
            color: '#ffffff'
        })
    }

    update(){
        //called every frame (game logic)
    }
}

export default MainScene