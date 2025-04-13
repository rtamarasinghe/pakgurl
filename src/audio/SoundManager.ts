import { getAssetsPath } from '../config/assetConfig';

export class SoundManager {
    private scene: Phaser.Scene;
    private sounds: Map<string, Phaser.Sound.BaseSound>;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.sounds = new Map();
        this.loadSounds();
    }

    private loadSounds(): void {
        const basePath = getAssetsPath();
        
        // Load sound effects
        this.scene.load.audio('power-pellet', `${basePath}power-pellet.wav`);
        this.scene.load.audio('ghost-eaten', `${basePath}ghost-eaten.wav`);
        
        // Listen for when loading is complete
        this.scene.load.once('complete', () => {
            // Create sound instances
            this.sounds.set('power-pellet', this.scene.sound.add('power-pellet'));
            this.sounds.set('ghost-eaten', this.scene.sound.add('ghost-eaten'));
        });
        
        // Start loading
        this.scene.load.start();
    }

    public playPowerPellet(): void {
        const sound = this.sounds.get('power-pellet');
        if (sound) {
            sound.play({ volume: 0.5 });
        }
    }

    public playGhostEaten(): void {
        const sound = this.sounds.get('ghost-eaten');
        if (sound) {
            sound.play({ volume: 0.5 });
        }
    }
} 