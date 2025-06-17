# Technical Design Document

**Product:** Word Match | **Version:** 3.1 | **Date:** January 17, 2025
**github repo** https://github.com/hettema/word-match-4.git

⚠️ **CRITICAL UPDATE**: This TDD now includes mandatory integration discipline requirements to prevent integration hell. See Section 1.2 for EventTypes.js requirements and Section 11 for the Integration Process.

## 🚨 KEY CHANGES FROM v3.0 to v3.1

1. **Runtime Contract Validation** - Automatic validation of event data against contracts
2. **Automated Browser Testing** - Test runner with result aggregation
3. **Integration Dashboard** - Visual status matrix for module integration
4. **Event Replay Debugging** - Record and replay event sequences
5. **Cascade Stress Testing** - Performance validation under extreme conditions
6. **Early Performance Benchmarking** - Profiling from Phase 4, not Phase 6

## 🚨 KEY CHANGES FROM v2.0

1. **EventTypes.js MUST be created first** - Single source of truth for all events
2. **Pure Functions + Adapters** - Core logic cannot emit events
3. **Ice Cubes Tests Required** - Every integration must be verified
4. **No Coordinators** - Forbidden patterns list added
5. **GameBootstrap.js** - Clear entry point showing all connections
6. **Integration-First Development** - Build one module at a time
7. **Evidence Requirements** - Must post test outputs before coding

**If you skip these requirements, the build WILL fail.**

## 1. Architecture Overview

### Core Principles
- **Integration-First Development**: Build one module at a time with verified event contracts
- **Pure Functions + Adapters**: Core logic is pure, adapters handle all event communication
- **Hybrid Phaser + HTML/CSS Architecture**: Phaser handles game logic, HTML/CSS handles visual effects
- **Event-Driven Timing Coordination**: Centralized event system prevents race conditions
- **State Machine Game Flow**: Predictable state transitions and input management
- **ES6 Modules**: Use ES6 module syntax for import/export
- **JSON Configuration**: Flexible level and settings management

### 1.1 CRITICAL ARCHITECTURE RULES

**🚨 RULE 1: EventBus is the ONLY Event System**
- ALL game events MUST go through EventBus
- Phaser's event system is ONLY used for Phaser-internal events (scene lifecycle, input detection)
- Phaser events must be IMMEDIATELY converted to EventBus events at the boundary
- NO game logic should ever listen to Phaser events directly

**🚨 RULE 2: Async Operations in Bootstrap/Adapters ONLY**
- Pure functions (GameLogic, GridLogic, etc.) must NEVER be async
- Pure functions must NEVER load files, make network requests, or use Promises
- ALL async operations happen in:
  - GameBootstrap.js (initial loading)
  - Adapters (if needed for external resources)
- Dictionary, level configs, etc. are loaded ONCE in Bootstrap and passed to pure functions

**🚨 RULE 3: All modules should use dependency injection **
- Modules should never themselvs create whatever other modules they need but receive them either in the constructor or in an init function (this will make it easier to inject moch modules when testing)

**🚨 RULE 4: The game runs in a browser! **
- The game can NOT use any Node dependant module
- The game can NOT use any Node dependant test frameworks as that will make the module Node dependant.
- All tests must run in the broswer and output all results both to the screen and to the console log!
- Use the `npx http-serve` command to start a local web server for accessing the tests
- Create a test index file in the test folder to make it easy to select what test to run in the browser
- When checking the results from the test, look in the console log
- when all tests have completed successfully, shut down the local web server `http-serve` BEFORE issuing any other command.

**🚨 RULE 5: Source files must be less that 500 lines **
- Rather use longer lines than shorter ones.
- If a source file is more than 500 lines, first try to reduce the number of lines by concatenating shorter lines into longer ones.
- If making longer lines isn't enough break out functionallity into utility classes or sub modules

### 1.2 MANDATORY: EventTypes.js First

**THIS FILE MUST BE CREATED BEFORE ANY OTHER CODE:**

```javascript
// src/core/EventTypes.js - SINGLE SOURCE OF TRUTH
export const EventTypes = {
  // Input Events
  TILE_PRESSED: 'TILE_PRESSED',
  TILE_ENTERED: 'TILE_ENTERED', 
  INPUT_RELEASED: 'INPUT_RELEASED',
  
  // Game State Events
  WORD_SUBMITTED: 'WORD_SUBMITTED',
  WORD_VALIDATED: 'WORD_VALIDATED',
  WORD_REJECTED: 'WORD_REJECTED',
  
  // Grid Events
  TILES_REMOVED: 'TILES_REMOVED',
  GRAVITY_APPLIED: 'GRAVITY_APPLIED',
  GRID_UPDATED: 'GRID_UPDATED',
  
  // Cascade Events
  TILE_DESTABILIZED: 'TILE_DESTABILIZED',
  CHAIN_REACTION_STARTED: 'CHAIN_REACTION_STARTED',
  RIPPLE_EFFECT: 'RIPPLE_EFFECT',
  
  // Special Tile Events
  BOMB_TRIGGERED: 'BOMB_TRIGGERED',
  ICE_DAMAGED: 'ICE_DAMAGED',
  STONE_DAMAGED: 'STONE_DAMAGED',
  MULTIPLIER_ACTIVATED: 'MULTIPLIER_ACTIVATED',
  HIDDEN_REVEALED: 'HIDDEN_REVEALED',
  
  // Score Events
  SCORE_CHANGED: 'SCORE_CHANGED',
  COMBO_CHANGED: 'COMBO_CHANGED',
  MOVES_CHANGED: 'MOVES_CHANGED',
  
  // Animation Events
  ANIMATION_STARTED: 'ANIMATION_STARTED',
  ANIMATION_COMPLETE: 'ANIMATION_COMPLETE',
  
  // Game Flow Events
  GAME_START: 'GAME_START',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
  LEVEL_LOADED: 'LEVEL_LOADED',
  DICTIONARY_LOADED: 'DICTIONARY_LOADED' // Added for async clarity
};

// Event Data Contracts - MUST MATCH EXACTLY
export const EventContracts = {
  TILE_PRESSED: {
    x: 'number',
    y: 'number',
    timestamp: 'number'
  },
  WORD_SUBMITTED: {
    word: 'string',
    tiles: 'Array<{x: number, y: number, letter: string}>',
    timestamp: 'number'
  },
  SCORE_CHANGED: {
    score: 'number',
    delta: 'number',
    source: 'string'
  },
  TILE_DESTABILIZED: {
    tile: '{x: number, y: number}',
    surgeLevel: 'number',
    source: 'string'
  },
  BOMB_TRIGGERED: {
    x: 'number',
    y: 'number',
    affectedTiles: 'Array<{x: number, y: number}>',
    timestamp: 'number'
  },
  ICE_DAMAGED: {
    x: 'number',
    y: 'number',
    remainingHealth: 'number',
    broken: 'boolean'
  },
  MULTIPLIER_ACTIVATED: {
    x: 'number',
    y: 'number',
    multiplier: 'number',
    wordScore: 'number'
  },
  DICTIONARY_LOADED: {
    wordCount: 'number',
    timestamp: 'number'
  }
  // Define ALL event contracts here
};

// Contract Validation Function - v3.1 Addition
export function validateEventContract(eventType, data) {
  const contract = EventContracts[eventType];
  if (!contract) return true; // No contract defined, allow
  
  // Check required fields
  for (const [key, expectedType] of Object.entries(contract)) {
    if (!(key in data)) {
      throw new ContractViolationError(
        `Missing required field '${key}' for event '${eventType}'`
      );
    }
    
    // Type validation
    const actualType = Array.isArray(data[key]) ? 'Array' : typeof data[key];
    const cleanExpectedType = expectedType.replace(/<.*>/, ''); // Remove generics
    
    if (cleanExpectedType === 'Array' && !Array.isArray(data[key])) {
      throw new ContractViolationError(
        `Field '${key}' must be an Array for event '${eventType}', got ${actualType}`
      );
    } else if (cleanExpectedType !== 'Array' && actualType !== cleanExpectedType) {
      throw new ContractViolationError(
        `Field '${key}' must be ${expectedType} for event '${eventType}', got ${actualType}`
      );
    }
  }
  
  return true;
}

// Custom error class for contract violations
export class ContractViolationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ContractViolationError';
  }
}
```

