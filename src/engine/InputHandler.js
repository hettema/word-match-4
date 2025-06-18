// InputHandler.js - Manages word tracing and input events
import { EventTypes } from '../core/EventTypes.js';

export class InputHandler {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.selectedTiles = [];
        this.isTracing = false;
    }
    
    init() {
        this.eventBus.on(EventTypes.TILE_PRESSED, (data) => this.handleTilePressed(data));
        this.eventBus.on(EventTypes.TILE_ENTERED, (data) => this.handleTileEntered(data));
        this.eventBus.on(EventTypes.INPUT_RELEASED, (data) => this.handleInputReleased(data));
    }
    
    handleTilePressed(data) {
        const { x, y, timestamp } = data;
        this.isTracing = true;
        this.selectedTiles = [{ x, y }];
        
        this.eventBus.emit(EventTypes.SELECTION_CHANGED, {
            tiles: [...this.selectedTiles],
            timestamp: timestamp || Date.now()
        });
    }
    
    handleTileEntered(data) {
        if (!this.isTracing) return;
        
        const { x, y, timestamp } = data;
        
        // Check if already selected
        if (this.isAlreadySelected(x, y)) return;
        
        // Check if adjacent to last tile
        const lastTile = this.selectedTiles[this.selectedTiles.length - 1];
        if (!this.areAdjacent(lastTile, { x, y })) return;
        
        // Add to selection
        this.selectedTiles.push({ x, y });
        
        this.eventBus.emit(EventTypes.SELECTION_CHANGED, {
            tiles: [...this.selectedTiles],
            timestamp: timestamp || Date.now()
        });
    }
    
    handleInputReleased(data) {
        if (!this.isTracing) return;
        
        const { timestamp } = data;
        this.isTracing = false;
        
        // Submit word if we have selected tiles
        if (this.selectedTiles.length > 0) {
            this.submitWord(timestamp);
        }
        
        this.clearSelection(timestamp);
    }
    
    areAdjacent(tile1, tile2) {
        const dx = Math.abs(tile1.x - tile2.x);
        const dy = Math.abs(tile1.y - tile2.y);
        return dx <= 1 && dy <= 1 && (dx + dy) > 0;
    }
    
    isAlreadySelected(x, y) {
        return this.selectedTiles.some(tile => tile.x === x && tile.y === y);
    }
    
    submitWord(timestamp) {
        // Build word from tiles with placeholder letters for now
        // In real implementation, this would get actual letters from the grid
        const tilesWithLetters = this.selectedTiles.map((tile, i) => ({
            x: tile.x,
            y: tile.y,
            letter: String.fromCharCode(65 + i) // A, B, C, etc.
        }));
        
        const word = tilesWithLetters.map(t => t.letter).join('');
        
        this.eventBus.emit(EventTypes.WORD_SUBMITTED, {
            word: word,
            tiles: tilesWithLetters,
            timestamp: timestamp || Date.now()
        });
    }
    
    clearSelection(timestamp) {
        this.selectedTiles = [];
        
        this.eventBus.emit(EventTypes.SELECTION_CHANGED, {
            tiles: [],
            timestamp: timestamp || Date.now()
        });
    }
}