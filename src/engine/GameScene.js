// src/engine/GameScene.js - VISUAL RENDERING ONLY
import { EventTypes } from '../core/EventTypes.js';
const COLORS = { bgDark: 0x2c3e50, bgPanel: 0x34495e, primary: 0x3498db, success: 0x2ecc71, danger: 0xe74c3c, warning: 0xf39c12, purple: 0x9b59b6, cyan: 0x00d9ff, textLight: 0xecf0f1, textMuted: 0xbdc3c7, border: 0x34495e, tileNormal: 0xecf0f1, tileBomb: 0xe74c3c, tileIce: 0x3498db, tileStone: 0x7f8c8d, tileMultiplier: 0xf39c12, tileHidden: 0x9b59b6 };
const TILE_TYPES = { NORMAL: 'normal', BOMB: 'bomb', MULTIPLIER: 'multiplier', ICE: 'ice', STONE: 'stone', HIDDEN: 'hidden' };

export class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); this.tileSize = 64; this.strokeWidth = 2; this.selectedStrokeWidth = 4; this.previousSelection = []; this.destabilizedTiles = new Map(); }

    create() {
        this.eventBus = this.game.registry.get('eventBus');
        this.gridLogic = this.game.registry.get('gridLogic');
        if (!this.eventBus) { console.error('EventBus not found in registry!'); return; }
        if (!this.gridLogic) { console.error('GridLogic not found in registry!'); return; }
        this.tileSprites = []; this.createGrid(); this.setupRenderListeners();
    }
    
    setupRenderListeners() {
        this.eventBus.on(EventTypes.GRID_UPDATED, (data) => this.renderGrid(data));
        this.eventBus.on(EventTypes.SELECTION_CHANGED, (data) => this.renderSelection(data));
        this.eventBus.on(EventTypes.TILES_REMOVED, (data) => this.animateExplosions(data));
        this.eventBus.on(EventTypes.TILE_DESTABILIZED, (data) => this.renderDestabilization(data));
        this.eventBus.on(EventTypes.ANIMATION_STARTED, (data) => this.handleAnimationStarted(data));
        this.eventBus.on(EventTypes.ANIMATION_COMPLETE, (data) => this.handleAnimationComplete(data));
    }
    
    createGrid() {
        const width = this.gridLogic.width, height = this.gridLogic.height;
        const gridWidth = width * this.tileSize, gridHeight = height * this.tileSize;
        const offsetX = (this.game.config.width - gridWidth) / 2, offsetY = (this.game.config.height - gridHeight) / 2;
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
    }
    
    renderGrid(data) {
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
    renderSelection(data) {
        // Clear previous selection
        this.previousSelection.forEach(pos => {
            const sprite = this.tileSprites[pos.y][pos.x];
            sprite.background.setStrokeStyle(this.strokeWidth, COLORS.border);
            this.tweens.add({ targets: [sprite.container], scaleX: 1, scaleY: 1, duration: 100 });
        });
        // Apply new selection
        this.previousSelection = data.selected || [];
        this.previousSelection.forEach(pos => {
            const sprite = this.tileSprites[pos.y][pos.x];
            sprite.background.setStrokeStyle(this.selectedStrokeWidth, COLORS.cyan);
            this.tweens.add({ targets: [sprite.container], scaleX: 1.15, scaleY: 1.15, duration: 200, ease: 'Back.easeOut' });
        });
    }
    animateExplosions(data) {
        const positions = data.positions || [];
        positions.forEach((pos, index) => {
            this.time.delayedCall(index * 50, () => {
                const sprite = this.tileSprites[pos.y][pos.x];
                const worldX = sprite.container.x, worldY = sprite.container.y;
                // Hide tile with scale/fade animation
                this.tweens.add({
                    targets: [sprite.container],
                    scale: 0,
                    alpha: 0,
                    duration: 300,
                    ease: 'Back.easeIn'
                });
                // Create explosion particles
                this.createExplosionParticles(worldX, worldY);
            });
        });
    }
    renderDestabilization(data) {
        const tile = data.tile;
        if (!tile) return;
        const key = `${tile.x},${tile.y}`;
        const sprite = this.tileSprites[tile.y][tile.x];
        
        // Store/update destabilization info
        if (tile.surgeCount > 0) {
            const existing = this.destabilizedTiles.get(key);
            if (existing) {
                if (existing.wobbleTween) existing.wobbleTween.stop();
                if (existing.shakeTween) existing.shakeTween.stop();
                if (existing.indicators) existing.indicators.forEach(dot => dot.destroy());
            }
            
            // Apply progressive tint and alpha
            const tints = [null, 0xffcccc, 0xff9999, 0xff6666];
            const alphas = [1, 0.9, 0.8, 0.7];
            sprite.background.setTint(tints[tile.surgeCount]);
            sprite.container.setAlpha(alphas[tile.surgeCount]);
            
            // Create surge indicators
            const indicators = [];
            for (let i = 0; i < tile.surgeCount; i++) {
                const dot = this.add.circle(
                    sprite.container.x - 20 + (i * 8),
                    sprite.container.y - 25,
                    3,
                    0xff6b6b
                );
                indicators.push(dot);
            }
            
            // Apply stage-specific animations
            let wobbleTween = null, shakeTween = null;
            if (tile.surgeCount === 2) {
                wobbleTween = this.tweens.add({
                    targets: [sprite.container],
                    angle: { from: -3, to: 3 },
                    duration: 300,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            } else if (tile.surgeCount === 3) {
                const baseX = sprite.container.x, baseY = sprite.container.y;
                shakeTween = this.tweens.add({
                    targets: [sprite.container],
                    x: { from: baseX - 2, to: baseX + 2 },
                    y: { from: baseY - 2, to: baseY + 2 },
                    duration: 50,
                    repeat: -1,
                    onUpdate: () => {
                        sprite.container.x = baseX + Phaser.Math.Between(-2, 2);
                        sprite.container.y = baseY + Phaser.Math.Between(-2, 2);
                    }
                });
            }
            
            this.destabilizedTiles.set(key, { indicators, wobbleTween, shakeTween });
        } else {
            // Clear destabilization
            const existing = this.destabilizedTiles.get(key);
            if (existing) {
                if (existing.wobbleTween) existing.wobbleTween.stop();
                if (existing.shakeTween) existing.shakeTween.stop();
                if (existing.indicators) existing.indicators.forEach(dot => dot.destroy());
                this.destabilizedTiles.delete(key);
            }
            sprite.background.clearTint();
            sprite.container.setAlpha(1).setAngle(0);
        }
    }
    handleAnimationStarted(data) { }
    handleAnimationComplete(data) { }
    
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
}