### 1.3 Forbidden Patterns (INSTANT REJECTION)

❌ **NEVER create these files:**
- `*Manager.js` (exceptions: TutorialManager, SettingsManager - historical)
- `*Controller.js`
- `*Coordinator.js` (EventCoordinator must be renamed to EventOrchestrator)
- `*Integration.js`

❌ **NEVER do this:**
- Direct coupling between systems
- Side effects in pure functions
- Event emission from pure logic modules
- Skipping ice cubes tests
- Using Phaser events for game logic
- Making pure functions async

### File Structure (UPDATED FOR INTEGRATION)
```
word-match/
├── index.html
├── GameBootstrap.js         # MANDATORY ENTRY POINT (NEW)
├── integration-test.html    # Ice cubes test harness (NEW)
├── score-visualizations.js  # HTML/CSS scoring effects
├── config/
│   ├── levels.json          # Level configurations
│   ├── settings.json        # Game settings
│   └── tutorial-levels.json # Tutorial configurations
├── src/
│   ├── core/                # PURE FUNCTIONS ONLY
│   │   ├── EventTypes.js        # MUST BE CREATED FIRST
│   │   ├── EventBus.js          # Event system with logging
│   │   ├── GameLogic.js         # Pure game logic (was GameState)
│   │   ├── GridLogic.js         # Pure grid logic (was Grid)
│   │   ├── ScoreLogic.js        # Pure scoring logic
│   │   └── GameStateMachine.js  # State machine
│   ├── adapters/            # EVENT BRIDGE LAYER (NEW)
│   │   ├── GameAdapter.js       # GameLogic ↔ EventBus
│   │   ├── GridAdapter.js       # GridLogic ↔ EventBus
│   │   ├── ScoreAdapter.js      # ScoreLogic ↔ EventBus
│   │   └── WordValidatorAdapter.js # WordValidator ↔ EventBus
│   ├── engine/
│   │   ├── GameScene.js         # Phaser scene (rendering only)
│   │   ├── InputHandler.js      # Input → Events only
│   │   ├── Tile.js              # Visual tile representation
│   │   └── EffectsQueue.js      # Animation sequencing
│   ├── systems/
│   │   ├── WordValidator.js     # Dictionary checking (pure after loading)
│   │   ├── HTMLEffectsManager.js # HTML effects coordination
│   │   └── EventOrchestrator.js # Renamed from EventCoordinator
│   ├── tutorial/
│   │   ├── TutorialManager.js   # Tutorial system (historical exception)
│   │   ├── TutorialOverlay.js   # Tutorial UI
│   │   └── TutorialInputRestrictor.js # Input restrictions
│   ├── debug/
│   │   └── DevelopmentCheats.js # Development tools
│   └── utils/
│       ├── LevelLoader.js       # Config loading
│       └── Logger.js            # Logging system
├── assets/
│   └── dict.txt                 # Word dictionary
├── style.css
├── tests/                       # Comprehensive test suite
│   └── ice-cubes/              # Integration contract tests (NEW)
└── docs/                        # Architecture documentation
    ├── INTEGRATION-PROCESS.md   # Step-by-step guide (NEW)
    ├── EVENT-CONTRACTS.md       # All event documentation (NEW)
    └── [existing docs]
```

## 2. Core Systems

### 2.1 GameBootstrap.js - MANDATORY ENTRY POINT (UPDATED)

**This file shows EXACTLY how all systems connect and handles ALL async operations:**

