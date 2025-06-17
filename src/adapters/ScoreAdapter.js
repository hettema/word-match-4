// src/adapters/ScoreAdapter.js - HANDLES EVENTS for ScoreLogic
import { EventTypes } from '../core/EventTypes.js';

export class ScoreAdapter {
    constructor(scoreLogic, eventBus) {
        this.scoreLogic = scoreLogic;
        this.eventBus = eventBus;
        this.currentScore = 0;
        this.currentCombo = 0;
        this.pendingMultiplier = 1;
        
        // Listen for score-related events
        eventBus.on(EventTypes.WORD_VALIDATED, this.handleWordValidated.bind(this));
        eventBus.on(EventTypes.MULTIPLIER_ACTIVATED, this.handleMultiplierActivated.bind(this));
    }
    
    handleWordValidated(data) {
        const { word, score, tiles, timestamp } = data;
        
        // Calculate score using ScoreLogic
        const wordScore = this.scoreLogic.calculateWordScore(
            tiles,
            this.currentCombo,
            this.pendingMultiplier
        );
        
        // Update current score
        const oldScore = this.currentScore;
        this.currentScore += wordScore;
        
        // Emit score changed event
        this.eventBus.emit(EventTypes.SCORE_CHANGED, {
            score: this.currentScore,
            delta: wordScore,
            source: 'word'
        });
        
        // Update combo
        this.currentCombo++;
        const comboMultiplier = this.scoreLogic.calculateChainMultiplier(this.currentCombo);
        
        // Emit combo changed event
        this.eventBus.emit(EventTypes.COMBO_CHANGED, {
            combo: this.currentCombo,
            multiplier: comboMultiplier,
            timestamp: timestamp || Date.now()
        });
        
        // Reset pending multiplier after use
        this.pendingMultiplier = 1;
    }
    
    handleMultiplierActivated(data) {
        const { x, y, multiplier, wordScore } = data;
        
        // Store multiplier for next word validation
        this.pendingMultiplier = multiplier;
        
        // If wordScore is provided and greater than 0, it means this is immediate scoring
        if (wordScore > 0) {
            const scoreWithMultiplier = Math.floor(wordScore * multiplier);
            const delta = scoreWithMultiplier - wordScore;
            
            this.currentScore += delta;
            
            // Emit score changed event for multiplier bonus
            this.eventBus.emit(EventTypes.SCORE_CHANGED, {
                score: this.currentScore,
                delta: delta,
                source: 'multiplier'
            });
        }
    }
    
    resetCombo() {
        this.currentCombo = 0;
        this.pendingMultiplier = 1;
        
        this.eventBus.emit(EventTypes.COMBO_CHANGED, {
            combo: 0,
            multiplier: 1,
            timestamp: Date.now()
        });
    }
    
    resetScore() {
        this.currentScore = 0;
        this.currentCombo = 0;
        this.pendingMultiplier = 1;
    }
}