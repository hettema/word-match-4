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