```javascript
// GameBootstrap.js - Created AFTER EventTypes.js
class GameBootstrap {
    constructor() {
        console.log('=== GAME BOOTSTRAP STARTING ===');
        
        // 1. Create the event bus (single instance)
        this.eventBus = new EventBus();
        
        // 2. Handle ALL async loading BEFORE creating systems
        this.loadResources().then(() => {
            this.initializeSystems();
            this.initializePhaser();
            this.startGame();
        }).catch(error => {
            console.error('Bootstrap failed:', error);
        });
    }
    
    async loadResources() {
        console.log('Loading resources...');
        
        // Load dictionary
        const dictResponse = await fetch('./assets/dict.txt');
        const dictText = await dictResponse.text();
        this.dictionaryWords = new Set(
            dictText.split('\n').map(w => w.trim().toUpperCase())
        );
        
        // Load level config
        const levelResponse = await fetch('./config/levels.json');
        this.levelConfig = await levelResponse.json();
        
        console.log('Resources loaded');
        this.eventBus.emit(EventTypes.DICTIONARY_LOADED, {
            wordCount: this.dictionaryWords.size,
            timestamp: Date.now()
        });
    }
    
    initializeSystems() {
        // 3. Create pure logic modules (no async, no events)
        this.gameLogic = new GameLogic();
        this.gridLogic = new GridLogic(8, 8); // From config later
        this.scoreLogic = new ScoreLogic();
        
        // WordValidator is NOW pure - receives pre-loaded dictionary
        this.wordValidator = new WordValidator(this.dictionaryWords);
        
        // 4. Create adapters (connect logic to events)
        this.gameAdapter = new GameAdapter(this.gameLogic, this.eventBus);
        this.gridAdapter = new GridAdapter(this.gridLogic, this.eventBus);
        this.scoreAdapter = new ScoreAdapter(this.scoreLogic, this.eventBus);
        this.wordValidatorAdapter = new WordValidatorAdapter(this.wordValidator, this.eventBus);
    }
    
    initializePhaser() {
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'game-container',
            scene: GameScene,
            // Pass references via registry
            callbacks: {
                preBoot: (game) => {
                    game.registry.set('eventBus', this.eventBus);
                    game.registry.set('gridLogic', this.gridLogic);
                    game.registry.set('gameLogic', this.gameLogic);
                }
            }
        };
        
        this.game = new Phaser.Game(config);
        
        // CRITICAL: Bridge Phaser events to our EventBus
        // This is the ONLY place Phaser events connect to game logic
        this.game.events.on('ready', () => {
            const scene = this.game.scene.getScene('GameScene');
            
            // Convert Phaser input events to EventBus events IMMEDIATELY
            scene.input.on('pointerdown', (pointer) => {
                const tile = scene.getTileAt(pointer.x, pointer.y);
                if (tile) {
                    // Phaser event → EventBus event (immediate conversion)
                    this.eventBus.emit(EventTypes.TILE_PRESSED, {
                        x: tile.x,
                        y: tile.y,
                        timestamp: Date.now()
                    });
                }
            });
            
            scene.input.on('pointermove', (pointer) => {
                // Similar conversion for move events
                if (scene.isTracing) {
                    const tile = scene.getTileAt(pointer.x, pointer.y);
                    if (tile) {
                        this.eventBus.emit(EventTypes.TILE_ENTERED, {
                            x: tile.x,
                            y: tile.y,
                            timestamp: Date.now()
                        });
                    }
                }
            });
            
            scene.input.on('pointerup', () => {
                this.eventBus.emit(EventTypes.INPUT_RELEASED, {
                    timestamp: Date.now()
                });
            });
        });
    }
    
    startGame() {
        console.log('Starting game');
        this.eventBus.emit(EventTypes.GAME_START, { level: 1 });
    }
}

// Entry point
window.addEventListener('DOMContentLoaded', () => {
    window.gameBootstrap = new GameBootstrap();
});
```

### 2.2 EventBus with Ice Cubes Support (UPDATED)

```javascript
// src/core/EventBus.js - Must support wildcard for testing
import { validateEventContract } from './EventTypes.js';

class EventBus extends EventTarget {
    constructor() {
        super();
        this._wildcardHandlers = [];
        this._eventLog = []; // For debugging
        this.enableLogging = true;
        this.enableContractValidation = true; // v3.1 - Can disable in production
        this.recordEvents = true; // v3.1 - For replay debugging
    }
    
    emit(type, data) {
        // v3.1 - Contract validation
        if (this.enableContractValidation) {
            try {
                validateEventContract(type, data);
            } catch (error) {
                console.error(`Contract violation for ${type}:`, error.message);
                console.error('Data:', data);
                throw error; // Fail fast in development
            }
        }
        
        if (this.enableLogging) {
            console.log(`[EVENT] ${type}:`, data);
        }
        
        // v3.1 - Enhanced event recording for replay
        if (this.recordEvents) {
            this._eventLog.push({ 
                type, 
                data: JSON.parse(JSON.stringify(data)), // Deep clone
                timestamp: Date.now(),
                stackTrace: new Error().stack // For debugging
            });
        }
        
        // Notify wildcard handlers first (for ice cubes tests)
        this._wildcardHandlers.forEach(handler => {
            handler(type, data);
        });
        
        // Regular event dispatch
        this.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
    
    on(type, handler) {
        // Support wildcard listeners for testing
        if (type === '*') {
            this._wildcardHandlers.push(handler);
            return;
        }
        
        // Regular event listener
        this.addEventListener(type, (event) => {
            handler(event.detail); // Handler receives data directly
        });
    }
    
    off(type, handler) {
        if (type === '*') {
            const index = this._wildcardHandlers.indexOf(handler);
            if (index > -1) {
                this._wildcardHandlers.splice(index, 1);
            }
            return;
        }
        
        this.removeEventListener(type, handler);
    }
    
    // v3.1 - Event replay for debugging
    replay(fromTimestamp = 0, toTimestamp = Date.now(), speed = 1) {
        const events = this._eventLog.filter(e => 
            e.timestamp >= fromTimestamp && e.timestamp <= toTimestamp
        );
        
        console.log(`Replaying ${events.length} events...`);
        
        events.forEach((event, index) => {
            const delay = index === 0 ? 0 : 
                (event.timestamp - events[index - 1].timestamp) / speed;
            
            setTimeout(() => {
                console.log(`[REPLAY] ${event.type}:`, event.data);
                this.emit(event.type, event.data);
            }, delay);
        });
    }
    
    // v3.1 - Get event log for analysis
    getEventLog(eventType = null) {
        if (eventType) {
            return this._eventLog.filter(e => e.type === eventType);
        }
        return [...this._eventLog];
    }
    
    // v3.1 - Clear event log
    clearEventLog() {
        this._eventLog = [];
    }
}
```

### 2.3 Timing Architecture (RENAMED)

#### EventOrchestrator.js - System Orchestration (was EventCoordinator)
```javascript
class EventOrchestrator {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.workflows = new Map();
        this.activeWorkflows = new Set();
    }
    
    async executeVictorySequence() {
        // Coordinates complex multi-system workflows
        await this.waitForAllSystems();
        this.eventBus.emit(EventTypes.ANIMATION_STARTED, { type: 'victory' });
    }
    
    async waitForAllSystems() {
        // Promise-based coordination (no more setTimeout polling)
        return new Promise((resolve) => {
            let waitingFor = ['effects', 'html', 'score'];
            
            const checkComplete = (system) => {
                waitingFor = waitingFor.filter(s => s !== system);
                if (waitingFor.length === 0) {
                    resolve();
                }
            };
            
            // Listen for completion events
            this.eventBus.on(EventTypes.ANIMATION_COMPLETE, (data) => {
                checkComplete(data.system);
            });
        });
    }
}
```

