// src/engine/GameScene.js - VISUAL RENDERING ONLY
import { EventTypes } from '../core/EventTypes.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('GameScene create() called');
        
        // Get EventBus from registry (set by Bootstrap)
        this.eventBus = this.game.registry.get('eventBus');
        this.gridLogic = this.game.registry.get('gridLogic');
        
        if (!this.eventBus) {
            console.error('EventBus not found in registry!');
            return;
        }
        
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
        this.eventBus.on(EventTypes.GRID_UPDATED, (data) => {
            this.renderGrid(data);
        });
        
        this.eventBus.on(EventTypes.SELECTION_CHANGED, (data) => {
            this.renderSelection(data);
        });
        
        this.eventBus.on(EventTypes.TILES_REMOVED, (data) => {
            this.animateExplosions(data);
        });
        
        this.eventBus.on(EventTypes.TILE_DESTABILIZED, (data) => {
            this.renderDestabilization(data);
        });
        
        this.eventBus.on(EventTypes.ANIMATION_STARTED, (data) => {
            this.handleAnimationStarted(data);
        });
        
        this.eventBus.on(EventTypes.ANIMATION_COMPLETE, (data) => {
            this.handleAnimationComplete(data);
        });
        
        console.log('All render listeners registered');
    }
    
    // Empty handler methods that just log for now
    renderGrid(data) {
        console.log('renderGrid called with:', data);
    }
    
    renderSelection(data) {
        console.log('renderSelection called with:', data);
    }
    
    animateExplosions(data) {
        console.log('animateExplosions called with:', data);
    }
    
    renderDestabilization(data) {
        console.log('renderDestabilization called with:', data);
    }
    
    handleAnimationStarted(data) {
        console.log('handleAnimationStarted called with:', data);
    }
    
    handleAnimationComplete(data) {
        console.log('handleAnimationComplete called with:', data);
    }
}