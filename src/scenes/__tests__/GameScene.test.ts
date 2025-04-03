import { GameScene } from '../GameScene';

describe('GameScene', () => {
  let scene: GameScene;

  beforeEach(() => {
    scene = new GameScene();
  });

  describe('preload', () => {
    it('should load all required game assets', () => {
      scene.preload();
      
      expect(scene.load.image).toHaveBeenCalledWith('player', 'assets/player.png');
      expect(scene.load.image).toHaveBeenCalledWith('wall', 'assets/wall.png');
      expect(scene.load.image).toHaveBeenCalledWith('dot', 'assets/dot.png');
    });
  });

  describe('create', () => {
    it('should create player with correct initial position', () => {
      const mockSprite = {
        setCollideWorldBounds: jest.fn()
      };
      (scene.physics.add.sprite as jest.Mock).mockReturnValue(mockSprite);

      scene.create();

      expect(scene.physics.add.sprite).toHaveBeenCalledWith(400, 300, 'player');
      expect(mockSprite.setCollideWorldBounds).toHaveBeenCalledWith(true);
    });

    it('should create walls at correct positions', () => {
      const mockWalls = {
        create: jest.fn()
      };
      (scene.physics.add.staticGroup as jest.Mock).mockReturnValue(mockWalls);

      scene.create();

      expect(mockWalls.create).toHaveBeenCalledWith(100, 100, 'wall');
      expect(mockWalls.create).toHaveBeenCalledWith(700, 100, 'wall');
      expect(mockWalls.create).toHaveBeenCalledWith(100, 500, 'wall');
      expect(mockWalls.create).toHaveBeenCalledWith(700, 500, 'wall');
    });
  });

  describe('update', () => {
    it('should handle player movement correctly', () => {
      const mockPlayer = {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn()
      };
      (scene as any).player = mockPlayer;
      (scene as any).cursors = {
        left: { isDown: true },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false }
      };

      scene.update();

      expect(mockPlayer.setVelocityX).toHaveBeenCalledWith(-160);
      expect(mockPlayer.setVelocityY).toHaveBeenCalledWith(0);
    });

    it('should not update if player or cursors are missing', () => {
      const mockPlayer = {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn()
      };
      (scene as any).player = mockPlayer;
      (scene as any).cursors = null;

      scene.update();

      expect(mockPlayer.setVelocityX).not.toHaveBeenCalled();
      expect(mockPlayer.setVelocityY).not.toHaveBeenCalled();
    });
  });
}); 