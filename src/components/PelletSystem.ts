import { MAZE_LAYOUT, TileType, TILE_SIZE } from '../config/mazeConfig';

export class PelletSystem {
    private scene: Phaser.Scene;
    private pellets: Phaser.Physics.Arcade.StaticGroup;
    private powerPellets: Phaser.Physics.Arcade.StaticGroup;
    private score: number = 0;
    private scoreText: Phaser.GameObjects.Text;
    private powerPelletGlows: Map<string, Phaser.GameObjects.Container>;
    
    // Constants for scoring
    private static readonly REGULAR_PELLET_POINTS = 10;
    private static readonly POWER_PELLET_POINTS = 50;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.pellets = scene.physics.add.staticGroup();
        this.powerPellets = scene.physics.add.staticGroup();
        this.powerPelletGlows = new Map();
        
        // Create score text
        this.scoreText = scene.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            color: '#ffffff'
        });
        
        this.createPellets();
    }

    private createPellets(): void {
        MAZE_LAYOUT.forEach((row, y) => {
            row.forEach((tile, x) => {
                const pixelX = x * TILE_SIZE + TILE_SIZE / 2;
                const pixelY = y * TILE_SIZE + TILE_SIZE / 2;

                // Add regular pellets in empty spaces
                if (tile === TileType.PATH) {
                    const pellet = this.pellets.create(pixelX, pixelY, 'dot');
                    pellet.setDisplaySize(TILE_SIZE * 0.2, TILE_SIZE * 0.2);
                    this.addPelletGlow(pellet);
                }
                // Add power pellets
                else if (tile === TileType.POWER_PELLET) {
                    this.createPowerPellet(pixelX, pixelY);
                }
            });
        });
    }

    private createPowerPellet(x: number, y: number): void {
        // Create a container for the power pellet and its effects
        const container = this.scene.add.container(x, y);
        
        // Create the outer glow sprites
        const outerGlow = this.scene.add.sprite(0, 0, 'power-pellet');
        outerGlow.setDisplaySize(TILE_SIZE * 1.2, TILE_SIZE * 1.2);
        outerGlow.setAlpha(0.2);
        outerGlow.setTint(0x00ffff);

        const middleGlow = this.scene.add.sprite(0, 0, 'power-pellet');
        middleGlow.setDisplaySize(TILE_SIZE * 0.9, TILE_SIZE * 0.9);
        middleGlow.setAlpha(0.4);
        middleGlow.setTint(0x00ffff);

        // Create the main power pellet sprite
        const powerPellet = this.powerPellets.create(0, 0, 'power-pellet');
        powerPellet.setDisplaySize(TILE_SIZE * 0.6, TILE_SIZE * 0.6);

        // Add everything to the container
        container.add([outerGlow, middleGlow, powerPellet]);

        // Store reference to the container
        this.powerPelletGlows.set(`${x},${y}`, container);

        // Add pulsing animations
        this.scene.tweens.add({
            targets: [outerGlow, middleGlow],
            alpha: { from: 0.2, to: 0.5 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: container,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private addPelletGlow(pellet: Phaser.GameObjects.Sprite): void {
        // Add subtle glow effect
        const glow = this.scene.add.sprite(pellet.x, pellet.y, 'dot');
        glow.setDisplaySize(TILE_SIZE * 0.3, TILE_SIZE * 0.3);
        glow.setAlpha(0.3);
        glow.setTint(0x00ffff);

        // Add pulsing animation
        this.scene.tweens.add({
            targets: glow,
            alpha: 0.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    public setupCollision(player: Phaser.Physics.Arcade.Sprite): void {
        // Setup collision with regular pellets
        this.scene.physics.add.overlap(
            player,
            this.pellets,
            (obj1, obj2) => {
                this.collectPellet(
                    obj1 as Phaser.Physics.Arcade.Sprite,
                    obj2 as Phaser.Physics.Arcade.Sprite
                );
            },
            undefined,
            this
        );

        // Setup collision with power pellets
        this.scene.physics.add.overlap(
            player,
            this.powerPellets,
            (obj1, obj2) => {
                this.collectPowerPellet(
                    obj1 as Phaser.Physics.Arcade.Sprite,
                    obj2 as Phaser.Physics.Arcade.Sprite
                );
            },
            undefined,
            this
        );
    }

    private collectPellet(player: Phaser.Physics.Arcade.Sprite, pellet: Phaser.Physics.Arcade.Sprite): void {
        pellet.destroy();
        this.updateScore(PelletSystem.REGULAR_PELLET_POINTS);
        
        // Play collect sound (to be implemented)
        // this.scene.sound.play('pellet-collect');
    }

    private collectPowerPellet(player: Phaser.Physics.Arcade.Sprite, powerPellet: Phaser.Physics.Arcade.Sprite): void {
        const container = this.powerPelletGlows.get(`${powerPellet.x},${powerPellet.y}`);
        if (container) {
            container.destroy();
            this.powerPelletGlows.delete(`${powerPellet.x},${powerPellet.y}`);
        }
        
        powerPellet.destroy();
        this.updateScore(PelletSystem.POWER_PELLET_POINTS);
        
        // Emit event for power pellet collection
        this.scene.events.emit('powerPelletCollected');
        
        // Play power pellet collect sound (to be implemented)
        // this.scene.sound.play('power-pellet-collect');
    }

    private updateScore(points: number): void {
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    public getRemainingPellets(): number {
        return this.pellets.countActive() + this.powerPellets.countActive();
    }
} 