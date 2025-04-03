import { Ghost, GhostState, GhostType } from './Ghost';

export class Blinky extends Ghost {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'ghost-blinky', GhostType.BLINKY);
    }

    protected getTarget(player: Phaser.Physics.Arcade.Sprite): Phaser.Math.Vector2 {
        if (this.state === GhostState.SCATTER) {
            return this.scatterTarget;
        }
        
        if (this.state === GhostState.EATEN) {
            return this.startPosition;
        }

        // Blinky directly targets Pac-Man's current position
        return new Phaser.Math.Vector2(player.x, player.y);
    }
} 