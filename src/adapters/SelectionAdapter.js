// SelectionAdapter.js - Bridges selection events to word submission with real letters
import { EventTypes } from '../core/EventTypes.js';

export class SelectionAdapter {
    constructor(gridLogic, eventBus) {
        this.gridLogic = gridLogic;
        this.eventBus = eventBus;
        this.currentSelection = [];
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Track current selection
        this.eventBus.on(EventTypes.SELECTION_CHANGED, (data) => {
            this.currentSelection = data.tiles || [];
        });
        
        // Submit word when input is released
        this.eventBus.on(EventTypes.INPUT_RELEASED, (data) => {
            this.handleInputReleased(data);
        });
    }
    
    handleInputReleased(data) {
        // Only submit if we have at least 2 tiles selected
        if (this.currentSelection.length < 2) {
            return;
        }
        
        console.log('SelectionAdapter: Processing selection:', this.currentSelection);
        
        // Build word from actual grid letters
        const tilesWithLetters = [];
        const letters = [];
        
        for (const pos of this.currentSelection) {
            const tile = this.gridLogic.getTile(pos.x, pos.y);
            console.log(`SelectionAdapter: Tile at (${pos.x}, ${pos.y}):`, tile);
            
            if (tile && tile.letter) {
                tilesWithLetters.push({
                    x: pos.x,
                    y: pos.y,
                    letter: tile.letter
                });
                letters.push(tile.letter);
            }
        }
        
        console.log('SelectionAdapter: Found tiles with letters:', tilesWithLetters);
        
        // Only submit if we got valid letters for all positions
        if (tilesWithLetters.length === this.currentSelection.length) {
            const word = letters.join('');
            console.log('SelectionAdapter: Submitting word:', word);
            
            // Add small delay to ensure this event fires AFTER InputHandler's
            setTimeout(() => {
                this.eventBus.emit(EventTypes.WORD_SUBMITTED, {
                    word: word,
                    tiles: tilesWithLetters,
                    timestamp: data.timestamp || Date.now()
                });
            }, 10);
        }
        
        // Clear our tracked selection
        this.currentSelection = [];
    }
}