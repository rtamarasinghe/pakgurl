import { TILE_SIZE } from '../config/mazeConfig';

export class TeleportEffects {
    private scene: Phaser.Scene;
    private emitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter>;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.emitters = new Map();
        this.createParticles();
    }

    private createParticles(): void {
        // Create teleport in effect (blue particles converging)
        const teleportIn = this.scene.add.particles(0, 0, 'white-pixel', {
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 600,
            gravityY: 0,
            quantity: 5,
            frequency: 10,
            tint: [0x00ffff, 0x0099ff], // Mix of cyan and light blue
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            emitting: false
        });

        this.emitters.set('teleportIn', teleportIn);

        // Create teleport out effect (blue particles exploding)
        const teleportOut = this.scene.add.particles(0, 0, 'white-pixel', {
            speed: { min: 200, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0.1 }, // Start larger and shrink
            lifespan: 800, // Longer lifespan for better visibility
            gravityY: 0,
            quantity: 8, // More particles
            frequency: 10,
            tint: [0x00ffff, 0x0099ff, 0xffffff], // Added white for extra brightness
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            emitting: false,
            rotate: { min: -180, max: 180 } // Add rotation for more dynamic effect
        });

        this.emitters.set('teleportOut', teleportOut);
    }

    playTeleportEffect(fromX: number, fromY: number, toX: number, toY: number): void {
        // Play disappear effect at start position
        const teleportOut = this.emitters.get('teleportOut');
        if (teleportOut) {
            teleportOut.setPosition(fromX, fromY);
            teleportOut.explode(40); // More particles for disappearing
        }

        // Play appear effect at end position
        const teleportIn = this.emitters.get('teleportIn');
        if (teleportIn) {
            teleportIn.setPosition(toX, toY);
            teleportIn.explode(30); // Increased particle count
        }
    }
} 