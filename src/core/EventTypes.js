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
  TILE_PRESSED: { x: 'number', y: 'number', timestamp: 'number' },
  WORD_SUBMITTED: { word: 'string', tiles: 'Array<{x: number, y: number, letter: string}>', timestamp: 'number' },
  SCORE_CHANGED: { score: 'number', delta: 'number', source: 'string' },
  TILE_DESTABILIZED: { tile: '{x: number, y: number}', surgeLevel: 'number', source: 'string' },
  BOMB_TRIGGERED: { x: 'number', y: 'number', affectedTiles: 'Array<{x: number, y: number}>', timestamp: 'number' },
  ICE_DAMAGED: { x: 'number', y: 'number', remainingHealth: 'number', broken: 'boolean' },
  MULTIPLIER_ACTIVATED: { x: 'number', y: 'number', multiplier: 'number', wordScore: 'number' },
  DICTIONARY_LOADED: { wordCount: 'number', timestamp: 'number' },
  // Additional event contracts
  TILE_ENTERED: { x: 'number', y: 'number', timestamp: 'number' },
  INPUT_RELEASED: { timestamp: 'number' },
  WORD_VALIDATED: { word: 'string', score: 'number', tiles: 'Array<{x: number, y: number, letter: string}>', timestamp: 'number' },
  WORD_REJECTED: { word: 'string', reason: 'string', timestamp: 'number' },
  TILES_REMOVED: { positions: 'Array<{x: number, y: number}>', source: 'string', timestamp: 'number' },
  GRAVITY_APPLIED: { tilesDropped: 'Array<{from: {x: number, y: number}, to: {x: number, y: number}>', timestamp: 'number' },
  GRID_UPDATED: { grid: 'Array<Array<object>>', changedPositions: 'Array<{x: number, y: number}>', timestamp: 'number' },
  CHAIN_REACTION_STARTED: { origin: '{x: number, y: number}', chainLength: 'number', timestamp: 'number' },
  RIPPLE_EFFECT: { epicenter: '{x: number, y: number}', affectedTiles: 'Array<{x: number, y: number}>', surgePower: 'number', timestamp: 'number' },
  STONE_DAMAGED: { x: 'number', y: 'number', remainingHealth: 'number', broken: 'boolean' },
  HIDDEN_REVEALED: { x: 'number', y: 'number', letter: 'string', value: 'number', timestamp: 'number' },
  COMBO_CHANGED: { combo: 'number', multiplier: 'number', timestamp: 'number' },
  MOVES_CHANGED: { moves: 'number', movesUsed: 'number', timestamp: 'number' },
  ANIMATION_STARTED: { type: 'string', target: 'object', duration: 'number', timestamp: 'number' },
  ANIMATION_COMPLETE: { type: 'string', target: 'object', timestamp: 'number' },
  GAME_START: { level: 'number', timestamp: 'number' },
  VICTORY: { score: 'number', movesUsed: 'number', timeElapsed: 'number', timestamp: 'number' },
  DEFEAT: { score: 'number', movesUsed: 'number', reason: 'string', timestamp: 'number' },
  LEVEL_LOADED: { levelId: 'number', config: 'object', timestamp: 'number' }
};

// Contract Validation Function - v3.1 Addition (Enhanced)
export function validateEventContract(eventType, data) {
  const contract = EventContracts[eventType];
  if (!contract) return true; // No contract defined, allow
  
  // Performance tracking for < 5ms requirement
  const startTime = performance.now();
  
  try {
    // Check for missing fields
    for (const [key, expectedType] of Object.entries(contract)) {
      if (!(key in data)) {
        throw new ContractViolationError(
          `Missing required field '${key}' for event '${eventType}'`
        );
      }
      
      // Validate field type
      validateFieldType(key, data[key], expectedType, eventType);
    }
    
    // Warn about extra fields (doesn't throw, just warns)
    if (typeof data === 'object' && data !== null) {
      const extraFields = Object.keys(data).filter(key => !(key in contract));
      if (extraFields.length > 0) {
        console.warn(`[CONTRACT] Extra fields in ${eventType}:`, extraFields);
      }
    }
    
    const validationTime = performance.now() - startTime;
    if (validationTime > 5) {
      console.warn(`[CONTRACT] Validation took ${validationTime.toFixed(2)}ms for ${eventType}`);
    }
    
    return true;
  } catch (error) {
    // Re-throw with validation time info
    const validationTime = performance.now() - startTime;
    error.validationTime = validationTime;
    throw error;
  }
}

// Helper function to validate field types with better object/array support
function validateFieldType(fieldName, value, expectedType, eventType) {
  const actualType = Array.isArray(value) ? 'Array' : typeof value;
  
  // Handle Array types
  if (expectedType.startsWith('Array')) {
    if (!Array.isArray(value)) {
      throw new ContractViolationError(
        `Field '${fieldName}' must be an Array for event '${eventType}', got ${actualType}`
      );
    }
    
    // Validate array element types if specified
    if (expectedType.includes('<') && expectedType.includes('>')) {
      const elementType = expectedType.match(/Array<(.+)>/)?.[1];
      if (elementType && value.length > 0) {
        // Check first few elements for performance
        const samplesToCheck = Math.min(value.length, 3);
        for (let i = 0; i < samplesToCheck; i++) {
          if (elementType.includes('{')) {
            // Object shape validation
            validateObjectShape(value[i], elementType, `${fieldName}[${i}]`, eventType);
          } else if (elementType === 'object' && typeof value[i] !== 'object') {
            throw new ContractViolationError(
              `Array element ${fieldName}[${i}] must be object for event '${eventType}'`
            );
          }
        }
      }
    }
    return;
  }
  
  // Handle object shape types like '{x: number, y: number}'
  if (expectedType.startsWith('{') && expectedType.endsWith('}')) {
    if (typeof value !== 'object' || value === null) {
      throw new ContractViolationError(
        `Field '${fieldName}' must be an object for event '${eventType}', got ${actualType}`
      );
    }
    validateObjectShape(value, expectedType, fieldName, eventType);
    return;
  }
  
  // Handle basic types
  if (actualType !== expectedType) {
    throw new ContractViolationError(
      `Field '${fieldName}' must be ${expectedType} for event '${eventType}', got ${actualType}`
    );
  }
}

// Validate object shapes like {x: number, y: number}
function validateObjectShape(obj, shapeStr, fieldPath, eventType) {
  // Simple parser for object shapes
  const shape = shapeStr.match(/{(.+)}/)?.[1];
  if (!shape) return;
  
  // Parse simple key:type pairs
  const pairs = shape.split(',').map(p => p.trim());
  for (const pair of pairs) {
    const [key, type] = pair.split(':').map(s => s.trim());
    if (key && type) {
      if (!(key in obj)) {
        throw new ContractViolationError(
          `Missing required property '${key}' in ${fieldPath} for event '${eventType}'`
        );
      }
      const actualType = typeof obj[key];
      if (actualType !== type) {
        throw new ContractViolationError(
          `Property '${key}' in ${fieldPath} must be ${type} for event '${eventType}', got ${actualType}`
        );
      }
    }
  }
}

// Custom error class for contract violations
export class ContractViolationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ContractViolationError';
  }
}