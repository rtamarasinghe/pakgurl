import { Ghost, GhostState, GhostType } from './Ghost';
import { TILE_SIZE } from '../../config/mazeConfig';

export class Pinky extends Ghost {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'ghost-pinky', GhostType.PINKY);
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

        // Pinky targets 4 tiles ahead of Pac-Man's current direction
        const target = new Phaser.Math.Vector2(player.x, player.y);
        const lookAhead = 4 * TILE_SIZE;

        // Get player's direction based on velocity
        if (player.body) {
            const velocity = player.body.velocity;
            if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
                // Moving horizontally
                target.x += Math.sign(velocity.x) * lookAhead;
            } else {
                // Moving vertically
                target.y += Math.sign(velocity.y) * lookAhead;
            }
        }

        return target;
    }
}