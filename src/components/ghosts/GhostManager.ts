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
    private ghostReleaseTimers: Phaser.Time.TimerEvent[] = [];
    private isGhostsPaused: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initializeGhosts();
        this.startModeTimer();
        this.scheduleGhostReleases();
    }

    private initializeGhosts(): void {
        // Create ghosts at their starting positions (centered in tiles)
        const blinky = new Blinky(
            this.scene, 
            14 * TILE_SIZE + TILE_SIZE / 2, 
            14 * TILE_SIZE + TILE_SIZE / 2  // Move Blinky down to proper ghost house position
        );
        const pinky = new Pinky(
            this.scene, 
            14 * TILE_SIZE + TILE_SIZE / 2, 
            13 * TILE_SIZE + TILE_SIZE / 2  // Move Pinky up one tile
        );
        const inky = new Inky(
            this.scene, 
            12 * TILE_SIZE + TILE_SIZE / 2, 
            13 * TILE_SIZE + TILE_SIZE / 2,  // Move Inky up one tile
            blinky
        );
        const clyde = new Clyde(
            this.scene, 
            16 * TILE_SIZE + TILE_SIZE / 2, 
            13 * TILE_SIZE + TILE_SIZE / 2  // Move Clyde up one tile
        );

        this.ghosts = [blinky, pinky, inky, clyde];
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

    public pauseGhosts(): void {
        this.isGhostsPaused = true;
        // Stop all ghost movement
        this.ghosts.forEach(ghost => {
            const sprite = ghost.getSprite();
            if (sprite.body) {
                (sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
            }
        });
    }

    public resumeGhosts(): void {
        this.isGhostsPaused = false;
    }

    public update(player: Phaser.Physics.Arcade.Sprite | null): void {
        if (this.isGhostsPaused) return;
        
        this.ghosts.forEach(ghost => {
            ghost.update(player);
        });
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
        // Stop any existing timers
        this.ghostReleaseTimers.forEach(timer => timer.destroy());
        this.ghostReleaseTimers = [];

        // Reset all ghosts to ghost house
        this.ghosts.forEach(ghost => {
            ghost.returnToGhostHouse();
        });

        // Resume ghost movement
        this.isGhostsPaused = false;

        // Reset mode to initial scatter mode
        this.currentPatternIndex = 0;
        this.startModeTimer();

        // Schedule new ghost releases with a delay to ensure proper positioning
        this.scene.time.delayedCall(1000, () => {
            this.scheduleGhostReleases();
        });
    }

    private scheduleGhostReleases(): void {
        // Clear any existing timers
        this.ghostReleaseTimers.forEach(timer => timer.destroy());
        this.ghostReleaseTimers = [];

        // Release Blinky after a short delay
        this.ghostReleaseTimers.push(
            this.scene.time.delayedCall(1000, () => {
                if (this.ghosts[0]) {
                    this.ghosts[0].exitGhostHouse();
                }
            }, [], this)
        );

        // Release Pinky after 4 seconds
        this.ghostReleaseTimers.push(
            this.scene.time.delayedCall(4000, () => {
                if (this.ghosts[1]) {
                    this.ghosts[1].exitGhostHouse();
                }
            }, [], this)
        );

        // Release Inky after 7 seconds
        this.ghostReleaseTimers.push(
            this.scene.time.delayedCall(7000, () => {
                if (this.ghosts[2]) {
                    this.ghosts[2].exitGhostHouse();
                }
            }, [], this)
        );

        // Release Clyde after 10 seconds
        this.ghostReleaseTimers.push(
            this.scene.time.delayedCall(10000, () => {
                if (this.ghosts[3]) {
                    this.ghosts[3].exitGhostHouse();
                }
            }, [], this)
        );
    }
} 