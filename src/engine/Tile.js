// src/engine/Tile.js - Visual representation of a single tile
const COLORS = { border: 0x34495e, cyan: 0x00d9ff, tileNormal: 0xecf0f1, tileBomb: 0xe74c3c, tileIce: 0x3498db, tileStone: 0x7f8c8d, tileMultiplier: 0xf39c12, tileHidden: 0x9b59b6 };
const TILE_TYPES = { NORMAL: 'normal', BOMB: 'bomb', MULTIPLIER: 'multiplier', ICE: 'ice', STONE: 'stone', HIDDEN: 'hidden' };

export class Tile {
    constructor(scene, gridX, gridY, config) {
        this.scene = scene; this.gridX = gridX; this.gridY = gridY;
        this.type = config.type || TILE_TYPES.NORMAL; this.letter = config.letter; this.value = config.value;
        this.tileSize = 64; this.strokeWidth = 2; this.selectedStrokeWidth = 4;
        this.isSelected = false; this.surgeCount = 0; this.surgeIndicators = [];
        this.worldX = config.worldX || 0; this.worldY = config.worldY || 0;
        this.createSprite(); this.createText();
    }
    
    createSprite() {
        this.sprite = this.scene.add.rectangle(this.worldX, this.worldY, this.tileSize - 2, this.tileSize - 2, this.getTileColor());
        this.sprite.setStrokeStyle(this.strokeWidth, COLORS.border);
        this.sprite.setInteractive()
            .on('pointerover', () => this.onHover())
            .on('pointerout', () => this.onHoverEnd())
            .on('pointerdown', () => this.onClick());
    }
    
    createText() {
        const displayText = this.getDisplayText();
        this.textObject = this.scene.add.text(this.worldX, this.worldY, displayText, {
            fontFamily: 'Arial', fontSize: this.type === TILE_TYPES.NORMAL ? '24px' : '32px',
            fontStyle: 'bold', color: '#000000'
        });
        this.textObject.setOrigin(0.5);
        if (this.type === TILE_TYPES.NORMAL) {
            this.valueText = this.scene.add.text(this.worldX + 20, this.worldY + 20, this.value || '', {
                fontFamily: 'Arial', fontSize: '10px', color: '#666666'
            });
            this.valueText.setOrigin(0.5);
        }
    }
    
    getTileColor() {
        const colors = { [TILE_TYPES.NORMAL]: COLORS.tileNormal, [TILE_TYPES.BOMB]: COLORS.tileBomb, [TILE_TYPES.ICE]: COLORS.tileIce, [TILE_TYPES.STONE]: COLORS.tileStone, [TILE_TYPES.MULTIPLIER]: COLORS.tileMultiplier, [TILE_TYPES.HIDDEN]: COLORS.tileHidden };
        return colors[this.type] || COLORS.tileNormal;
    }
    
    getDisplayText() {
        const displays = { [TILE_TYPES.BOMB]: 'B', [TILE_TYPES.ICE]: 'ICE', [TILE_TYPES.STONE]: 'S', [TILE_TYPES.MULTIPLIER]: '×2', [TILE_TYPES.HIDDEN]: '?' };
        return displays[this.type] || this.letter || '';
    }
    
    onHover() { this.scene.tweens.add({ targets: this.sprite, scaleX: 1.05, scaleY: 1.05, duration: 100, ease: 'Back.easeOut' }); }
    onHoverEnd() { if (!this.isSelected) this.scene.tweens.add({ targets: this.sprite, scaleX: 1, scaleY: 1, duration: 100 }); }
    onClick() { /* Visual only - no logic */ }
    
    setSelected(selected) {
        this.isSelected = selected;
        if (selected) {
            this.sprite.setStrokeStyle(this.selectedStrokeWidth, COLORS.cyan);
            this.scene.tweens.add({ targets: [this.sprite, this.textObject], scaleX: 1.15, scaleY: 1.15, duration: 200, ease: 'Back.easeOut' });
        } else {
            this.sprite.setStrokeStyle(this.strokeWidth, COLORS.border);
            this.scene.tweens.add({ targets: [this.sprite, this.textObject], scaleX: 1, scaleY: 1, duration: 100 });
        }
    }
    
    updateDestabilizationVisual() {
        const tints = [null, 0xffcccc, 0xff9999, 0xff6666];
        const alphas = [1, 0.9, 0.8, 0.7];
        
        // Clear any existing animations
        if (this.wobbleTween) { this.wobbleTween.stop(); this.wobbleTween = null; }
        if (this.shakeTween) { this.shakeTween.stop(); this.shakeTween = null; }
        
        if (this.surgeCount > 0) {
            this.sprite.setFillStyle(tints[this.surgeCount]); 
            this.sprite.setAlpha(alphas[this.surgeCount]);
            this.updateSurgeIndicators();
            if (this.surgeCount === 2) this.addWobble();
            else if (this.surgeCount === 3) this.addCriticalShake();
        } else {
            // Reset to normal state
            this.sprite.setFillStyle(this.getTileColor());
            this.sprite.setAlpha(1).setAngle(0);
            this.textObject.setAngle(0);
            this.sprite.x = this.worldX;
            this.sprite.y = this.worldY;
            this.textObject.x = this.worldX;
            this.textObject.y = this.worldY;
            if (this.valueText) {
                this.valueText.x = this.worldX + 20;
                this.valueText.y = this.worldY + 20;
            }
            this.updateSurgeIndicators();
        }
    }
    
    addWobble() {
        this.wobbleTween = this.scene.tweens.add({
            targets: [this.sprite, this.textObject], angle: { from: -3, to: 3 },
            duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
    }
    
    addCriticalShake() {
        if (this.wobbleTween) this.wobbleTween.stop();
        const baseX = this.worldX, baseY = this.worldY;
        this.shakeTween = this.scene.tweens.add({
            targets: [this.sprite, this.textObject], x: { from: baseX - 2, to: baseX + 2 },
            y: { from: baseY - 2, to: baseY + 2 }, duration: 50, repeat: -1,
            onUpdate: () => { 
                this.sprite.x = baseX + Phaser.Math.Between(-2, 2); 
                this.sprite.y = baseY + Phaser.Math.Between(-2, 2);
                this.textObject.x = this.sprite.x;
                this.textObject.y = this.sprite.y;
                if (this.valueText) {
                    this.valueText.x = this.sprite.x + 20;
                    this.valueText.y = this.sprite.y + 20;
                }
            }
        });
    }
    
    updateSurgeIndicators() {
        if (this.surgeIndicators) this.surgeIndicators.forEach(dot => dot.destroy());
        this.surgeIndicators = [];
        for (let i = 0; i < this.surgeCount; i++) {
            this.surgeIndicators.push(this.scene.add.circle(this.worldX - 20 + (i * 8), this.worldY - 25, 3, 0xff6b6b));
        }
    }
}