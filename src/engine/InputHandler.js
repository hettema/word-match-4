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
        
        // Check if this is a backtrack (going back to previous tile)
        if (this.selectedTiles.length >= 2) {
            const secondToLast = this.selectedTiles[this.selectedTiles.length - 2];
            if (secondToLast.x === x && secondToLast.y === y) {
                // Remove the last tile (backtracking)
                this.selectedTiles.pop();
                
                this.eventBus.emit(EventTypes.SELECTION_CHANGED, {
                    tiles: [...this.selectedTiles],
                    timestamp: timestamp || Date.now()
                });
                return;
            }
        }
        
        // Check if already selected (but not backtracking)
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
        
        // Emit selection complete if we have at least 2 tiles
        if (this.selectedTiles.length >= 2) {
            this.eventBus.emit(EventTypes.SELECTION_COMPLETE, {
                positions: [...this.selectedTiles],
                timestamp: timestamp || Date.now()
            });
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
    
    clearSelection(timestamp) {
        this.selectedTiles = [];
        
        this.eventBus.emit(EventTypes.SELECTION_CHANGED, {
            tiles: [],
            timestamp: timestamp || Date.now()
        });
    }
}