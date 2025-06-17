// TEMPORARY VISUAL STUB - WILL BE REMOVED WHEN REAL GAMESCENE IS IMPLEMENTED
// This file provides early visual feedback during development
// DO NOT DEPEND ON THIS FILE - IT WILL BE DELETED

class VisualStubScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VisualStubScene' });
        this.eventLog = [];
        this.maxLogSize = 5;
    }
    
    create() {
        // Get EventBus from registry
        this.eventBus = this.game.registry.get('eventBus');
        
        // Create grid
        this.createGrid();
        
        // Create event log display
        this.createEventLog();
        
        // Listen to ALL events via wildcard
        this.eventBus.on('*', (eventType, data) => {
            this.logEvent(eventType, data);
        });
        
        // Add TEMPORARY warning
        this.add.text(400, 20, '⚠️ TEMPORARY VISUAL STUB ⚠️', {
            fontSize: '16px',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
    }
    
    createGrid() {
        const gridSize = 8;
        const tileSize = 60;
        const spacing = 5;
        const startX = 400 - (gridSize * (tileSize + spacing)) / 2;
        const startY = 300 - (gridSize * (tileSize + spacing)) / 2;
        
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const posX = startX + x * (tileSize + spacing);
                const posY = startY + y * (tileSize + spacing);
                
                // Create tile background
                const tile = this.add.rectangle(posX, posY, tileSize, tileSize, 0x4fbdba);
                tile.setStrokeStyle(2, 0xffffff);
                
                // Add random letter
                const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                this.add.text(posX, posY, letter, {
                    fontSize: '24px',
                    color: '#ffffff'
                }).setOrigin(0.5);
            }
        }
    }
    
    createEventLog() {
        this.eventLogText = this.add.text(10, 50, 'Events:', {
            fontSize: '14px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
    }
    
    logEvent(eventType, data) {
        this.eventLog.unshift(`${eventType}: ${JSON.stringify(data).substring(0, 50)}...`);
        if (this.eventLog.length > this.maxLogSize) {
            this.eventLog.pop();
        }
        
        const logText = 'Events:\n' + this.eventLog.join('\n');
        this.eventLogText.setText(logText);
    }
}

// Export for use in GameBootstrap
window.VisualStubScene = VisualStubScene;