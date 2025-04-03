import { MAZE_LAYOUT, TILE_SIZE, TileType, MAZE_WIDTH, MAZE_HEIGHT } from '../config/mazeConfig';
import { TeleportEffects } from '../effects/TeleportEffects';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private teleportZones!: Phaser.GameObjects.Zone[];
  private teleportEffects!: TeleportEffects;
  private isTeleporting: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Load game assets
    this.load.image('player', 'assets/player.png');
    this.load.image('wall', 'assets/wall.png');
    this.load.image('dot', 'assets/dot.png');
    this.load.image('power-pellet', 'assets/power-pellet.png');

    // Create a white pixel texture for particles
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture('white-pixel', 2, 2);
    graphics.destroy();
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

    // Create teleport zones
    this.createTeleportZones();

    // Initialize teleport effects
    this.teleportEffects = new TeleportEffects(this);

    // Add player at starting position (center bottom of maze)
    const playerStartX = MAZE_WIDTH / 2;
    const playerStartY = MAZE_HEIGHT - 1.5 * TILE_SIZE;
    this.player = this.physics.add.sprite(playerStartX, playerStartY, 'player');
    
    if (this.player && this.player.body) {
      this.player.setCollideWorldBounds(true);
      // Make player slightly smaller than tile size
      this.player.setDisplaySize(TILE_SIZE * 0.8, TILE_SIZE * 0.8);
      // Set the physics body size to match the display size
      this.player.body.setSize(TILE_SIZE * 0.8, TILE_SIZE * 0.8);
      console.log('Player created with physics body:', this.player.body);

      // Setup teleport zone overlaps
      this.setupTeleportOverlaps();
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

    // Debug: Log all physics bodies in the scene
    console.log('All physics bodies:', this.physics.world.bodies.entries);
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
            // Teleport points are handled separately
            break;
        }
      });
    });
  }

  private createTeleportZones(): void {
    this.teleportZones = [];
    
    // Find teleport points in the maze layout
    MAZE_LAYOUT.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === TileType.TELEPORT) {
          const zone = this.add.zone(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE,
            TILE_SIZE
          );
          
          // Enable physics for the zone
          this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
          const zoneBody = (zone.body as Phaser.Physics.Arcade.StaticBody);
          zoneBody.immovable = true;

          // Debug visualization
          const graphics = this.add.graphics();
          graphics.lineStyle(2, 0x00ff00);
          graphics.strokeRect(zone.x - TILE_SIZE/2, zone.y - TILE_SIZE/2, TILE_SIZE, TILE_SIZE);

          this.teleportZones.push(zone);
          
          console.log(`Created teleport zone at (${x}, ${y}), pixel pos: (${zone.x}, ${zone.y})`);
        }
      });
    });
  }

  private setupTeleportOverlaps(): void {
    if (!this.player) return;

    this.teleportZones.forEach((zone, index) => {
      // Create a debug circle to show the overlap area
      const graphics = this.add.graphics();
      graphics.lineStyle(2, 0xff0000);
      graphics.strokeCircle(zone.x, zone.y, TILE_SIZE / 2);

      this.physics.add.overlap(
        this.player,
        zone,
        () => {
          console.log(`Player overlapped with teleport zone ${index}`);
          this.handleTeleport(zone);
        },
        undefined,
        this
      );
    });
  }

  private handleTeleport(enteredZone: Phaser.GameObjects.Zone): void {
    if (!this.player || !this.player.body || this.isTeleporting) return;

    // Find the other teleport zone
    const otherZone = this.teleportZones.find(zone => zone !== enteredZone);
    if (!otherZone) return;

    // Only teleport if player is moving in the correct direction
    const movingRight = this.player.body.velocity.x > 0;
    const isLeftZone = enteredZone.x < MAZE_WIDTH / 2;

    if ((isLeftZone && !movingRight) || (!isLeftZone && movingRight)) {
      this.isTeleporting = true;

      // Store current position for effects
      const fromX = this.player.x;
      const fromY = this.player.y;
      const toX = otherZone.x + (isLeftZone ? -TILE_SIZE : TILE_SIZE);
      const toY = otherZone.y;

      // Make player temporarily invisible
      this.player.setAlpha(0);

      // Play teleport effects
      this.teleportEffects.playTeleportEffect(fromX, fromY, toX, toY);

      // Teleport after a short delay
      this.time.delayedCall(200, () => {
        // Teleport the player
        this.player.x = toX;
        this.player.y = toY;
        
        // Fade the player back in
        this.tweens.add({
          targets: this.player,
          alpha: 1,
          duration: 200,
          ease: 'Linear',
          onComplete: () => {
            this.isTeleporting = false;
          }
        });
      });
    }
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