#### GameStateMachine.js - State Management
```javascript
class GameStateMachine {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentState = 'INITIALIZING';
        
        this.states = {
            INITIALIZING: { canTransitionTo: ['PLAYING'] },
            PLAYING: { canTransitionTo: ['ANIMATING', 'VICTORY', 'DEFEAT'] },
            ANIMATING: { canTransitionTo: ['PLAYING', 'VICTORY', 'DEFEAT'] },
            VICTORY: { canTransitionTo: ['TRANSITIONING'] },
            DEFEAT: { canTransitionTo: ['TRANSITIONING'] },
            TRANSITIONING: { canTransitionTo: ['INITIALIZING'] }
        };
        
        // Listen for state change triggers
        this.setupStateListeners();
    }
    
    setupStateListeners() {
        this.eventBus.on(EventTypes.GAME_START, () => {
            this.transitionTo('PLAYING');
        });
        
        this.eventBus.on(EventTypes.VICTORY, () => {
            this.transitionTo('VICTORY');
        });
        
        this.eventBus.on(EventTypes.DEFEAT, () => {
            this.transitionTo('DEFEAT');
        });
    }
    
    async transitionTo(newState) {
        // Validates transitions and prevents invalid state changes
        const currentConfig = this.states[this.currentState];
        if (!currentConfig.canTransitionTo.includes(newState)) {
            console.warn(`Invalid transition: ${this.currentState} → ${newState}`);
            return;
        }
        
        this.currentState = newState;
        this.eventBus.emit('STATE_CHANGED', {
            from: this.currentState,
            to: newState,
            timestamp: Date.now()
        });
    }
}
```

### 2.4 Adapter Pattern Examples (CRITICAL - UPDATED)

**Pure functions CANNOT emit events or be async. Adapters bridge this gap:**

```javascript
// src/core/GameLogic.js - PURE FUNCTIONS ONLY
class GameLogic {
    constructor() {
        this.score = 0;
        this.moves = 0;
        this.selectedTiles = [];
        this.gamePhase = 'playing';
    }
    
    // Pure function - returns new state, no events, no async
    selectTile(x, y) {
        if (this.gamePhase !== 'playing') {
            return { changed: false };
        }
        
        // Selection logic here
        const newTiles = [...this.selectedTiles, {x, y}];
        
        return {
            changed: true,
            selectedTiles: newTiles,
            isValidSelection: this.isValidPath(newTiles)
        };
    }
    
    // Pure function - returns action object
    submitWord() {
        if (this.selectedTiles.length < 3) {
            return { type: 'INVALID', reason: 'TOO_SHORT' };
        }
        
        const word = this.selectedTiles.map(t => t.letter).join('');
        return {
            type: 'SUBMIT_WORD',
            word: word,
            tiles: this.selectedTiles,
            baseScore: this.calculateBaseScore()
        };
    }
}

// src/systems/WordValidator.js - NOW PURE (no async loading)
class WordValidator {
    constructor(dictionarySet) {
        // Receives pre-loaded dictionary from Bootstrap
        this.dictionary = dictionarySet;
    }
    
    // Pure function - no async, no loading
    isValid(word) {
        return this.dictionary.has(word.toUpperCase());
    }
    
    // Pure function for additional validation
    getInvalidReason(word) {
        if (word.length < 3) return 'TOO_SHORT';
        if (!this.isValid(word)) return 'NOT_IN_DICTIONARY';
        return null;
    }
}

// src/adapters/GameAdapter.js - HANDLES ALL EVENTS
class GameAdapter {
    constructor(gameLogic, eventBus) {
        this.gameLogic = gameLogic;
        this.eventBus = eventBus;
        
        // Listen for events and call pure functions
        eventBus.on(EventTypes.TILE_PRESSED, this.handleTilePressed.bind(this));
        eventBus.on(EventTypes.INPUT_RELEASED, this.handleInputReleased.bind(this));
    }
    
    handleTilePressed(data) {
        // Call pure function
        const result = this.gameLogic.selectTile(data.x, data.y);
        
        // Emit events based on result
        if (result.changed) {
            this.eventBus.emit(EventTypes.SELECTION_CHANGED, {
                tiles: result.selectedTiles,
                isValid: result.isValidSelection
            });
        }
    }
    
    handleInputReleased(data) {
        // Get action from pure function
        const action = this.gameLogic.submitWord();
        
        if (action.type === 'SUBMIT_WORD') {
            this.eventBus.emit(EventTypes.WORD_SUBMITTED, {
                word: action.word,
                tiles: action.tiles,
                timestamp: Date.now()
            });
        } else if (action.type === 'INVALID') {
            this.eventBus.emit(EventTypes.WORD_REJECTED, {
                reason: action.reason,
                timestamp: Date.now()
            });
        }
    }
}
```

### 2.5 GameScene.js - Rendering Only (CLARIFIED)

```javascript
// src/engine/GameScene.js - VISUAL RENDERING ONLY
class GameScene extends Phaser.Scene {
    create() {
        // Get EventBus from registry (set by Bootstrap)
        this.eventBus = this.game.registry.get('eventBus');
        this.gridLogic = this.game.registry.get('gridLogic');
        
        // Create visual components
        this.tileSprites = [];
        this.createGrid();
        
        // Setup render listeners (EventBus events → visual updates)
        this.setupRenderListeners();
        
        // NO game logic here!
        // NO direct Phaser event listeners for game logic!
        // This scene ONLY renders based on EventBus events
    }
    
    setupRenderListeners() {
        // Listen to EventBus for rendering updates
        this.eventBus.on(EventTypes.GRID_UPDATED, (data) => {
            this.renderGrid(data.grid);
        });
        
        this.eventBus.on(EventTypes.SELECTION_CHANGED, (data) => {
            this.renderSelection(data.tiles);
        });
        
        this.eventBus.on(EventTypes.TILES_REMOVED, (data) => {
            this.animateExplosions(data.positions);
        });
        
        // etc...
    }
    
    getTileAt(x, y) {
        // Helper for InputHandler to find tiles
        // Returns grid position, not Phaser sprite
        // This enables the Bootstrap to convert pointer → grid coords
    }
    
    renderGrid(gridData) {
        // Pure rendering - update visuals based on grid state
    }
}
```

