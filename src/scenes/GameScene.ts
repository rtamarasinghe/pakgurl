export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Load game assets
    this.load.image('player', 'assets/player.png');
    this.load.image('wall', 'assets/wall.png');
    this.load.image('dot', 'assets/dot.png');
  }

  create(): void {
    if (!this.physics) {
      console.error('Physics system not available');
      return;
    }

    // Add player
    this.player = this.physics.add.sprite(400, 300, 'player');
    if (this.player) {
      this.player.setCollideWorldBounds(true);
    }

    // Setup keyboard controls
    if (!this.input || !this.input.keyboard) {
      console.error('Input system not available');
      return;
    }
    this.cursors = this.input.keyboard.createCursorKeys();

    // Add some walls (temporary)
    const walls = this.physics.add.staticGroup();
    if (walls) {
      const wall1 = walls.create(100, 100, 'wall');
      const wall2 = walls.create(700, 100, 'wall');
      const wall3 = walls.create(100, 500, 'wall');
      const wall4 = walls.create(700, 500, 'wall');

      // Add collision between player and walls
      if (this.player && wall1 && wall2 && wall3 && wall4) {
        this.physics.add.collider(this.player, walls);
      }
    }
  }

  update(): void {
    if (!this.player || !this.cursors) return;

    // Handle player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-160);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(160);
    } else {
      this.player.setVelocityY(0);
    }
  }
} 