import { MAZE_LAYOUT, TILE_SIZE, TileType, MAZE_WIDTH, MAZE_HEIGHT } from '../config/mazeConfig';
import { TeleportEffects } from '../effects/TeleportEffects';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private teleportZones!: Phaser.GameObjects.Zone[];
  private teleportEffects!: TeleportEffects;
  private isTeleporting: boolean = false;
  private currentDirection: 'up' | 'down' | 'left' | 'right' | null = null;
  private nextDirection: 'up' | 'down' | 'left' | 'right' | null = null;
  private debugGraphics!: Phaser.GameObjects.Graphics;

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

    // Create wall texture
    this.createWallTexture();
  }

  private createWallTexture(): void {
    const wallSize = TILE_SIZE;
    const graphics = this.add.graphics();

    // Draw the main wall shape
    graphics.clear();

    // Fill with dark blue base color
    graphics.fillStyle(0x0000aa);
    graphics.fillRect(0, 0, wallSize, wallSize);

    // Add inner glow effect
    graphics.lineStyle(2, 0x0066ff);
    graphics.strokeRect(2, 2, wallSize - 4, wallSize - 4);

    // Add outer edge
    graphics.lineStyle(1, 0x000066);
    graphics.strokeRect(0, 0, wallSize, wallSize);

    // Add some subtle inner detail
    graphics.lineStyle(1, 0x0044cc);
    graphics.beginPath();
    graphics.moveTo(4, 4);
    graphics.lineTo(wallSize - 4, 4);
    graphics.moveTo(4, wallSize - 4);
    graphics.lineTo(wallSize - 4, wallSize - 4);
    graphics.stroke();

    // Generate the texture
    graphics.generateTexture('wall-enhanced', wallSize, wallSize);
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
            const wall = this.walls.create(pixelX, pixelY, 'wall-enhanced');
            wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
            
            // Add a subtle glow effect
            const glow = this.add.sprite(pixelX, pixelY, 'wall-enhanced');
            glow.setDisplaySize(TILE_SIZE + 4, TILE_SIZE + 4);
            glow.setTint(0x0066ff);
            glow.setAlpha(0.2);
            
            // Add a subtle pulsing animation
            this.tweens.add({
                targets: glow,
                alpha: 0.1,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
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
    if (!this.player || !this.cursors || !this.player.body) return;

    // Handle player movement
    const speed = 160;

    // Get the current tile position
    const currentTileX = Math.floor(this.player.x / TILE_SIZE);
    const currentTileY = Math.floor(this.player.y / TILE_SIZE);
    
    // Calculate position within current tile (centered at 0.5)
    const tilePositionX = (this.player.x - (currentTileX * TILE_SIZE)) / TILE_SIZE;
    const tilePositionY = (this.player.y - (currentTileY * TILE_SIZE)) / TILE_SIZE;
    
    // Check if we're centered enough on the grid to turn (increased tolerance slightly)
    const canTurn = (
      Math.abs(tilePositionX - 0.5) < 0.15 && 
      Math.abs(tilePositionY - 0.5) < 0.15
    );

    // Debug visualization of player position relative to grid
    this.debugGridAlignment(currentTileX, currentTileY, tilePositionX, tilePositionY, canTurn);

    // Check if the current direction is blocked by a wall
    let isCurrentDirectionBlocked = false;
    if (this.currentDirection) {
      const nextTileX = currentTileX + (this.currentDirection === 'right' ? 1 : this.currentDirection === 'left' ? -1 : 0);
      const nextTileY = currentTileY + (this.currentDirection === 'down' ? 1 : this.currentDirection === 'up' ? -1 : 0);
      
      isCurrentDirectionBlocked = 
        nextTileX < 0 || 
        nextTileX >= MAZE_LAYOUT[0].length ||
        nextTileY < 0 || 
        nextTileY >= MAZE_LAYOUT.length ||
        MAZE_LAYOUT[nextTileY][nextTileX] === TileType.WALL;
    }

    // Store the next direction based on input
    if (this.cursors.left.isDown) {
      this.nextDirection = 'left';
      if (!this.currentDirection || isCurrentDirectionBlocked) {
        const canMoveLeft = currentTileX > 0 && MAZE_LAYOUT[currentTileY][currentTileX - 1] !== TileType.WALL;
        if (canMoveLeft) this.currentDirection = 'left';
      }
    } else if (this.cursors.right.isDown) {
      this.nextDirection = 'right';
      if (!this.currentDirection || isCurrentDirectionBlocked) {
        const canMoveRight = currentTileX < MAZE_LAYOUT[0].length - 1 && MAZE_LAYOUT[currentTileY][currentTileX + 1] !== TileType.WALL;
        if (canMoveRight) this.currentDirection = 'right';
      }
    } else if (this.cursors.up.isDown) {
      this.nextDirection = 'up';
      if (!this.currentDirection || isCurrentDirectionBlocked) {
        const canMoveUp = currentTileY > 0 && MAZE_LAYOUT[currentTileY - 1][currentTileX] !== TileType.WALL;
        if (canMoveUp) this.currentDirection = 'up';
      }
    } else if (this.cursors.down.isDown) {
      this.nextDirection = 'down';
      if (!this.currentDirection || isCurrentDirectionBlocked) {
        const canMoveDown = currentTileY < MAZE_LAYOUT.length - 1 && MAZE_LAYOUT[currentTileY + 1][currentTileX] !== TileType.WALL;
        if (canMoveDown) this.currentDirection = 'down';
      }
    }

    // If we can turn and have a next direction, try to turn
    if (canTurn && this.nextDirection && this.nextDirection !== this.currentDirection) {
      // Check if we can move in the next direction
      const nextTileX = currentTileX + (this.nextDirection === 'right' ? 1 : this.nextDirection === 'left' ? -1 : 0);
      const nextTileY = currentTileY + (this.nextDirection === 'down' ? 1 : this.nextDirection === 'up' ? -1 : 0);
      
      // Check if the next tile is a valid path
      if (nextTileX >= 0 && nextTileX < MAZE_LAYOUT[0].length &&
          nextTileY >= 0 && nextTileY < MAZE_LAYOUT.length &&
          MAZE_LAYOUT[nextTileY][nextTileX] !== TileType.WALL) {
        this.currentDirection = this.nextDirection;
      }
    }

    // Always try to center the player on the path while moving
    if (this.currentDirection === 'left' || this.currentDirection === 'right') {
      // When moving horizontally, maintain vertical center
      const targetY = currentTileY * TILE_SIZE + TILE_SIZE / 2;
      if (Math.abs(this.player.y - targetY) > 1) {
        this.player.y = Phaser.Math.Linear(this.player.y, targetY, 0.2);
      }
    } else if (this.currentDirection === 'up' || this.currentDirection === 'down') {
      // When moving vertically, maintain horizontal center
      const targetX = currentTileX * TILE_SIZE + TILE_SIZE / 2;
      if (Math.abs(this.player.x - targetX) > 1) {
        this.player.x = Phaser.Math.Linear(this.player.x, targetX, 0.2);
      }
    }

    // Reset velocity
    this.player.setVelocity(0);

    // Move in the current direction
    switch (this.currentDirection) {
      case 'left':
        this.player.setVelocityX(-speed);
        break;
      case 'right':
        this.player.setVelocityX(speed);
        break;
      case 'up':
        this.player.setVelocityY(-speed);
        break;
      case 'down':
        this.player.setVelocityY(speed);
        break;
    }

    // Only reset direction if we're blocked and not trying to move in a new direction
    if (isCurrentDirectionBlocked && !this.nextDirection) {
      this.currentDirection = null;
    }
  }

  private debugGridAlignment(currentTileX: number, currentTileY: number, tilePositionX: number, tilePositionY: number, canTurn: boolean): void {
    // Clear previous debug graphics
    if (this.debugGraphics) {
      this.debugGraphics.clear();
    } else {
      this.debugGraphics = this.add.graphics();
    }

    // Draw current tile
    this.debugGraphics.lineStyle(1, canTurn ? 0x00ff00 : 0xff0000);
    this.debugGraphics.strokeRect(
      currentTileX * TILE_SIZE,
      currentTileY * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE
    );

    // Draw center point
    this.debugGraphics.lineStyle(2, 0xffff00);
    const centerX = currentTileX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = currentTileY * TILE_SIZE + TILE_SIZE / 2;
    this.debugGraphics.lineBetween(centerX - 3, centerY, centerX + 3, centerY);
    this.debugGraphics.lineBetween(centerX, centerY - 3, centerX, centerY + 3);

    // Log position info
    console.log(`Position in tile: (${tilePositionX.toFixed(3)}, ${tilePositionY.toFixed(3)}), canTurn: ${canTurn}`);
  }
} 