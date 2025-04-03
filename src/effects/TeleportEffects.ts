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
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 400,
            gravityY: 0,
            quantity: 1,
            frequency: 15,
            tint: 0x00ffff,
            emitting: false
        });

        this.emitters.set('teleportIn', teleportIn);

        // Create teleport out effect (blue particles exploding)
        const teleportOut = this.scene.add.particles(0, 0, 'white-pixel', {
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0, end: 0.5 },
            lifespan: 400,
            gravityY: 0,
            quantity: 1,
            frequency: 15,
            tint: 0x00ffff,
            emitting: false
        });

        this.emitters.set('teleportOut', teleportOut);
    }

    playTeleportEffect(fromX: number, fromY: number, toX: number, toY: number): void {
        // Play disappear effect at start position
        const teleportOut = this.emitters.get('teleportOut');
        if (teleportOut) {
            teleportOut.setPosition(fromX, fromY);
            teleportOut.explode(20);
        }

        // Play appear effect at end position
        const teleportIn = this.emitters.get('teleportIn');
        if (teleportIn) {
            teleportIn.setPosition(toX, toY);
            teleportIn.explode(20);
        }
    }
} 