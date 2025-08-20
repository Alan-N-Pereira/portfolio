
import Phaser from 'phaser'

class MainScene extends Phaser.Scene {
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    player!: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
    playerTarget?: Phaser.Math.Vector2;
    mouseMovedRecently: boolean = false;

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

        // Load all layers
        const layers: Record<string, Phaser.Tilemaps.TilemapLayer> = {};
        map.layers.forEach(layer => {
            layers[layer.name] = map.createLayer(layer.name, [mainTiles, water], 0, 0)!;
        });

        //water animation
        this.load.once('complete', () => {
            // @ts-ignore
            if (window.animatedTiles && window.animatedTiles.init) {
                // @ts-ignore
                window.animatedTiles.init(this, map); // ✅ just call init()
            }
        });
        this.load.start();

        //Create player
        const playerRect = this.add.rectangle(100, 100, 32, 32, 0xff0000);
        this.physics.add.existing(playerRect);
        this.player = playerRect as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
        this.player.body.setCollideWorldBounds(true);

        // Collide player with Tree Base
        const treeBaseLayer = layers['treeBase'];
        if (treeBaseLayer) {
            treeBaseLayer.setCollisionByProperty({ collides: true });
            this.physics.add.collider(this.player, treeBaseLayer);
        }

        // Ensure "Tree Top" layer is above player
        const treeTopLayer = layers['treeTop']
        if (treeTopLayer) {
            treeTopLayer.setDepth(10)
        }
        this.player.setDepth(5)
        
        // Camera bounds
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

        // Enable collision on all layers except "Tree Top"
        Object.entries(layers).forEach(([name, layer]) => {
            if (name !== 'treeTop' && layer) {
                layer.setCollisionByProperty({ collides: true });
                this.physics.add.collider(this.player, layer);
            }
        });

        // Bring Tree Top above player
        if (layers['treeTop']) {
            layers['treeTop'].setDepth(10); // ensure it's above the player
        }
        this.player.setDepth(5);

        //Input
        if (!this.input || !this.input.keyboard) {
            throw new Error("Input or keyboard plugin not initialized.");
        }
        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            this.playerTarget = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
            this.mouseMovedRecently = true;

        // Reset after 1 second
        this.time.delayedCall(0.01, () => {
            this.mouseMovedRecently = false;
        });
        });

    }

    update() {
        if (!this.player || !this.player.body) return;

        const speed = 100;
        const body = this.player.body;

        body.setVelocity(0);

        // Keyboard movement
        const left = this.cursors.left?.isDown;
        const right = this.cursors.right?.isDown;
        const up = this.cursors.up?.isDown;
        const down = this.cursors.down?.isDown;

        const isKeyboardPressed = left || right || up || down;

        if (isKeyboardPressed) {
            if (left) {
            body.setVelocityX(-speed);
            } else if (right) {
            body.setVelocityX(speed);
            }

            if (up) {
            body.setVelocityY(-speed);
            } else if (down) {
            body.setVelocityY(speed);
            }

            // Cancel current mouse target when using keyboard
            this.playerTarget = undefined;
            return;
        }

        // Mouse click-to-move
        if (this.playerTarget && this.mouseMovedRecently) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.playerTarget.x, this.playerTarget.y);

            if (dist > 4) {
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.playerTarget.x, this.playerTarget.y);
                body.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );
            }
        }
    }
}

export default MainScene;