### GridLogic.js - Pure Grid Management (UPDATED)
```javascript
// src/core/GridLogic.js - PURE FUNCTIONS ONLY
class GridLogic {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = this.createEmptyGrid();
    }
    
    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.height; y++) {
            grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                grid[y][x] = null;
            }
        }
        return grid;
    }
    
    // Pure function - returns neighbors, no side effects
    getNeighbors(x, y, radius = 1) {
        const neighbors = [];
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (this.isValidPosition(nx, ny)) {
                    neighbors.push({x: nx, y: ny, tile: this.tiles[ny][nx]});
                }
            }
        }
        return neighbors;
    }
    
    // Pure function - returns new grid state after gravity
    applyGravity() {
        const newGrid = this.cloneGrid();
        // Gravity logic that returns new state
        return {
            grid: newGrid,
            tilesDropped: [] // List of tiles that moved
        };
    }
    
    // Pure function - identifies tiles affected by ripple
    calculateRipples(epicenters, spreadPercentage) {
        const affected = [];
        epicenters.forEach(pos => {
            const neighbors = this.getNeighbors(pos.x, pos.y);
            const toAffect = Math.floor(neighbors.length * spreadPercentage);
            // Select random neighbors to affect
            const selected = this.selectRandom(neighbors, toAffect);
            affected.push(...selected);
        });
        return affected;
    }
    
    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    cloneGrid() {
        return this.tiles.map(row => [...row]);
    }
    
    selectRandom(array, count) {
        const shuffled = [...array].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
}

// src/adapters/GridAdapter.js - HANDLES EVENTS
class GridAdapter {
    constructor(gridLogic, eventBus) {
        this.gridLogic = gridLogic;
        this.eventBus = eventBus;
        
        // Listen for grid-affecting events
        eventBus.on(EventTypes.TILES_REMOVED, this.handleTilesRemoved.bind(this));
        eventBus.on(EventTypes.APPLY_GRAVITY, this.handleApplyGravity.bind(this));
    }
    
    handleTilesRemoved(data) {
        // Calculate ripples using pure function
        const ripples = this.gridLogic.calculateRipples(
            data.positions, 
            data.rippleConfig.spreadPercentage
        );
        
        // Emit ripple effects
        this.eventBus.emit(EventTypes.RIPPLE_EFFECT, {
            affectedTiles: ripples,
            surgePower: data.rippleConfig.surgePower
        });
    }
    
    handleApplyGravity() {
        // Get new grid state from pure function
        const result = this.gridLogic.applyGravity();
        
        // Emit the changes
        this.eventBus.emit(EventTypes.GRAVITY_APPLIED, {
            newGrid: result.grid,
            tilesDropped: result.tilesDropped
        });
    }
}
```

### EffectsQueue.js - Animation Sequencing
```javascript
class EffectsQueue {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.queue = [];
        this.running = false;
    }
    
    add(effect) {
        this.queue.push(effect);
        if (!this.running) this.processNext();
    }
    
    async processNext() {
        if (this.queue.length === 0) {
            this.running = false;
            this.eventBus.emit(EventTypes.ANIMATION_COMPLETE, {
                system: 'effects',
                timestamp: Date.now()
            });
            return;
        }
        
        this.running = true;
        const effect = this.queue.shift();
        await this.runEffect(effect);
        this.processNext();
    }
    
    async runEffect(effect) {
        // Run the visual effect
        return new Promise((resolve) => {
            // Animation logic here
            setTimeout(resolve, 300); // Example
        });
    }
}
```

## 2.6 Contract Validation Layer (v3.1 Addition)

### Overview
The contract validation layer ensures that all events conform to their defined contracts, catching integration issues early and preventing subtle bugs from event data mismatches.

### Implementation
```javascript
// src/core/ContractValidator.js
import { EventContracts, ContractViolationError } from './EventTypes.js';

export class ContractValidator {
    static validate(eventType, data) {
        const contract = EventContracts[eventType];
        if (!contract) return true;
        
        // Validate each field
        for (const [field, type] of Object.entries(contract)) {
            this.validateField(eventType, field, type, data[field]);
        }
        
        // Check for extra fields (optional strictness)
        const extraFields = Object.keys(data).filter(
            key => !(key in contract)
        );
        if (extraFields.length > 0) {
            console.warn(`Extra fields in ${eventType}:`, extraFields);
        }
        
        return true;
    }
    
    static validateField(eventType, field, expectedType, value) {
        // Handle missing required fields
        if (value === undefined) {
            throw new ContractViolationError(
                `Missing required field '${field}' in event '${eventType}'`
            );
        }
        
        // Type validation logic
        if (expectedType.includes('Array')) {
            if (!Array.isArray(value)) {
                throw new ContractViolationError(
                    `Field '${field}' must be an Array in event '${eventType}'`
                );
            }
            // Validate array element types if specified
            if (expectedType.includes('<')) {
                // Parse generic type and validate elements
                this.validateArrayElements(field, expectedType, value);
            }
        }
        // Add more type validations as needed
    }
}
```

### Integration with EventBus
The EventBus automatically validates all emitted events when `enableContractValidation` is true (default in development). This catches contract violations immediately at the source.

### Benefits
1. **Early Detection**: Contract violations are caught at emit time, not when consumed
2. **Clear Error Messages**: Pinpoints exactly which field violates the contract
3. **Development Safety**: Can be disabled in production for performance
4. **Integration Confidence**: Ensures all modules speak the same "language"

## 3. Game Flow Implementation

### State Machine
```javascript
const GameStates = {
    WAITING: 'waiting',      // Waiting for input
    VALIDATING: 'validating', // Checking word
    EXPLODING: 'exploding',   // Processing explosions
    CASCADING: 'cascading',   // Tiles falling
    SETTLING: 'settling'      // Waiting for stability
};

class GameState {
    constructor() {
        this.current = GameStates.WAITING;
        this.moves = 0;
        this.score = 0;
        this.isAnimating = false;
    }
    
    canAcceptInput() {
        return this.current === GameStates.WAITING && !this.isAnimating;
    }
}
```

### Word Processing Pipeline
```javascript
async processWord(tiles) {
    // 1. Calculate base score
    const baseScore = this.scoreSystem.calculateBase(tiles);
    
    // 2. Queue explosion effects
    tiles.forEach(tile => {
        this.effectsQueue.add({
            type: 'explode',
            tile: tile,
            callback: () => this.handleExplosion(tile)
        });
    });
    
    // 3. Process ripples
    const ripples = this.calculateRipples(tiles);
    this.effectsQueue.add({
        type: 'ripple',
        tiles: ripples,
        callback: () => this.processRipples(ripples)
    });
    
    // 4. Wait for effects to complete
    this.events.once('effectsComplete', () => {
        this.grid.dropTiles();
        this.grid.refillGrid();
        this.state.isAnimating = false;
    });
}
```

## 4. Configuration System

### Level Config Structure
```json
{
    "levels": [
        {
            "id": 1,
            "gridSize": { "width": 8, "height": 8 },
            "targetScore": 1000,
            "moves": 20,
            "tileDistribution": "scrabble_uk", // References preset
            "ripple": {
                "spread": 0.5,      // 50% of surrounding tiles
                "power": 1,         // Surge strength
                "threshold": 3      // Hits to explode
            },
            "specialTiles": {
                "bomb": 0.05,       // 5% spawn rate
                "multiplier": 0.03,
                "ice": 0.04,
                "stone": 0.02,
                "hidden": 0.03
            }
        }
    ]
}
```

