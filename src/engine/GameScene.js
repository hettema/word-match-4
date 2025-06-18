// src/engine/GameScene.js - VISUAL RENDERING ONLY
import { EventTypes } from '../core/EventTypes.js';
const COLORS = { bgDark: 0x2c3e50, bgPanel: 0x34495e, primary: 0x3498db, success: 0x2ecc71, danger: 0xe74c3c, warning: 0xf39c12, purple: 0x9b59b6, cyan: 0x00d9ff, textLight: 0xecf0f1, textMuted: 0xbdc3c7, border: 0x34495e, tileNormal: 0xecf0f1, tileBomb: 0xe74c3c, tileIce: 0x3498db, tileStone: 0x7f8c8d, tileMultiplier: 0xf39c12, tileHidden: 0x9b59b6 };
const TILE_TYPES = { NORMAL: 'normal', BOMB: 'bomb', MULTIPLIER: 'multiplier', ICE: 'ice', STONE: 'stone', HIDDEN: 'hidden' };

export class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); this.tileSize = 64; this.strokeWidth = 2; }

    create() {
        console.log('GameScene create() called');
        this.eventBus = this.game.registry.get('eventBus');
        this.gridLogic = this.game.registry.get('gridLogic');
        if (!this.eventBus) { console.error('EventBus not found in registry!'); return; }
        if (!this.gridLogic) { console.error('GridLogic not found in registry!'); return; }
        this.tileSprites = []; this.createGrid(); this.setupRenderListeners();
        console.log('GameScene initialized successfully');
    }
    
    setupRenderListeners() {
        console.log('Setting up render listeners...');
        this.eventBus.on(EventTypes.GRID_UPDATED, (data) => this.renderGrid(data));
        this.eventBus.on(EventTypes.SELECTION_CHANGED, (data) => this.renderSelection(data));
        this.eventBus.on(EventTypes.TILES_REMOVED, (data) => this.animateExplosions(data));
        this.eventBus.on(EventTypes.TILE_DESTABILIZED, (data) => this.renderDestabilization(data));
        this.eventBus.on(EventTypes.ANIMATION_STARTED, (data) => this.handleAnimationStarted(data));
        this.eventBus.on(EventTypes.ANIMATION_COMPLETE, (data) => this.handleAnimationComplete(data));
        console.log('All render listeners registered');
    }
    
    createGrid() {
        console.log('Creating grid structure...');
        const width = this.gridLogic.width, height = this.gridLogic.height;
        const gridWidth = width * this.tileSize, gridHeight = height * this.tileSize;
        const offsetX = (this.game.config.width - gridWidth) / 2, offsetY = (this.game.config.height - gridHeight) / 2;
        console.log(`Grid: ${width}x${height}, Offset: ${offsetX}, ${offsetY}`);
        for (let y = 0; y < height; y++) {
            this.tileSprites[y] = [];
            for (let x = 0; x < width; x++) {
                const worldX = offsetX + x * this.tileSize + this.tileSize / 2, worldY = offsetY + y * this.tileSize + this.tileSize / 2;
                const container = this.add.container(worldX, worldY);
                const bg = this.add.rectangle(0, 0, this.tileSize - 2, this.tileSize - 2, 0xecf0f1);
                bg.setStrokeStyle(this.strokeWidth, 0x34495e); container.add(bg);
                const text = this.add.text(0, 0, '', { fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#000000' }).setOrigin(0.5);
                container.add(text);
                const valueText = this.add.text(20, 20, '', { fontFamily: 'Arial', fontSize: '10px', color: '#666666' }).setOrigin(0.5);
                container.add(valueText);
                this.tileSprites[y][x] = { container, background: bg, text, valueText, gridX: x, gridY: y };
                container.setVisible(false);
            }
        }
        console.log(`Created ${width * height} tile sprites (all hidden)`);
    }
    
    renderGrid(data) {
        console.log('renderGrid called with:', data);
        const gridData = data.grid || data;
        for (let y = 0; y < gridData.length; y++) {
            for (let x = 0; x < gridData[y].length; x++) {
                const tile = gridData[y][x], sprite = this.tileSprites[y][x];
                if (tile) {
                    sprite.container.setVisible(true);
                    sprite.background.setFillStyle(this.getTileColor(tile.type));
                    sprite.text.setText(this.getTileDisplayText(tile));
                    if (tile.type === TILE_TYPES.NORMAL || !tile.type) {
                        sprite.valueText.setText(tile.value || '').setVisible(true);
                    } else { sprite.valueText.setVisible(false); }
                    sprite.container.setScale(1).setAlpha(1);
                } else { sprite.container.setVisible(false); }
            }
        }
    }
    renderSelection(data) { console.log('renderSelection called with:', data); }
    animateExplosions(data) { console.log('animateExplosions called with:', data); }
    renderDestabilization(data) { console.log('renderDestabilization called with:', data); }
    handleAnimationStarted(data) { console.log('handleAnimationStarted called with:', data); }
    handleAnimationComplete(data) { console.log('handleAnimationComplete called with:', data); }
    
    getTileAt(x, y) {
        const width = this.gridLogic.width, height = this.gridLogic.height;
        const gridWidth = width * this.tileSize, gridHeight = height * this.tileSize;
        const offsetX = (this.game.config.width - gridWidth) / 2, offsetY = (this.game.config.height - gridHeight) / 2;
        const gridX = Math.floor((x - offsetX) / this.tileSize), gridY = Math.floor((y - offsetY) / this.tileSize);
        return (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) ? { x: gridX, y: gridY } : null;
    }
    
    getTileColor(type) {
        const colors = { [TILE_TYPES.NORMAL]: COLORS.tileNormal, [TILE_TYPES.BOMB]: COLORS.tileBomb, [TILE_TYPES.ICE]: COLORS.tileIce, [TILE_TYPES.STONE]: COLORS.tileStone, [TILE_TYPES.MULTIPLIER]: COLORS.tileMultiplier, [TILE_TYPES.HIDDEN]: COLORS.tileHidden };
        return colors[type] || COLORS.tileNormal;
    }
    
    getTileDisplayText(tile) {
        const displays = { [TILE_TYPES.BOMB]: '💣', [TILE_TYPES.ICE]: '🧊', [TILE_TYPES.STONE]: '🪨', [TILE_TYPES.MULTIPLIER]: '×2', [TILE_TYPES.HIDDEN]: '?' };
        return displays[tile.type] || tile.letter || '';
    }
}