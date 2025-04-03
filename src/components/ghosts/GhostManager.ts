import { Ghost, GhostState } from './Ghost';
import { Blinky } from './Blinky';
import { Pinky } from './Pinky';
import { Inky } from './Inky';
import { Clyde } from './Clyde';
import { TILE_SIZE } from '../../config/mazeConfig';

export class GhostManager {
    private ghosts: Ghost[] = [];
    private scene: Phaser.Scene;
    private modeTimer: Phaser.Time.TimerEvent | null = null;
    private currentMode: 'chase' | 'scatter' = 'scatter';
    private modePatterns = [
        { mode: 'scatter', duration: 7000 },  // 7 seconds scatter
        { mode: 'chase', duration: 20000 },   // 20 seconds chase
        { mode: 'scatter', duration: 7000 },  // 7 seconds scatter
        { mode: 'chase', duration: 20000 },   // 20 seconds chase
        { mode: 'scatter', duration: 5000 },  // 5 seconds scatter
        { mode: 'chase', duration: 20000 },   // 20 seconds chase
        { mode: 'scatter', duration: 5000 },  // 5 seconds scatter
        { mode: 'chase', duration: -1 }       // Permanent chase mode
    ];
    private currentPatternIndex = 0;
    private frightenedTimer: Phaser.Time.TimerEvent | null = null;
    private readonly FRIGHTENED_DURATION = 8000; // 8 seconds

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initializeGhosts();
        this.startModeTimer();
    }

    private initializeGhosts(): void {
        // Create ghosts at their starting positions
        const blinky = new Blinky(this.scene, 14 * TILE_SIZE, 11 * TILE_SIZE);
        const pinky = new Pinky(this.scene, 14 * TILE_SIZE, 14 * TILE_SIZE);
        const inky = new Inky(this.scene, 12 * TILE_SIZE, 14 * TILE_SIZE, blinky);
        const clyde = new Clyde(this.scene, 16 * TILE_SIZE, 14 * TILE_SIZE);

        this.ghosts = [blinky, pinky, inky, clyde];

        // Set initial states
        this.setAllGhostsState(GhostState.SCATTER);
    }

    private setAllGhostsState(state: GhostState): void {
        this.ghosts.forEach(ghost => ghost.setState(state));
    }

    private startModeTimer(): void {
        const pattern = this.modePatterns[this.currentPatternIndex];
        if (!pattern || pattern.duration === -1) {
            // We've reached permanent chase mode
            this.setAllGhostsState(GhostState.CHASE);
            return;
        }

        this.currentMode = pattern.mode as 'chase' | 'scatter';
        this.setAllGhostsState(pattern.mode === 'chase' ? GhostState.CHASE : GhostState.SCATTER);

        if (this.modeTimer) {
            this.modeTimer.destroy();
        }

        this.modeTimer = this.scene.time.delayedCall(pattern.duration, () => {
            this.currentPatternIndex++;
            this.startModeTimer();
        });
    }

    public update(player: Phaser.Physics.Arcade.Sprite): void {
        this.ghosts.forEach(ghost => ghost.update(player));
    }

    public handlePowerPelletCollected(): void {
        // Cancel existing frightened timer if there is one
        if (this.frightenedTimer) {
            this.frightenedTimer.destroy();
        }

        // Set all non-eaten ghosts to frightened state
        this.ghosts.forEach(ghost => {
            if (ghost.getState() !== GhostState.EATEN) {
                ghost.setState(GhostState.FRIGHTENED);
            }
        });

        // Start frightened timer
        this.frightenedTimer = this.scene.time.delayedCall(
            this.FRIGHTENED_DURATION,
            () => this.endFrightenedMode(),
            undefined,
            this
        );
    }

    private endFrightenedMode(): void {
        this.ghosts.forEach(ghost => {
            if (ghost.getState() === GhostState.FRIGHTENED) {
                ghost.setState(this.currentMode === 'chase' ? GhostState.CHASE : GhostState.SCATTER);
            }
        });
        this.frightenedTimer = null;
    }

    public handleGhostEaten(ghost: Ghost): void {
        ghost.setState(GhostState.EATEN);
        // Add score or other effects here
    }

    public handlePlayerCollision(ghost: Ghost, player: Phaser.Physics.Arcade.Sprite): void {
        const ghostState = ghost.getState();
        if (ghostState === GhostState.FRIGHTENED) {
            this.handleGhostEaten(ghost);
        } else if (ghostState !== GhostState.EATEN) {
            // Player dies
            this.scene.events.emit('playerDied');
        }
    }

    public setupCollision(player: Phaser.Physics.Arcade.Sprite): void {
        this.ghosts.forEach(ghost => {
            this.scene.physics.add.overlap(
                player,
                ghost.getSprite(),
                () => this.handlePlayerCollision(ghost, player),
                undefined,
                this
            );
        });
    }

    public resetGhosts(): void {
        this.ghosts.forEach(ghost => ghost.returnToGhostHouse());
        this.currentPatternIndex = 0;
        this.startModeTimer();
    }
} 