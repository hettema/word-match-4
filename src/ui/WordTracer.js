export class WordTracer {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(100); // Ensure line draws above tiles
        this.tracedTiles = [];
        
        this.lineColor = 0x00d9ff; // cyan
        this.lineWidth = 3;
        this.lineAlpha = 0.8;
        
        this.validColor = 0x2ecc71; // green
        this.invalidColor = 0xe74c3c; // red
        
        this.isValid = true;
    }
    
    updateSelection(tiles) {
        this.tracedTiles = tiles;
        this.drawLine();
    }
    
    drawLine() {
        this.graphics.clear();
        
        if (this.tracedTiles.length < 2) return;
        
        const color = this.isValid ? this.lineColor : this.invalidColor;
        this.graphics.lineStyle(this.lineWidth, color, this.lineAlpha);
        
        this.graphics.beginPath();
        this.graphics.moveTo(
            this.tracedTiles[0].worldX, 
            this.tracedTiles[0].worldY
        );
        
        for (let i = 1; i < this.tracedTiles.length; i++) {
            this.graphics.lineTo(
                this.tracedTiles[i].worldX,
                this.tracedTiles[i].worldY
            );
        }
        
        this.graphics.strokePath();
    }
    
    clear() {
        this.graphics.clear();
        this.tracedTiles = [];
        this.isValid = true;
    }
    
    setValidState(isValid) {
        this.isValid = isValid;
        if (this.tracedTiles.length >= 2) {
            this.drawLine();
        }
    }
    
    destroy() {
        this.graphics.destroy();
        this.tracedTiles = [];
    }
}