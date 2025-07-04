// src/engine/GameScene.js - VISUAL RENDERING ONLY
import { EventTypes } from '../core/EventTypes.js';
import { Tile } from './Tile.js';
import { WordTracer } from '../ui/WordTracer.js';
const COLORS = { bgDark: 0x2c3e50, bgPanel: 0x34495e, primary: 0x3498db, success: 0x2ecc71, danger: 0xe74c3c, warning: 0xf39c12, purple: 0x9b59b6, cyan: 0x00d9ff, textLight: 0xecf0f1, textMuted: 0xbdc3c7, border: 0x34495e, tileNormal: 0xecf0f1, tileBomb: 0xe74c3c, tileIce: 0x3498db, tileStone: 0x7f8c8d, tileMultiplier: 0xf39c12, tileHidden: 0x9b59b6 };
const TILE_TYPES = { NORMAL: 'normal', BOMB: 'bomb', MULTIPLIER: 'multiplier', ICE: 'ice', STONE: 'stone', HIDDEN: 'hidden' };

export class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); this.tileSize = 64; this.strokeWidth = 2; this.selectedStrokeWidth = 4; this.previousSelection = []; this.destabilizedTiles = new Map(); this.tiles = []; }

    create() {
        this.eventBus = this.game.registry.get('eventBus');
        this.gridLogic = this.game.registry.get('gridLogic');
        if (!this.eventBus) { return; }
        if (!this.gridLogic) { return; }
        this.tiles = []; this.createGrid(); 
        this.wordTracer = new WordTracer(this);
        this.setupRenderListeners();
    }
    
    setupRenderListeners() {
        this.eventBus.on(EventTypes.GRID_UPDATED, (data) => this.renderGrid(data));
        this.eventBus.on(EventTypes.SELECTION_CHANGED, (data) => this.renderSelection(data));
        this.eventBus.on(EventTypes.TILES_REMOVED, (data) => this.animateExplosions(data));
        this.eventBus.on(EventTypes.TILE_DESTABILIZED, (data) => this.renderDestabilization(data));
        this.eventBus.on(EventTypes.RIPPLE_EFFECT, (data) => this.animateRippleEffect(data));
        this.eventBus.on(EventTypes.ANIMATION_STARTED, (data) => this.handleAnimationStarted(data));
        this.eventBus.on(EventTypes.ANIMATION_COMPLETE, (data) => this.handleAnimationComplete(data));
        this.eventBus.on(EventTypes.WORD_REJECTED, () => this.handleWordRejected());
        this.eventBus.on(EventTypes.WORD_VALIDATED, () => this.handleWordValidated());
    }
    
    createGrid() {
        const width = this.gridLogic.width, height = this.gridLogic.height;
        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < width; x++) {
                this.tiles[y][x] = null; // Will be created when grid data is received
            }
        }
    }
    
    renderGrid(data) {
        const gridData = data.grid || data;
        const width = this.gridLogic.width, height = this.gridLogic.height;
        const gridWidth = width * this.tileSize, gridHeight = height * this.tileSize;
        const offsetX = (this.game.config.width - gridWidth) / 2, offsetY = (this.game.config.height - gridHeight) / 2;
        
        for (let y = 0; y < gridData.length; y++) {
            for (let x = 0; x < gridData[y].length; x++) {
                const tileData = gridData[y][x];
                const existingTile = this.tiles[y][x];
                
                if (tileData) {
                    if (!existingTile) {
                        // Create new tile
                        const worldX = offsetX + x * this.tileSize + this.tileSize / 2;
                        const worldY = offsetY + y * this.tileSize + this.tileSize / 2;
                        this.tiles[y][x] = new Tile(this, x, y, {
                            type: tileData.type,
                            letter: tileData.letter,
                            value: tileData.value,
                            worldX: worldX,
                            worldY: worldY
                        });
                    } else {
                        // Don't update tile properties - tiles keep their identity!
                        // The grid update should only affect position, not content
                    }
                } else if (existingTile) {
                    // Remove tile
                    existingTile.sprite.destroy();
                    existingTile.textObject.destroy();
                    if (existingTile.valueText) existingTile.valueText.destroy();
                    existingTile.surgeIndicators.forEach(dot => dot.destroy());
                    this.tiles[y][x] = null;
                }
            }
        }
    }
    renderSelection(data) {
        // Clear previous selection
        this.previousSelection.forEach(pos => {
            const tile = this.tiles[pos.y] && this.tiles[pos.y][pos.x];
            if (tile) tile.setSelected(false);
        });
        // Apply new selection
        this.previousSelection = data.tiles || [];
        this.previousSelection.forEach(pos => {
            const tile = this.tiles[pos.y] && this.tiles[pos.y][pos.x];
            if (tile) tile.setSelected(true);
        });
        
        // Update word tracer with selected tiles
        if (this.wordTracer) {
            const tilesToTrace = this.previousSelection.map(pos => {
                return this.tiles[pos.y] && this.tiles[pos.y][pos.x];
            }).filter(tile => tile !== null);
            
            if (tilesToTrace.length === 0) {
                this.wordTracer.clear();
            } else {
                this.wordTracer.updateSelection(tilesToTrace);
            }
        }
    }
    animateExplosions(data) {
        const positions = data.positions || [];
        positions.forEach((pos, index) => {
            this.time.delayedCall(index * 50, () => {
                const tile = this.tiles[pos.y] && this.tiles[pos.y][pos.x];
                if (tile) {
                    const worldX = tile.worldX, worldY = tile.worldY;
                    // Hide tile with scale/fade animation
                    this.tweens.add({
                        targets: [tile.sprite, tile.textObject, tile.valueText].filter(Boolean),
                        scale: 0,
                        alpha: 0,
                        duration: 300,
                        ease: 'Back.easeIn'
                    });
                    // Create explosion particles
                    this.createExplosionParticles(worldX, worldY);
                }
            });
        });
    }
    renderDestabilization(data) {
        const tileData = data.tile;
        if (!tileData) return;
        const tile = this.tiles[tileData.y] && this.tiles[tileData.y][tileData.x];
        if (!tile) return;
        
        // Update tile's surge count and visual
        tile.surgeCount = data.surgeLevel || 0;
        tile.updateDestabilizationVisual();
    }
    
    animateRippleEffect(data) {
        const { epicenter, affectedTiles } = data;
        if (!epicenter) return;
        
        // Find the epicenter tile for position
        const epicenterTile = this.tiles[epicenter.y] && this.tiles[epicenter.y][epicenter.x];
        if (!epicenterTile) return;
        
        // Create expanding ring effect from epicenter
        const ring = this.add.circle(epicenterTile.worldX, epicenterTile.worldY, 30);
        ring.setStrokeStyle(3, 0x00d9ff); // Cyan color
        ring.setAlpha(0.8);
        
        this.tweens.add({
            targets: ring,
            scale: 3,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });
        
        // Visual feedback on affected tiles
        affectedTiles.forEach((tilePos, index) => {
            this.time.delayedCall(index * 30, () => {
                const tile = this.tiles[tilePos.y] && this.tiles[tilePos.y][tilePos.x];
                if (tile && tile.sprite) {
                    // Quick flash effect
                    this.tweens.add({
                        targets: tile.sprite,
                        scaleX: 1.1,
                        scaleY: 1.1,
                        duration: 150,
                        yoyo: true,
                        ease: 'Power2'
                    });
                }
            });
        });
    }
    
    handleAnimationStarted(data) {
        if (data.type === 'fall-batch' && data.target) {
            // Handle all falling tiles at once
            const { drops } = data.target;
            const width = this.gridLogic.width, height = this.gridLogic.height;
            const gridWidth = width * this.tileSize, gridHeight = height * this.tileSize;
            const offsetX = (this.game.config.width - gridWidth) / 2;
            const offsetY = (this.game.config.height - gridHeight) / 2;
            
            // Start all fall animations simultaneously
            drops.forEach(drop => {
                const { from, to } = drop;
                const fromTile = this.tiles[from.y] && this.tiles[from.y][from.x];
                
                if (fromTile) {
                    const targetY = offsetY + to.y * this.tileSize + this.tileSize / 2;
                    
                    // Collect all visual elements
                    const targets = [
                        fromTile.sprite, 
                        fromTile.textObject, 
                        fromTile.valueText,
                        ...(fromTile.surgeIndicators || [])
                    ].filter(Boolean);
                    
                    // Calculate fall distance for variable speed
                    const distance = to.y - from.y;
                    const baseDuration = 300;
                    const duration = Math.min(baseDuration + (distance * 60), 600); // Cap at 600ms
                    
                    // Animate with physics-like acceleration
                    this.tweens.add({
                        targets: targets,
                        y: targetY,
                        duration: duration,
                        ease: 'Quad.easeIn', // Gentler acceleration
                        onComplete: () => {
                            // Update tile position
                            fromTile.worldY = targetY;
                            fromTile.gridY = to.y;
                            this.tiles[to.y][to.x] = fromTile;
                            if (from.y !== to.y) {
                                this.tiles[from.y][from.x] = null;
                            }
                            fromTile.updateSurgeIndicators();
                        }
                    });
                }
            });
        }
    }
    
    handleAnimationComplete(data) { }
    
    getTileAt(x, y) {
        const width = this.gridLogic.width, height = this.gridLogic.height;
        const gridWidth = width * this.tileSize, gridHeight = height * this.tileSize;
        const offsetX = (this.game.config.width - gridWidth) / 2, offsetY = (this.game.config.height - gridHeight) / 2;
        const gridX = Math.floor((x - offsetX) / this.tileSize), gridY = Math.floor((y - offsetY) / this.tileSize);
        return (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) ? { x: gridX, y: gridY } : null;
    }
    
    createExplosionParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            const fragment = this.add.rectangle(x, y, 10, 10, COLORS.cyan);
            const angle = (i / 5) * Math.PI * 2;
            const distance = 100;
            this.tweens.add({
                targets: fragment,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                scale: 0,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => fragment.destroy()
            });
        }
    }
    
    handleWordRejected() {
        if (this.wordTracer) {
            this.wordTracer.setValidState(false);
            // Clear after a short delay to show the invalid state
            this.time.delayedCall(300, () => {
                this.wordTracer.clear();
            });
        }
    }
    
    handleWordValidated() {
        if (this.wordTracer) {
            this.wordTracer.setValidState(true);
            // Clear immediately as tiles will explode
            this.time.delayedCall(100, () => {
                this.wordTracer.clear();
            });
        }
    }
}