// src/adapters/GridAdapter.js - HANDLES EVENTS for GridLogic
import { EventTypes } from '../core/EventTypes.js';

export class GridAdapter {
    constructor(gridLogic, eventBus) {
        this.gridLogic = gridLogic;
        this.eventBus = eventBus;
        
        // Listen for grid-affecting events
        eventBus.on(EventTypes.GRID_UPDATED, this.handleGridUpdated.bind(this));
        eventBus.on(EventTypes.WORD_VALIDATED, this.handleWordValidated.bind(this));
        eventBus.on(EventTypes.BOMB_TRIGGERED, this.handleBombTriggered.bind(this));
        eventBus.on(EventTypes.ANIMATION_COMPLETE, this.handleAnimationComplete.bind(this));
    }
    
    handleGridUpdated(data) {
        // Update GridLogic's internal state when grid changes
        if (data.grid) {
            this.gridLogic.updateGrid(data.grid);
        }
    }
    
    handleWordValidated(data) {
        const removedTiles = this.removeTiles(data.tiles);
        if (removedTiles.length > 0) {
            this.eventBus.emit(EventTypes.TILES_REMOVED, {
                positions: removedTiles,
                source: 'word',
                timestamp: Date.now()
            });
            // Don't apply gravity here - wait for all effects to complete
        }
    }
    
    handleBombTriggered(data) {
        const tilesToRemove = [{ x: data.x, y: data.y }, ...data.affectedTiles];
        const removedTiles = this.removeTiles(tilesToRemove);
        if (removedTiles.length > 0) {
            this.eventBus.emit(EventTypes.TILES_REMOVED, {
                positions: removedTiles,
                source: 'bomb',
                timestamp: Date.now()
            });
            // Don't apply gravity here - wait for all effects to complete
        }
    }
    
    removeTiles(tiles) {
        const removed = [];
        tiles.forEach(tile => {
            if (this.gridLogic.getTile(tile.x, tile.y) !== null) {
                removed.push({ x: tile.x, y: tile.y });
            }
        });
        
        if (removed.length > 0) {
            const newGrid = this.gridLogic.cloneGrid();
            removed.forEach(pos => newGrid[pos.y][pos.x] = null);
            this.gridLogic.updateGrid(newGrid);
        }
        return removed;
    }
    
    handleAnimationComplete(data) { this.applyGravityAndRefill(); }
    
    applyGravityAndRefill() {
        // Apply gravity
        const gravityResult = this.gridLogic.applyGravity();
        const tilesDropped = gravityResult.tilesDropped || [];
        
        if (gravityResult.changed) {
            this.gridLogic.updateGrid(gravityResult.grid);
            
            // Emit gravity applied event
            this.eventBus.emit(EventTypes.GRAVITY_APPLIED, {
                tilesDropped: tilesDropped,
                timestamp: Date.now()
            });
        }
        
        // Fill empty spaces with new tiles
        const fillResult = this.gridLogic.fillEmptySpaces((x, y) => this.generateNewTile(x, y));
        const newTiles = fillResult.newTiles || [];
        
        if (fillResult.changed) {
            this.gridLogic.updateGrid(fillResult.grid);
        }
        
        // Emit grid updated event with final state
        this.eventBus.emit(EventTypes.GRID_UPDATED, {
            grid: this.gridLogic.toArray(),
            changedPositions: [
                ...tilesDropped.map(d => d.to),
                ...newTiles.map(t => ({ x: t.x, y: t.y }))
            ],
            timestamp: Date.now()
        });
    }
    
    generateNewTile(x, y) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const letter = letters[Math.floor(Math.random() * letters.length)];
        const values = {A:1,E:1,I:1,O:1,U:1,L:1,N:1,R:1,S:1,T:1,D:2,G:2,B:3,C:3,M:3,P:3,F:4,H:4,V:4,W:4,Y:4,K:5,J:8,X:8,Q:10,Z:10};
        return { letter, value: values[letter] || 1, type: 'normal' };
    }
}