# Event Contracts

This document defines all event contracts used in the Word Match game.

## Event Types

All events are defined in `src/core/EventTypes.js`. Each event has:
- A unique name (constant)
- A data contract (shape of the data)
- Clear producer/consumer relationships

## Contract Definitions

### Input Events
- **TILE_PRESSED**: `{x: number, y: number, timestamp: number}`
- **TILE_ENTERED**: `{x: number, y: number, timestamp: number}`
- **INPUT_RELEASED**: `{timestamp: number}`

### Game State Events
- **WORD_SUBMITTED**: `{word: string, tiles: Array<{x, y, letter}>, timestamp: number}`
- **WORD_VALIDATED**: `{word: string, score: number, tiles: Array, timestamp: number}`
- **WORD_REJECTED**: `{word: string, reason: string, timestamp: number}`

### Grid Events
- **TILES_REMOVED**: `{positions: Array<{x, y}>, source: string, timestamp: number}`
- **GRAVITY_APPLIED**: `{tilesDropped: Array<{from: {x, y}, to: {x, y}, tile: object}>, timestamp: number}`
- **GRID_UPDATED**: `{grid: Array<Array>, changedPositions: Array, timestamp: number}`

### Cascade Events
- **TILE_DESTABILIZED**: `{tile: {x, y}, surgeLevel: number, source: string}`
- **CHAIN_REACTION_STARTED**: `{origin: {x, y}, chainLength: number, timestamp: number}`
- **RIPPLE_EFFECT**: `{epicenter: {x, y}, affectedTiles: Array, surgePower: number, timestamp: number}`

### Special Tile Events
- **BOMB_TRIGGERED**: `{x: number, y: number, affectedTiles: Array, timestamp: number}`
- **ICE_DAMAGED**: `{x: number, y: number, remainingHealth: number, broken: boolean}`
- **STONE_DAMAGED**: `{x: number, y: number, remainingHealth: number, broken: boolean}`
- **MULTIPLIER_ACTIVATED**: `{x: number, y: number, multiplier: number, wordScore: number}`
- **HIDDEN_REVEALED**: `{x: number, y: number, letter: string, value: number, timestamp: number}`

### Score Events
- **SCORE_CHANGED**: `{score: number, delta: number, source: string}`
- **COMBO_CHANGED**: `{combo: number, multiplier: number, timestamp: number}`
- **MOVES_CHANGED**: `{moves: number, movesUsed: number, timestamp: number}`

### Animation Events
- **ANIMATION_STARTED**: `{type: string, target: object, duration: number, timestamp: number}`
- **ANIMATION_COMPLETE**: `{type: string, target: object, timestamp: number}`

### Game Flow Events
- **GAME_START**: `{level: number, timestamp: number}`
- **VICTORY**: `{score: number, movesUsed: number, timeElapsed: number, timestamp: number}`
- **DEFEAT**: `{score: number, movesUsed: number, reason: string, timestamp: number}`
- **LEVEL_LOADED**: `{levelId: number, config: object, timestamp: number}`
- **DICTIONARY_LOADED**: `{wordCount: number, timestamp: number}`

## Event Flow Diagrams

### Input Flow
```
User Input → InputHandler → TILE_PRESSED → GameAdapter → GameLogic
```

### Word Validation Flow
```
WORD_SUBMITTED → WordValidatorAdapter → WordValidator → WORD_VALIDATED/REJECTED
```

### Cascade Flow
```
TILES_REMOVED → GridAdapter → RIPPLE_EFFECT → GRAVITY_APPLIED → GRID_UPDATED
```