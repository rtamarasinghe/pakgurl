import 'phaser';
import { GameScene } from './scenes/GameScene';
import { MAZE_WIDTH, MAZE_HEIGHT } from './config/mazeConfig';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: MAZE_WIDTH,
  height: MAZE_HEIGHT,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: GameScene
};

new Phaser.Game(config); 