### Settings Loader (PURE - loads in Bootstrap)
```javascript
class LevelLoader {
    constructor(levelData) {
        this.levels = levelData.levels;
    }
    
    getLevel(levelId) {
        return this.levels.find(l => l.id === levelId);
    }
}
```

## 5. Special Tile Implementation

### Tile Types
```javascript
const TileTypes = {
    NORMAL: 'normal',
    BOMB: 'bomb',
    MULTIPLIER: 'multiplier',
    ICE: 'ice',
    STONE: 'stone',
    HIDDEN: 'hidden'
};

class Tile extends Phaser.GameObjects.Container {
    constructor(scene, x, y, letter, value, type = TileTypes.NORMAL) {
        super(scene);
        this.letter = letter;
        this.value = value;
        this.type = type;
        this.surgeCount = 0;
        this.health = this.getInitialHealth();
        
        this.createVisuals();
    }
    
    getInitialHealth() {
        switch(this.type) {
            case TileTypes.ICE: return 2;
            case TileTypes.STONE: return 4;
            default: return 0;
        }
    }
    
    canSelect() {
        return this.type === TileTypes.NORMAL || 
               this.type === TileTypes.HIDDEN ||
               (this.isSpecial() && this.health <= 0);
    }
}
```

## 6. Input Handling (CLARIFIED)

### Input Flow: Phaser → EventBus
The input handling is split into two parts:
1. **Phaser input detection** (in GameBootstrap)
2. **Game logic processing** (via EventBus and adapters)

```javascript
// This is handled in GameBootstrap.js (shown in section 2.1)
// Phaser detects input → immediately converts to EventBus events
// NO game logic in Phaser input handlers!

// Game logic responds to EventBus events:
class SelectionLogic {
    constructor() {
        this.selectedTiles = [];
        this.isTracing = false;
    }
    
    startSelection(x, y) {
        this.selectedTiles = [{x, y}];
        this.isTracing = true;
        return { started: true, tiles: this.selectedTiles };
    }
    
    addToSelection(x, y) {
        if (!this.isTracing) return { added: false };
        
        const lastTile = this.selectedTiles[this.selectedTiles.length - 1];
        if (this.areAdjacent(lastTile, {x, y})) {
            this.selectedTiles.push({x, y});
            return { added: true, tiles: this.selectedTiles };
        }
        
        return { added: false };
    }
    
    endSelection() {
        this.isTracing = false;
        const result = { tiles: this.selectedTiles };
        this.selectedTiles = [];
        return result;
    }
    
    areAdjacent(tile1, tile2) {
        const dx = Math.abs(tile1.x - tile2.x);
        const dy = Math.abs(tile1.y - tile2.y);
        return dx <= 1 && dy <= 1 && (dx + dy) > 0;
    }
}
```

## 7. Performance Optimizations

### Tile Pooling
```javascript
class TilePool {
    constructor(scene, size = 100) {
        this.pool = [];
        this.active = [];
        
        // Pre-create tiles
        for (let i = 0; i < size; i++) {
            const tile = new Tile(scene, 0, 0, '', 0);
            tile.setVisible(false);
            this.pool.push(tile);
        }
    }
    
    get() {
        return this.pool.pop() || new Tile(this.scene, 0, 0, '', 0);
    }
    
    release(tile) {
        tile.reset();
        tile.setVisible(false);
        this.pool.push(tile);
    }
}
```

## 8. Deployment

### Build Process
```bash
# Simple static hosting - no build required!
# Just serve the files:
python -m http.server 8000
# or
npx serve .
```

### Production Considerations
- Minify JS/CSS for production
- Cache dictionary file
- Use CDN for Phaser
- Enable gzip compression

## 9. Testing Strategy

### Critical Test Points
1. **Timing**: Ensure animations don't overlap
2. **State**: Verify state machine prevents invalid actions
3. **Memory**: Check tile pooling prevents leaks
4. **Touch**: Test on actual devices
5. **Dictionary**: Verify word validation speed

### Simple Test Harness
```javascript
// Add to game.js in dev mode
if (DEBUG) {
    window.game = this;
    window.testWord = (word) => {
        // Simulate word selection
    };
    window.testCascade = () => {
        // Trigger massive cascade
    };
}
```

## 9.1 Automated Browser Testing (v3.1 Addition)

### Test Runner Architecture

The automated test runner provides a browser-based testing framework that aggregates results and provides clear pass/fail reporting without manual console checking.

