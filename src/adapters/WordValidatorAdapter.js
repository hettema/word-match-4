// src/adapters/WordValidatorAdapter.js - HANDLES EVENTS for WordValidator
import { EventTypes } from '../core/EventTypes.js';
import { ScoreLogic } from '../core/ScoreLogic.js';

export class WordValidatorAdapter {
    constructor(wordValidator, eventBus) {
        this.wordValidator = wordValidator;
        this.eventBus = eventBus;
        this.scoreLogic = new ScoreLogic(); // For score calculation
        
        // Listen for word submission events
        eventBus.on(EventTypes.WORD_SUBMITTED, this.handleWordSubmitted.bind(this));
    }
    
    handleWordSubmitted(data) {
        const { word, tiles, timestamp } = data;
        
        // Call pure function to validate word
        const isValid = this.wordValidator.isValid(word);
        
        if (isValid) {
            // Calculate score using tiles
            const baseScore = this.scoreLogic.calculateBaseScore(tiles);
            const wordLengthBonus = this.scoreLogic.calculateWordLengthBonus(word.length);
            const totalScore = baseScore + wordLengthBonus;
            
            // Emit word validated event
            this.eventBus.emit(EventTypes.WORD_VALIDATED, {
                word: word,
                score: totalScore,
                tiles: tiles,
                timestamp: timestamp || Date.now()
            });
        } else {
            // Get specific rejection reason
            const reason = this.wordValidator.getInvalidReason(word);
            
            // Emit word rejected event
            this.eventBus.emit(EventTypes.WORD_REJECTED, {
                word: word,
                reason: reason,
                timestamp: timestamp || Date.now()
            });
        }
    }
}