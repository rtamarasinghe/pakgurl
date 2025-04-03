import { TILE_SIZE } from '../../config/mazeConfig';
import { MAZE_LAYOUT } from '../../config/mazeConfig';
import { TileType } from '../../config/mazeConfig';

export enum GhostState {
    CHASE = 'chase',
    SCATTER = 'scatter',
    FRIGHTENED = 'frightened',
    EATEN = 'eaten'
}

export enum GhostType {
    BLINKY = 'blinky',
    PINKY = 'pinky',
    INKY = 'inky',
    CLYDE = 'clyde'
}

export abstract class Ghost {
    protected sprite: Phaser.Physics.Arcade.Sprite;
    protected scene: Phaser.Scene;
    protected state: GhostState = GhostState.SCATTER;
    protected speed: number = 150;
    protected scatterTarget: Phaser.Math.Vector2;
    protected currentDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);
    protected ghostHouse: boolean = true;
    protected ghostType: GhostType;
    protected startPosition: Phaser.Math.Vector2;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, ghostType: GhostType) {
        this.scene = scene;
        this.ghostType = ghostType;
        this.startPosition = new Phaser.Math.Vector2(x, y);
        
        // Create the ghost sprite
        this.sprite = scene.physics.add.sprite(x, y, texture);
        this.sprite.setDisplaySize(TILE_SIZE * 0.8, TILE_SIZE * 0.8);
        this.sprite.setTint(this.getGhostColor());
        
        // Set up physics
        if (this.sprite.body) {
            this.sprite.body.setSize(TILE_SIZE * 0.8, TILE_SIZE * 0.8);
        }

        // Set scatter target based on ghost type
        this.scatterTarget = this.getScatterTarget();

        // Start animations
        this.createAnimations();
    }

    protected createAnimations(): void {
        // Create base animations for the ghost
        const color = this.getGhostColor();
        
        // Normal animation
        this.scene.anims.create({
            key: `${this.ghostType}-normal`,
            frames: [
                { key: this.sprite.texture.key, frame: 0 }
            ],
            frameRate: 10,
            repeat: -1
        });

        // Frightened animation (blue)
        this.scene.anims.create({
            key: `${this.ghostType}-frightened`,
            frames: [
                { key: 'ghost-frightened', frame: 0 }
            ],
            frameRate: 10,
            repeat: -1
        });

        // Eaten animation (eyes only)
        this.scene.anims.create({
            key: `${this.ghostType}-eaten`,
            frames: [
                { key: 'ghost-eaten', frame: 0 }
            ],
            frameRate: 10,
            repeat: -1
        });
    }

    protected getGhostColor(): number {
        switch (this.ghostType) {
            case GhostType.BLINKY:
                return 0xff0000; // Red
            case GhostType.PINKY:
                return 0xffb8ff; // Pink
            case GhostType.INKY:
                return 0x00ffff; // Cyan
            case GhostType.CLYDE:
                return 0xffb852; // Orange
            default:
                return 0xffffff;
        }
    }

    protected getScatterTarget(): Phaser.Math.Vector2 {
        // Each ghost has a different corner to retreat to in scatter mode
        switch (this.ghostType) {
            case GhostType.BLINKY:
                return new Phaser.Math.Vector2(27 * TILE_SIZE, 0); // Top-right
            case GhostType.PINKY:
                return new Phaser.Math.Vector2(0, 0); // Top-left
            case GhostType.INKY:
                return new Phaser.Math.Vector2(27 * TILE_SIZE, 30 * TILE_SIZE); // Bottom-right
            case GhostType.CLYDE:
                return new Phaser.Math.Vector2(0, 30 * TILE_SIZE); // Bottom-left
            default:
                return new Phaser.Math.Vector2(0, 0);
        }
    }

    public setState(newState: GhostState): void {
        this.state = newState;
        
        // Update appearance and behavior based on state
        switch (newState) {
            case GhostState.FRIGHTENED:
                this.speed = 75; // Slower when frightened
                this.sprite.play(`${this.ghostType}-frightened`);
                // Reverse direction
                this.currentDirection.scale(-1);
                break;
            
            case GhostState.EATEN:
                this.speed = 200; // Faster when eaten
                this.sprite.play(`${this.ghostType}-eaten`);
                break;
            
            default:
                this.speed = 150; // Normal speed
                this.sprite.play(`${this.ghostType}-normal`);
                break;
        }
    }

    public getPosition(): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(this.sprite.x, this.sprite.y);
    }

    public update(player: Phaser.Physics.Arcade.Sprite | null): void {
        if (!player?.body) {
            if (this.ghostHouse) {
                this.updateGhostHouseBehavior();
            } else {
                // If not in ghost house and no player, just continue in current direction
                this.sprite.setVelocity(
                    this.currentDirection.x * this.speed,
                    this.currentDirection.y * this.speed
                );
            }
            return;
        }

        if (this.ghostHouse) {
            this.updateGhostHouseBehavior();
            return;
        }

        // Get the target based on current state and behavior
        const target = this.getTarget(player);
        if (!target) {
            // If no target, continue in current direction
            this.sprite.setVelocity(
                this.currentDirection.x * this.speed,
                this.currentDirection.y * this.speed
            );
            return;
        }
        
        // Get valid directions at current position
        const validDirections = this.getValidDirections();
        if (!validDirections.length) {
            // If no valid directions, stop moving
            this.sprite.setVelocity(0, 0);
            return;
        }
        
        // Choose the best direction
        const newDirection = this.chooseBestDirection(validDirections, target);
        
        // Apply the movement
        this.sprite.setVelocity(
            newDirection.x * this.speed,
            newDirection.y * this.speed
        );

        this.currentDirection = newDirection;
    }

    protected abstract getTarget(player: Phaser.Physics.Arcade.Sprite): Phaser.Math.Vector2;

    protected getValidDirections(): Phaser.Math.Vector2[] {
        const directions = [
            new Phaser.Math.Vector2(1, 0),   // Right
            new Phaser.Math.Vector2(-1, 0),  // Left
            new Phaser.Math.Vector2(0, -1),  // Up
            new Phaser.Math.Vector2(0, 1)    // Down
        ];

        // Filter out invalid directions (walls, opposite of current direction)
        return directions.filter(dir => {
            // Don't allow reversing unless frightened
            if (this.state !== GhostState.FRIGHTENED && 
                dir.x === -this.currentDirection.x && 
                dir.y === -this.currentDirection.y) {
                return false;
            }

            // Get current tile position
            const currentTileX = Math.floor(this.sprite.x / TILE_SIZE);
            const currentTileY = Math.floor(this.sprite.y / TILE_SIZE);

            // Calculate next tile position
            const nextTileX = currentTileX + dir.x;
            const nextTileY = currentTileY + dir.y;

            // Check if next tile is within bounds and not a wall
            return nextTileX >= 0 && 
                   nextTileX < MAZE_LAYOUT[0].length &&
                   nextTileY >= 0 && 
                   nextTileY < MAZE_LAYOUT.length &&
                   MAZE_LAYOUT[nextTileY][nextTileX] !== TileType.WALL;
        });
    }

    protected chooseBestDirection(validDirections: Phaser.Math.Vector2[], target: Phaser.Math.Vector2): Phaser.Math.Vector2 {
        if (!validDirections.length || !target) {
            return this.currentDirection;
        }

        if (this.state === GhostState.FRIGHTENED) {
            // Choose a random valid direction when frightened
            return Phaser.Math.RND.pick(validDirections);
        }

        // Choose the direction that gets us closest to the target
        let bestDirection = validDirections[0];
        let bestDistance = Phaser.Math.Distance.Between(
            this.sprite.x + bestDirection.x * TILE_SIZE,
            this.sprite.y + bestDirection.y * TILE_SIZE,
            target.x,
            target.y
        );

        for (let i = 1; i < validDirections.length; i++) {
            const direction = validDirections[i];
            const distance = Phaser.Math.Distance.Between(
                this.sprite.x + direction.x * TILE_SIZE,
                this.sprite.y + direction.y * TILE_SIZE,
                target.x,
                target.y
            );

            if (distance < bestDistance) {
                bestDistance = distance;
                bestDirection = direction;
            }
        }

        return bestDirection;
    }

    protected updateGhostHouseBehavior(): void {
        // Implement ghost house behavior (bouncing up and down)
        const amplitude = TILE_SIZE * 0.5;
        const frequency = 2000; // 2 seconds per cycle
        
        const y = this.startPosition.y + Math.sin(this.scene.time.now / frequency) * amplitude;
        this.sprite.setY(y);
        this.sprite.setVelocityX(0);
    }

    public exitGhostHouse(): void {
        this.ghostHouse = false;
        // Move slightly upward to clear the ghost house
        this.sprite.setPosition(this.startPosition.x, this.startPosition.y - TILE_SIZE);
        // Start with upward movement
        this.currentDirection = new Phaser.Math.Vector2(0, -1);
        this.setState(GhostState.SCATTER);
    }

    public returnToGhostHouse(): void {
        this.ghostHouse = true;
        this.sprite.setPosition(this.startPosition.x, this.startPosition.y);
        this.setState(GhostState.CHASE);
    }

    public getState(): GhostState {
        return this.state;
    }

    public getSprite(): Phaser.Physics.Arcade.Sprite {
        return this.sprite;
    }
}