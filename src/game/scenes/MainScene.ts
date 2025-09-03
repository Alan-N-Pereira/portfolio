import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  player!: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };

  // control state
  private controlMode: 'keyboard' | 'mouse' = 'mouse';
  private mouseTarget?: Phaser.Math.Vector2;

  constructor() { super('MainScene'); }

  preload() {
    this.load.script('animatedTiles', '/phaser-plugins/AnimatedTiles.js');
    this.load.tilemapTiledJSON('map', '/assets/map.json');
    this.load.image('main_tiles', '/assets/tilesets/main_tiles.png');
    this.load.image('water', '/assets/tilesets/water.png');
  }

  create() {
    const canvas = this.game.canvas;
    Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block', padding: '0', margin: '0' });

    const map = this.make.tilemap({ key: 'map' });
    const mainTiles = map.addTilesetImage('main_tiles', 'main_tiles');
    const water = map.addTilesetImage('water', 'water');
    if (!mainTiles || !water) throw new Error('Tilesets missing');

    const layers: Record<string, Phaser.Tilemaps.TilemapLayer> = {};
    map.layers.forEach(ld => {
      const l = map.createLayer(ld.name, [mainTiles, water], 0, 0);
      if (l) layers[ld.name] = l;
    });

    // animated tiles
    this.load.once('complete', () => {
      // @ts-ignore
      if (window.animatedTiles?.init) window.animatedTiles.init(this, map);
    });
    this.load.start();

    // player (placeholder rect)
    const playerRect = this.add.rectangle(100, 100, 32, 32, 0xff0000);
    this.physics.add.existing(playerRect);
    this.player = playerRect as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setDamping(true);
    body.setDrag(1000, 1000);
    body.setMaxVelocity(120, 120);

    // world / camera
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.roundPixels = true;

    // input
    if (!this.input?.keyboard) throw new Error('Keyboard plugin missing');
    this.cursors = this.input.keyboard.createCursorKeys();

    // collisions (all except treeTop)
    Object.entries(layers).forEach(([name, l]) => {
      if (name !== 'treeTop') {
        l.setCollisionByProperty({ collides: true });
        this.physics.add.collider(this.player, l);
      }
    });
    layers['treeTop']?.setDepth(10);
    this.player.setDepth(5);

    // --- control mode switching ---
    // Mouse: only switch to mouse mode when the pointer actually moves
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.mouseTarget = new Phaser.Math.Vector2(p.worldX, p.worldY);
      if (this.controlMode !== 'mouse') {
        this.controlMode = 'mouse';
        // don't need to zero velocity here; drag will ease it into the new moveTo
      }
    });

    // Keyboard: any keydown switches to keyboard mode and clears mouse intent
    this.input.keyboard.on('keydown', () => {
      if (this.controlMode !== 'keyboard') {
        this.controlMode = 'keyboard';
        this.mouseTarget = undefined;       // <-- clear last mouse target
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0); // <-- stop any residual moveTo velocity
      }
    });
  }

  update() {
    if (!this.player?.body) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // --- keyboard mode ---
    if (this.controlMode === 'keyboard') {
      const SPEED = 140;
      let vx = 0, vy = 0;

      if (this.cursors.left?.isDown)  vx -= SPEED;
      if (this.cursors.right?.isDown) vx += SPEED;
      if (this.cursors.up?.isDown)    vy -= SPEED;
      if (this.cursors.down?.isDown)  vy += SPEED;

      body.setVelocity(vx, vy);

      // Stay in keyboard mode until the mouse moves (pointermove handler will flip modes).
      return;
    }

    // --- mouse mode ---
    if (this.mouseTarget) {
      const MOUSE_SPEED = 120; // slower, smoother
      const STOP_DIST = 10;

      const { x: tx, y: ty } = this.mouseTarget;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, tx, ty);

      if (dist > STOP_DIST) {
        this.physics.moveTo(this.player, tx, ty, MOUSE_SPEED);
      } else {
        body.setVelocity(0, 0);
      }
    } else {
      body.setVelocity(0, 0);
    }
  }
}

export default MainScene;