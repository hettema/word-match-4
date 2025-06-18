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
        
        // Submit word when selection is complete
        this.eventBus.on(EventTypes.SELECTION_COMPLETE, (data) => {
            this.handleSelectionComplete(data);
        });
    }
    
    handleSelectionComplete(data) {
        // Use positions from the event instead of currentSelection
        const positions = data.positions || [];
        
        // Only submit if we have at least 2 tiles selected
        if (positions.length < 2) {
            return;
        }
        
        console.log('SelectionAdapter: Processing selection:', positions);
        
        // Build word from actual grid letters
        const tilesWithLetters = [];
        const letters = [];
        
        for (const pos of positions) {
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
        if (tilesWithLetters.length === positions.length) {
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
    }
}