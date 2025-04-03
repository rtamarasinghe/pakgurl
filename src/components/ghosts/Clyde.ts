import { Ghost, GhostType, GhostState } from './Ghost';
import { TILE_SIZE } from '../../config/mazeConfig';

export class Clyde extends Ghost {
    private readonly SCATTER_DISTANCE = 8 * TILE_SIZE; // Distance to switch to scatter mode

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'ghost-clyde', GhostType.CLYDE);
    }

    protected getTarget(player: Phaser.Physics.Arcade.Sprite | null): Phaser.Math.Vector2 {
        if (!player) {
            return this.scatterTarget;
        }
        
        if (this.state === GhostState.SCATTER) {
            return this.scatterTarget;
        }
        
        if (this.state === GhostState.EATEN) {
            return this.startPosition;
        }

        // Calculate distance to Pac-Man
        const distance = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            player.x,
            player.y
        );

        // If Clyde is far from Pac-Man, chase directly
        if (distance > this.SCATTER_DISTANCE) {
            return new Phaser.Math.Vector2(player.x, player.y);
        }
        
        // If Clyde is close to Pac-Man, retreat to scatter corner
        return this.scatterTarget;
    }

    protected chooseBestDirection(validDirections: Phaser.Math.Vector2[], target: Phaser.Math.Vector2): Phaser.Math.Vector2 {
        // 20% chance to choose a random direction even when chasing
        if (Phaser.Math.RND.frac() < 0.2) {
            return Phaser.Math.RND.pick(validDirections);
        }

        // Otherwise use normal pathfinding
        return super.chooseBestDirection(validDirections, target);
    }
} 