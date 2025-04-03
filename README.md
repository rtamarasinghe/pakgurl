# PakGurl

A Pac-Man like game built with Phaser.js and TypeScript.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create an `assets` folder in the `public` directory and add the following images:
- player.png (player character)
- wall.png (wall tiles)
- dot.png (collectible dots)

## Development

To run the game in development mode:
```bash
npm start
```

The game will be available at `http://localhost:8080`

## Building for Production

To create a production build:
```bash
npm run build
```

The built files will be in the `dist` directory.

## Controls

- Arrow keys to move the player
- Collect dots to score points
- Avoid enemies 