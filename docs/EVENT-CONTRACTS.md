# Event Contracts

This document defines all event contracts used in the Word Match game.

## Event Types

All events are defined in `src/core/EventTypes.js`. Each event has:
- A unique name (constant)
- A data contract (shape of the data)
- Clear producer/consumer relationships

## Contract Definitions

(This document will be populated when EventTypes.js is created)

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