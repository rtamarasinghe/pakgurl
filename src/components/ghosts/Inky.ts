import { Ghost, GhostState, GhostType } from './Ghost';
import { TILE_SIZE } from '../../config/mazeConfig';

export class Inky extends Ghost {
    private blinky: Ghost;

    constructor(scene: Phaser.Scene, x: number, y: number, blinky: Ghost) {
        super(scene, x, y, 'ghost-inky', GhostType.INKY);
        this.blinky = blinky;
    }

    protected getTarget(player: Phaser.Physics.Arcade.Sprite): Phaser.Math.Vector2 {
        if (this.state === GhostState.SCATTER) {
            return this.scatterTarget;
        }
        
        if (this.state === GhostState.EATEN) {
            return this.startPosition;
        }

        // Inky's target is based on both Pac-Man's position and Blinky's position
        const target = new Phaser.Math.Vector2(player.x, player.y);
        const lookAhead = 2 * TILE_SIZE;

        // First, get the point 2 tiles ahead of Pac-Man
        if (player.body) {
            const velocity = player.body.velocity;
            if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
                target.x += Math.sign(velocity.x) * lookAhead;
            } else {
                target.y += Math.sign(velocity.y) * lookAhead;
            }
        }

        // Get Blinky's position
        const blinkyPos = this.blinky.getPosition();

        // Draw a vector from Blinky to the target point and double it
        const vectorX = target.x - blinkyPos.x;
        const vectorY = target.y - blinkyPos.y;

        return new Phaser.Math.Vector2(
            blinkyPos.x + (vectorX * 2),
            blinkyPos.y + (vectorY * 2)
        );
    }
}