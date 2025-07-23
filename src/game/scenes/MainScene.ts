
import Phaser from 'phaser'

class MainScene extends Phaser.Scene {
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    player!: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };

    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.script('animatedTiles', '/phaser-plugins/AnimatedTiles.js');
        this.load.tilemapTiledJSON('map', '/assets/map.json');
        this.load.image('main_tiles', '/assets/tilesets/main_tiles.png');
        this.load.image('water', '/assets/tilesets/water.png');
    }

    create() {
        const canvas = this.game.canvas;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.padding = '0';
        canvas.style.margin = '0';

        const map = this.make.tilemap({ key: 'map' });
        const mainTiles = map.addTilesetImage('main_tiles', 'main_tiles');
        const water = map.addTilesetImage('water', 'water');

        if (!mainTiles || !water) {
            throw new Error("Tilesets not found. Check names in Tiled and preload().");
        }

        for (const layerData of map.layers) {
            const layer = map.createLayer(layerData.name, [mainTiles, water], 0, 0);

            // Enable collision if tiles have the `collides` property
            if (layer) {
                layer.setCollisionByProperty({ collides: true });
                
                //to debug collision
                // layer.renderDebug(this.add.graphics(), {
                //     tileColor: null,
                //     collidingTileColor: new Phaser.Display.Color(255, 0, 0, 100),
                //     faceColor: new Phaser.Display.Color(255, 255, 0, 255)
                // });

            }
        }

        this.load.once('complete', () => {
            // @ts-ignore
            if (window.animatedTiles && window.animatedTiles.init) {
                window.animatedTiles.init(this, map); // ✅ just call init()
            }
        });
        this.load.start();

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        
        const playerRect = this.add.rectangle(100, 100, 32, 32, 0xff0000);
        this.physics.add.existing(playerRect);
        this.player = playerRect as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
        this.player.body.setCollideWorldBounds(true);

        for (const layer of map.layers) {
            const tilemapLayer = map.getLayer(layer.name)?.tilemapLayer;
            if (tilemapLayer) {
            this.physics.add.collider(this.player, tilemapLayer);
            }
        }
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        if (!this.player || !this.player.body) return;

        const speed = 100;
        this.player.body.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(speed);
        }

        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(speed);
        }
    }
}

export default MainScene;
