// src/adapters/GridAdapter.js - HANDLES EVENTS for GridLogic
import { EventTypes } from '../core/EventTypes.js';

export class GridAdapter {
    constructor(gridLogic, eventBus) {
        this.gridLogic = gridLogic;
        this.eventBus = eventBus;
        this.tileSurgeCount = new Map(); // Track surge count for each tile
        
        // Listen for grid-affecting events
        eventBus.on(EventTypes.GRID_UPDATED, this.handleGridUpdated.bind(this));
        eventBus.on(EventTypes.WORD_VALIDATED, this.handleWordValidated.bind(this));
        eventBus.on(EventTypes.BOMB_TRIGGERED, this.handleBombTriggered.bind(this));
        eventBus.on(EventTypes.ANIMATION_COMPLETE, this.handleAnimationComplete.bind(this));
        eventBus.on(EventTypes.TILE_DESTABILIZED, this.handleTileDestabilized.bind(this));
        eventBus.on(EventTypes.RIPPLE_EFFECT, this.handleRippleEffect.bind(this));
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
            
            // Calculate and emit ripple effects
            const spreadPercentage = 0.5; // Default 50% spread
            const ripples = this.gridLogic.calculateRipples(removedTiles, spreadPercentage);
            
            if (ripples.length > 0) {
                this.eventBus.emit(EventTypes.RIPPLE_EFFECT, {
                    epicenter: removedTiles[0], // Use first tile as epicenter
                    affectedTiles: ripples,
                    surgePower: 1,
                    timestamp: Date.now()
                });
            }
            // Don't apply gravity here - wait for ANIMATION_COMPLETE from EffectsQueue
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
            // Don't apply gravity here - wait for ANIMATION_COMPLETE from EffectsQueue
        }
    }
    
    removeTiles(tiles) {
        const removed = [];
        tiles.forEach(tile => {
            if (this.gridLogic.getTile(tile.x, tile.y) !== null) {
                removed.push({ x: tile.x, y: tile.y });
                // Clear surge count for removed tiles
                const key = `${tile.x},${tile.y}`;
                this.tileSurgeCount.delete(key);
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
            
            // Update surge counts for dropped tiles
            tilesDropped.forEach(drop => {
                const oldKey = `${drop.from.x},${drop.from.y}`;
                const newKey = `${drop.to.x},${drop.to.y}`;
                const surgeCount = this.tileSurgeCount.get(oldKey);
                if (surgeCount !== undefined) {
                    this.tileSurgeCount.delete(oldKey);
                    this.tileSurgeCount.set(newKey, surgeCount);
                }
            });
            
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
    
    handleTileDestabilized(data) {
        // When a tile reaches destabilization threshold, it explodes
        if (data.surgeLevel >= 3) {
            // Emit chain reaction started
            this.eventBus.emit(EventTypes.CHAIN_REACTION_STARTED, {
                origin: data.tile,
                chainLength: 1,
                timestamp: Date.now()
            });
            
            // Remove the destabilized tile
            const removedTiles = this.removeTiles([data.tile]);
            if (removedTiles.length > 0) {
                this.eventBus.emit(EventTypes.TILES_REMOVED, {
                    positions: removedTiles,
                    source: 'destabilization',
                    timestamp: Date.now()
                });
                
                // Calculate and emit new ripple effects from this explosion
                const spreadPercentage = 0.5; // Default 50% spread
                const ripples = this.gridLogic.calculateRipples(removedTiles, spreadPercentage);
                
                if (ripples.length > 0) {
                    this.eventBus.emit(EventTypes.RIPPLE_EFFECT, {
                        epicenter: removedTiles[0],
                        affectedTiles: ripples,
                        surgePower: 1,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }
    
    handleRippleEffect(data) {
        // Process ripple effects - apply surge damage to affected tiles
        const { affectedTiles, surgePower } = data;
        
        affectedTiles.forEach(tilePos => {
            const key = `${tilePos.x},${tilePos.y}`;
            const tile = this.gridLogic.getTile(tilePos.x, tilePos.y);
            
            if (tile && tile.type === 'normal') {
                // Increment surge count for this tile
                const currentSurge = this.tileSurgeCount.get(key) || 0;
                const newSurge = currentSurge + surgePower;
                this.tileSurgeCount.set(key, newSurge);
                
                // Emit tile destabilized event
                this.eventBus.emit(EventTypes.TILE_DESTABILIZED, {
                    tile: tilePos,
                    surgeLevel: newSurge,
                    source: 'ripple'
                });
            }
        });
    }
}