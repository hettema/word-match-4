// src/engine/GameScene.js - VISUAL RENDERING ONLY
import { EventTypes } from '../core/EventTypes.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.tileSize = 64; this.strokeWidth = 2;
    }

    create() {
        console.log('GameScene create() called');
        
        // Get EventBus from registry (set by Bootstrap)
        this.eventBus = this.game.registry.get('eventBus');
        this.gridLogic = this.game.registry.get('gridLogic');
        
        if (!this.eventBus) { console.error('EventBus not found in registry!'); return; }
        if (!this.gridLogic) { console.error('GridLogic not found in registry!'); return; }
        
        // Create visual components
        this.tileSprites = [];
        this.createGrid();
        
        // Setup render listeners (EventBus events → visual updates)
        this.setupRenderListeners();
        
        console.log('GameScene initialized successfully');
        
        // NO game logic here!
        // NO direct Phaser event listeners for game logic!
        // This scene ONLY renders based on EventBus events
    }
    
    setupRenderListeners() {
        console.log('Setting up render listeners...');
        
        // Listen to EventBus for rendering updates
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
        
        // Get dimensions from gridLogic
        const width = this.gridLogic.width;
        const height = this.gridLogic.height;
        
        // Calculate grid offset to center it
        const gridWidth = width * this.tileSize, gridHeight = height * this.tileSize;
        const offsetX = (this.game.config.width - gridWidth) / 2;
        const offsetY = (this.game.config.height - gridHeight) / 2;
        
        console.log(`Grid: ${width}x${height}, Tile size: ${this.tileSize}`);
        console.log(`Canvas: ${this.game.config.width}x${this.game.config.height}`);
        console.log(`Offset: ${offsetX}, ${offsetY}`);
        
        // Create 2D array of tile sprites
        for (let y = 0; y < height; y++) {
            this.tileSprites[y] = [];
            for (let x = 0; x < width; x++) {
                const worldX = offsetX + x * this.tileSize + this.tileSize / 2;
                const worldY = offsetY + y * this.tileSize + this.tileSize / 2;
                
                // Create container for tile visuals
                const container = this.add.container(worldX, worldY);
                
                // Create background rectangle
                const bg = this.add.rectangle(0, 0, this.tileSize - 2, this.tileSize - 2, 0xecf0f1);
                bg.setStrokeStyle(this.strokeWidth, 0x34495e);
                container.add(bg);
                
                // Create text for letter
                const text = this.add.text(0, 0, '', { fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#000000' }).setOrigin(0.5);
                container.add(text);
                
                // Create value text (bottom right)
                const valueText = this.add.text(20, 20, '', { fontFamily: 'Arial', fontSize: '10px', color: '#666666' });
                valueText.setOrigin(0.5);
                container.add(valueText);
                
                // Store sprite data
                this.tileSprites[y][x] = { container, background: bg, text, valueText, gridX: x, gridY: y };
                
                // Hide by default
                container.setVisible(false);
            }
        }
        
        console.log(`Created ${width * height} tile sprites (all hidden)`);
    }
    
    // Empty handler methods that just log for now
    renderGrid(data) { console.log('renderGrid called with:', data); }
    renderSelection(data) { console.log('renderSelection called with:', data); }
    animateExplosions(data) { console.log('animateExplosions called with:', data); }
    renderDestabilization(data) { console.log('renderDestabilization called with:', data); }
    handleAnimationStarted(data) { console.log('handleAnimationStarted called with:', data); }
    handleAnimationComplete(data) { console.log('handleAnimationComplete called with:', data); }
}