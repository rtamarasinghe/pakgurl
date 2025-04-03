import { MAZE_LAYOUT, TILE_SIZE, TileType, MAZE_WIDTH, MAZE_HEIGHT } from '../config/mazeConfig';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private walls!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Load game assets
    this.load.image('player', 'assets/player.png');
    this.load.image('wall', 'assets/wall.png');
    this.load.image('dot', 'assets/dot.png');
    this.load.image('power-pellet', 'assets/power-pellet.png');
  }

  create(): void {
    if (!this.physics) {
      console.error('Physics system not available');
      return;
    }

    // Set world bounds
    this.physics.world.setBounds(0, 0, MAZE_WIDTH, MAZE_HEIGHT);

    // Create maze
    this.createMaze();

    // Add player at starting position (center bottom of maze)
    const playerStartX = MAZE_WIDTH / 2;
    const playerStartY = MAZE_HEIGHT - 1.5 * TILE_SIZE;
    this.player = this.physics.add.sprite(playerStartX, playerStartY, 'player');
    
    if (this.player) {
      this.player.setCollideWorldBounds(true);
      // Make player slightly smaller than tile size
      this.player.setDisplaySize(TILE_SIZE * 0.8, TILE_SIZE * 0.8);
    }

    // Setup keyboard controls
    if (!this.input || !this.input.keyboard) {
      console.error('Input system not available');
      return;
    }
    this.cursors = this.input.keyboard.createCursorKeys();

    // Add collision between player and walls
    if (this.player && this.walls) {
      this.physics.add.collider(this.player, this.walls);
    }
  }

  private createMaze(): void {
    // Create static group for walls
    this.walls = this.physics.add.staticGroup();

    // Create the maze based on the layout
    MAZE_LAYOUT.forEach((row, y) => {
      row.forEach((tile, x) => {
        const pixelX = x * TILE_SIZE + TILE_SIZE / 2;
        const pixelY = y * TILE_SIZE + TILE_SIZE / 2;

        switch (tile) {
          case TileType.WALL:
            const wall = this.walls.create(pixelX, pixelY, 'wall');
            wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
            break;
          case TileType.GHOST_HOUSE:
            // We'll implement ghost house later
            break;
          case TileType.POWER_PELLET:
            // We'll implement power pellets later
            break;
          case TileType.TELEPORT:
            // We'll implement teleport points later
            break;
        }
      });
    });
  }

  update(): void {
    if (!this.player || !this.cursors) return;

    // Handle player movement
    const speed = 160;

    // Reset velocity
    this.player.setVelocity(0);

    // Handle player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    }
  }
} 