```javascript
// tests/test-runner.js
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentTest = null;
    }
    
    register(name, testFn) {
        this.tests.push({ name, testFn, status: 'pending' });
    }
    
    async runAll() {
        const startTime = Date.now();
        console.log('=== TEST RUN STARTED ===');
        
        for (const test of this.tests) {
            this.currentTest = test;
            try {
                await test.testFn();
                test.status = 'passed';
                console.log(`✅ ${test.name}`);
            } catch (error) {
                test.status = 'failed';
                test.error = error;
                console.error(`❌ ${test.name}:`, error.message);
            }
            this.results.push({...test});
        }
        
        const duration = Date.now() - startTime;
        this.generateReport(duration);
    }
    
    generateReport(duration) {
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        
        // Console report
        console.log('\n=== TEST SUMMARY ===');
        console.log(`Total: ${this.results.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Duration: ${duration}ms`);
        
        // DOM report
        this.renderHTMLReport();
        
        // Return summary for CI integration
        return {
            total: this.results.length,
            passed,
            failed,
            duration,
            results: this.results
        };
    }
    
    renderHTMLReport() {
        const container = document.getElementById('test-results');
        if (!container) return;
        
        const html = `
            <div class="test-summary ${this.results.some(r => r.status === 'failed') ? 'failed' : 'passed'}">
                <h2>Test Results</h2>
                <div class="stats">
                    <span class="passed">${this.results.filter(r => r.status === 'passed').length} passed</span>
                    <span class="failed">${this.results.filter(r => r.status === 'failed').length} failed</span>
                </div>
                <ul class="test-list">
                    ${this.results.map(r => `
                        <li class="${r.status}">
                            <span class="status-icon">${r.status === 'passed' ? '✅' : '❌'}</span>
                            <span class="test-name">${r.name}</span>
                            ${r.error ? `<pre class="error">${r.error.stack}</pre>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        container.innerHTML = html;
    }
}

// Test assertion utilities
class Assert {
    static equals(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }
    
    static deepEquals(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(message || `Objects not equal`);
        }
    }
    
    static throws(fn, message = '') {
        try {
            fn();
            throw new Error(message || 'Expected function to throw');
        } catch (e) {
            // Expected
        }
    }
}
```

### Integration Dashboard

```html
<!-- tests/integration-dashboard.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Integration Status Dashboard</title>
    <style>
        .integration-matrix {
            display: grid;
            grid-template-columns: 150px repeat(10, 100px);
            gap: 2px;
            margin: 20px;
        }
        .cell {
            padding: 10px;
            text-align: center;
            font-size: 12px;
        }
        .header { background: #333; color: white; }
        .pass { background: #4CAF50; color: white; }
        .fail { background: #f44336; color: white; }
        .pending { background: #ff9800; color: white; }
        .na { background: #ddd; color: #999; }
    </style>
</head>
<body>
    <h1>Integration Status Matrix</h1>
    <div id="matrix" class="integration-matrix"></div>
    
    <script type="module">
        import { IntegrationTester } from './integration-tester.js';
        
        const tester = new IntegrationTester();
        await tester.testAllIntegrations();
        tester.renderMatrix(document.getElementById('matrix'));
    </script>
</body>
</html>
```

### Usage in Development

1. **Running Tests**:
   ```bash
   npx http-server .
   # Navigate to http://localhost:8080/tests/
   ```

2. **Test Organization**:
   ```
   tests/
   ├── index.html           # Test runner UI
   ├── test-runner.js       # Core test framework
   ├── unit/               # Unit tests for pure functions
   ├── integration/        # Integration tests
   ├── ice-cubes/         # Contract validation tests
   └── performance/       # Performance benchmarks
   ```

3. **Writing Tests**:
   ```javascript
   // tests/unit/grid-logic.test.js
   const runner = new TestRunner();
   
   runner.register('GridLogic creates empty grid', async () => {
       const grid = new GridLogic(8, 8);
       Assert.equals(grid.width, 8);
       Assert.equals(grid.height, 8);
       Assert.equals(grid.tiles.length, 8);
   });
   
   // Auto-run on load
   window.addEventListener('load', () => runner.runAll());
   ```

## 10. Event System Boundaries (NEW SECTION)

### Where Events Convert

**Phaser → EventBus (in GameBootstrap ONLY)**
```javascript
// ✅ CORRECT: In GameBootstrap.js
scene.input.on('pointerdown', (pointer) => {
    const tile = scene.getTileAt(pointer.x, pointer.y);
    if (tile) {
        this.eventBus.emit(EventTypes.TILE_PRESSED, {x: tile.x, y: tile.y});
    }
});

// ❌ WRONG: In GameScene.js or anywhere else
scene.input.on('pointerdown', this.handleGameLogic); // NO!
```

**EventBus → Phaser Rendering (in GameScene ONLY)**
```javascript
// ✅ CORRECT: In GameScene.js
this.eventBus.on(EventTypes.GRID_UPDATED, (data) => {
    this.renderGrid(data.grid); // Visual update only
});

// ❌ WRONG: Game logic in scene
this.eventBus.on(EventTypes.WORD_SUBMITTED, (data) => {
    this.validateWord(data.word); // NO! Logic belongs in adapters
});
```

### Async Boundaries

**All async operations happen in Bootstrap or Adapters:**
```javascript
// ✅ CORRECT: In GameBootstrap.js
async loadResources() {
    const dict = await fetch('./assets/dict.txt');
    // ... process and pass to pure functions
}

// ❌ WRONG: In WordValidator.js (pure function)
async loadDictionary() { // NO! Pure functions can't be async
    const dict = await fetch('./assets/dict.txt');
}
```

## 11. Integration Process (MANDATORY)

### 11.1 Build Order - NO EXCEPTIONS

**Phase 1: Foundation (Day 1)**
1. Create `src/core/EventTypes.js` with ALL events and contract validation
2. Create `src/core/EventBus.js` with contract validation and replay support
3. Create `tests/test-runner.js` for automated testing (v3.1)
4. Create `integration-test.html` for ice cubes testing
5. Verify EventBus works with test events
6. **STOP - Run automated test suite and post results**

**Phase 2: Pure Logic + First Adapter (Day 2)**
1. Create `src/core/GameLogic.js` (pure functions only)
2. Write unit tests for GameLogic
3. Create `src/adapters/GameAdapter.js`
4. Create `GameBootstrap.js` with just these two
5. **STOP - Run ice cubes test showing event flow**
6. **STOP - Run automated test suite**
7. Verify: Input event → Adapter → Logic → Result event

**Phase 3: Add Grid System (Day 3)**
1. Create `src/core/GridLogic.js` (pure functions)
2. Write unit tests for GridLogic
3. Create `src/adapters/GridAdapter.js`
4. Update GameBootstrap.js
5. **STOP - Test grid events work with game events**
6. **STOP - Update integration dashboard**
7. **STOP - Run cascade stress tests** (v3.1)

**Phase 4: Continue One System at a Time**
- NEVER build multiple systems without integration
- ALWAYS run automated test suite after each module
- ALWAYS run ice cubes test after each adapter
- NEVER proceed if events don't match contracts
- Run performance benchmarks starting here (v3.1)

### 11.2 Ice Cubes Test Template

**Create this file IMMEDIATELY after EventBus:**

```html
<!-- integration-test.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Ice Cubes Test - Event Contract Verification</title>
    <script src="src/core/EventTypes.js"></script>
    <script src="src/core/EventBus.js"></script>
</head>
<body>
    <h1>Ice Cubes Test</h1>
    <button onclick="testTilePress()">Test Tile Press</button>
    <button onclick="testWordSubmit()">Test Word Submit</button>
    <pre id="output"></pre>
    
    <script>
        const eventBus = new EventBus();
        const output = document.getElementById('output');
        
        // Log ALL events
        eventBus.on('*', (type, data) => {
            const log = `EVENT: ${type}\nDATA: ${JSON.stringify(data, null, 2)}\n---\n`;
            output.textContent += log;
            console.log(log);
        });
        
        function testTilePress() {
            output.textContent = ''; // Clear
            eventBus.emit(EventTypes.TILE_PRESSED, {
                x: 3,
                y: 4,
                timestamp: Date.now()
            });
        }
        
        function testWordSubmit() {
            output.textContent = ''; // Clear
            // Load your adapter and test actual flow
            // This shows expected vs actual
        }
    </script>
</body>
</html>
```

### 11.3 Evidence Requirements for EVERY Card

**Before writing ANY code, you MUST post:**

```markdown
## Reading Evidence
- EventTypes.js defines: TILE_PRESSED, SELECTION_CHANGED
- GameLogic.selectTile() returns: {changed, selectedTiles, isValidSelection}
- GameAdapter listens to: TILE_PRESSED

## Ice Cubes Test Output
EVENT: TILE_PRESSED
DATA: {
  "x": 3,
  "y": 4,
  "timestamp": 1704935420123
}
---
EVENT: SELECTION_CHANGED
DATA: {
  "tiles": [{"x": 3, "y": 4}],
  "isValid": true
}

## Integration Strategy
GameAdapter will:
- Listen to: EventTypes.TILE_PRESSED
- Call: gameLogic.selectTile(data.x, data.y)
- Emit: EventTypes.SELECTION_CHANGED if changed
```

### 11.4 Daily Integration Checklist

**At the end of EVERY development day:**
- [ ] All new events added to EventTypes.js?
- [ ] All event contracts documented and validated?
- [ ] Automated test suite passing? (v3.1)
- [ ] Ice cubes tests passing for all integrations?
- [ ] Integration dashboard updated? (v3.1)
- [ ] No contract violations in event log? (v3.1)
- [ ] No direct module connections (only via EventBus)?
- [ ] No Manager/Controller/Coordinator files created?
- [ ] Can trigger from UI and see events in console?
- [ ] Performance benchmarks within targets? (v3.1)
- [ ] Tomorrow's integration strategy documented?

### 11.5 Common Integration Mistakes to AVOID

1. **Building Multiple Modules Before Integration**
   - ❌ Building GameLogic + GridLogic + ScoreLogic then trying to connect
   - ✅ Build GameLogic + Adapter, integrate, THEN build GridLogic

2. **Skipping Ice Cubes Tests**
   - ❌ "It's obvious this will work"
   - ✅ Run test, discover mismatch early, fix cheaply

3. **Direct Module Communication**
   - ❌ `this.gridLogic.updateTile()` from GameScene
   - ✅ `this.eventBus.emit(EventTypes.UPDATE_TILE, data)`

4. **Creating Coordinators**
   - ❌ `GameCoordinator` that manages everything
   - ✅ Separate adapters for each pure module

5. **Event Contract Drift**
   - ❌ Changing data shape without updating EventContracts
   - ✅ Update EventTypes.js FIRST, then update code

6. **Using Phaser Events for Game Logic**
   - ❌ `scene.input.on('pointerdown', this.validateWord)`
   - ✅ Convert to EventBus immediately in Bootstrap

7. **Making Pure Functions Async**
   - ❌ `async isValidWord() { await fetch... }`
   - ✅ Load resources in Bootstrap, pass to pure functions

### 11.6 Definition of Done for Integration

A module is NOT complete until:
- [ ] Pure logic has NO event imports
- [ ] Pure logic has NO async functions
- [ ] Adapter handles ALL events for that module
- [ ] Unit tests written and passing (v3.1)
- [ ] Ice cubes test shows correct event flow
- [ ] Event contracts in EventTypes.js match reality
- [ ] Contract validation passes without errors (v3.1)
- [ ] Can be triggered from UI (if applicable)
- [ ] No console errors
- [ ] Integration documented in code comments
- [ ] Performance benchmarks recorded (v3.1)

### 11.7 Cascade Stress Testing (v3.1 Addition)

**Purpose**: Validate that the cascade system handles extreme scenarios without timing conflicts, memory leaks, or performance degradation.

```javascript
// tests/performance/cascade-stress.test.js
class CascadeStressTester {
    constructor(eventBus, gridLogic) {
        this.eventBus = eventBus;
        this.gridLogic = gridLogic;
        this.metrics = {
            maxConcurrentExplosions: 0,
            totalExplosions: 0,
            peakMemory: 0,
            frameDrops: 0
        };
    }
    
    async testMaximumCascade() {
        console.log('=== CASCADE STRESS TEST: Maximum Cascade ===');
        
        // Fill grid with bombs
        const bombGrid = this.createBombGrid(8, 8);
        this.gridLogic.setGrid(bombGrid);
        
        // Monitor performance
        const startTime = performance.now();
        const startMemory = performance.memory?.usedJSHeapSize || 0;
        
        // Trigger single explosion at corner
        this.eventBus.emit(EventTypes.BOMB_TRIGGERED, {
            x: 0, y: 0,
            affectedTiles: this.gridLogic.getNeighbors(0, 0)
        });
        
        // Wait for all cascades to complete
        await this.waitForSettling();
        
        // Collect metrics
        const duration = performance.now() - startTime;
        const memoryUsed = (performance.memory?.usedJSHeapSize || 0) - startMemory;
        
        console.log('Results:', {
            duration: `${duration}ms`,
            explosions: this.metrics.totalExplosions,
            memoryDelta: `${(memoryUsed / 1024 / 1024).toFixed(2)}MB`,
            frameDrops: this.metrics.frameDrops
        });
        
        // Assertions
        Assert.isBelow(duration, 3000, 'Cascade completes within 3 seconds');
        Assert.isBelow(memoryUsed, 50 * 1024 * 1024, 'Memory usage under 50MB');
        Assert.equals(this.metrics.frameDrops, 0, 'No frame drops during cascade');
    }
    
    async testConcurrentCascades() {
        console.log('=== CASCADE STRESS TEST: Concurrent Cascades ===');
        
        // Create multiple isolated bomb clusters
        const clusterGrid = this.createClusterGrid();
        this.gridLogic.setGrid(clusterGrid);
        
        // Trigger multiple cascades simultaneously
        const triggers = [
            {x: 1, y: 1}, {x: 5, y: 1}, 
            {x: 1, y: 5}, {x: 5, y: 5}
        ];
        
        triggers.forEach(pos => {
            this.eventBus.emit(EventTypes.BOMB_TRIGGERED, {
                x: pos.x, y: pos.y,
                affectedTiles: this.gridLogic.getNeighbors(pos.x, pos.y)
            });
        });
        
        await this.waitForSettling();
        
        // Verify no race conditions or conflicts
        Assert.isTrue(this.gridLogic.isStable(), 'Grid reached stable state');
        Assert.equals(this.getErrorCount(), 0, 'No errors during concurrent cascades');
    }
    
    createBombGrid(width, height) {
        // Create grid filled with bomb tiles
        const grid = [];
        for (let y = 0; y < height; y++) {
            grid[y] = [];
            for (let x = 0; x < width; x++) {
                grid[y][x] = { type: 'bomb', x, y };
            }
        }
        return grid;
    }
}
```

**Stress Test Requirements**:
1. Must handle full-grid cascade (64 bombs) under 3 seconds
2. No memory leaks (< 50MB allocation for worst case)
3. Maintain 60 FPS during cascades
4. No race conditions with concurrent cascades
5. Graceful queue overflow handling

---
**Remember:** Integration discipline prevents integration hell. NO SHORTCUTS!