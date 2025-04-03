// Mock canvas
const mockCanvas = document.createElement('canvas');
const mockContext = mockCanvas.getContext('2d') as CanvasRenderingContext2D;
mockContext.fillStyle = '#000000';
mockContext.fillRect(0, 0, 1, 1);

// Mock Phaser's game loop
jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
  setTimeout(callback, 0);
  return 0;
});

// Create mock Phaser namespace
const PhaserMock = {
  AUTO: 'AUTO',
  CANVAS: 'CANVAS',
  Scene: class Scene {
    input: any;
    physics: any;
    load: any;
    constructor() {
      this.load = {
        image: jest.fn()
      };
      this.input = {
        keyboard: {
          createCursorKeys: () => ({
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false },
            down: { isDown: false }
          })
        }
      };
      this.physics = {
        add: {
          sprite: jest.fn().mockReturnValue({
            setCollideWorldBounds: jest.fn(),
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn()
          }),
          staticGroup: jest.fn().mockReturnValue({
            create: jest.fn()
          }),
          collider: jest.fn()
        }
      };
    }
  },
  Game: class Game {
    constructor() {
      return {
        renderer: {
          type: 'CANVAS',
          width: 800,
          height: 600,
          canvas: mockCanvas,
          context: mockContext,
          destroy: jest.fn()
        },
        canvas: mockCanvas,
        context: mockContext,
        scene: {
          add: jest.fn(),
          remove: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
          pause: jest.fn(),
          resume: jest.fn(),
          sleep: jest.fn(),
          wake: jest.fn(),
          getScene: jest.fn(),
          isSleeping: jest.fn(),
          isPaused: jest.fn(),
          isActive: jest.fn(),
          getScenes: jest.fn(),
          destroy: jest.fn()
        },
        input: {
          keyboard: {
            createCursorKeys: jest.fn()
          }
        },
        physics: {
          add: {
            sprite: jest.fn(),
            staticGroup: jest.fn(),
            collider: jest.fn()
          }
        },
        config: {
          type: 'AUTO',
          width: 800,
          height: 600,
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false
            }
          }
        },
        loop: {
          wake: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
          step: jest.fn(),
          time: { delta: 0, frame: 0 }
        },
        registry: {
          get: jest.fn(),
          set: jest.fn(),
          has: jest.fn(),
          remove: jest.fn(),
          destroy: jest.fn()
        },
        events: {
          on: jest.fn(),
          once: jest.fn(),
          emit: jest.fn(),
          removeListener: jest.fn(),
          removeAllListeners: jest.fn(),
          shutdown: jest.fn(),
          destroy: jest.fn()
        },
        cache: {
          add: jest.fn(),
          get: jest.fn(),
          remove: jest.fn(),
          clear: jest.fn(),
          destroy: jest.fn()
        },
        textures: {
          add: jest.fn(),
          get: jest.fn(),
          remove: jest.fn(),
          clear: jest.fn(),
          destroy: jest.fn()
        },
        anims: {
          create: jest.fn(),
          play: jest.fn(),
          pause: jest.fn(),
          resume: jest.fn(),
          stop: jest.fn(),
          destroy: jest.fn()
        },
        sound: {
          add: jest.fn(),
          play: jest.fn(),
          pause: jest.fn(),
          resume: jest.fn(),
          stop: jest.fn(),
          destroy: jest.fn()
        },
        destroy: jest.fn()
      };
    }
  },
  Physics: {
    Arcade: {
      Sprite: class {
        setCollideWorldBounds: any;
        setVelocityX: any;
        setVelocityY: any;
        constructor() {
          this.setCollideWorldBounds = jest.fn();
          this.setVelocityX = jest.fn();
          this.setVelocityY = jest.fn();
        }
      }
    }
  },
  Types: {
    Core: {
      GameConfig: class {}
    },
    Input: {
      Keyboard: {
        CursorKeys: class {
          left: { isDown: boolean };
          right: { isDown: boolean };
          up: { isDown: boolean };
          down: { isDown: boolean };
          constructor() {
            this.left = { isDown: false };
            this.right = { isDown: false };
            this.up = { isDown: false };
            this.down = { isDown: false };
          }
        }
      }
    }
  }
};

// Mock the Phaser module
jest.mock('phaser', () => ({
  __esModule: true,
  default: PhaserMock,
  ...PhaserMock
})); 