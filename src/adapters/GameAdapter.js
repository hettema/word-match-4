// src/adapters/GameAdapter.js - HANDLES EVENTS for GameLogic
import { EventTypes } from '../core/EventTypes.js';

export class GameAdapter {
    constructor(gameLogic, eventBus) {
        this.gameLogic = gameLogic;
        this.eventBus = eventBus;
        this.startTime = null;
        
        // Listen for game-related events
        eventBus.on(EventTypes.GAME_START, this.handleGameStart.bind(this));
        eventBus.on(EventTypes.SCORE_CHANGED, this.handleScoreChanged.bind(this));
        eventBus.on(EventTypes.WORD_VALIDATED, this.handleWordValidated.bind(this));
    }
    
    handleGameStart(data) {
        const { level, timestamp } = data;
        this.startTime = timestamp || Date.now();
        
        // Initialize level with configuration
        const levelConfig = {
            id: level,
            moveLimit: 3, // Set to 3 for testing defeat
            targetScore: 1000 // Set high for testing defeat
        };
        
        const result = this.gameLogic.initLevel(levelConfig);
        
        if (result.success) {
            this.gameLogic.updateState(result.state);
            
            // Emit level loaded event
            this.eventBus.emit(EventTypes.LEVEL_LOADED, {
                levelId: level,
                config: levelConfig,
                timestamp: timestamp || Date.now()
            });
        }
    }
    
    handleScoreChanged(data) {
        const { score, delta, source } = data;
        
        // Update score in game logic
        const result = this.gameLogic.updateScore(delta, source);
        
        if (result.success) {
            this.gameLogic.updateState(result.state);
            
            // Check victory condition after score update
            const victoryCheck = this.gameLogic.checkVictory();
            if (victoryCheck.isVictory) {
                this.handleVictory();
            }
        }
    }
    
    handleWordValidated(data) {
        const { word, score, tiles, timestamp } = data;
        
        // Consume a move when a word is validated
        const result = this.gameLogic.consumeMove();
        
        if (result.success) {
            this.gameLogic.updateState(result.state);
            
            // Emit moves changed event (showing remaining moves)
            const remainingMoves = result.state.movesLimit - result.state.moves;
            this.eventBus.emit(EventTypes.MOVES_CHANGED, {
                moves: remainingMoves,
                movesUsed: result.state.moves,
                timestamp: timestamp || Date.now()
            });
            
            // Check defeat condition after move
            const defeatCheck = this.gameLogic.checkDefeat();
            if (defeatCheck.isDefeat) {
                this.handleDefeat('NO_MOVES_LEFT');
            }
        }
    }
    
    handleVictory() {
        const phaseResult = this.gameLogic.setGamePhase('victory');
        this.gameLogic.updateState(phaseResult.state);
        
        const timeElapsed = this.startTime ? Date.now() - this.startTime : 0;
        
        this.eventBus.emit(EventTypes.VICTORY, {
            score: this.gameLogic.score,
            movesUsed: this.gameLogic.moves,
            timeElapsed: timeElapsed,
            timestamp: Date.now()
        });
    }
    
    handleDefeat(reason) {
        const phaseResult = this.gameLogic.setGamePhase('defeat');
        this.gameLogic.updateState(phaseResult.state);
        
        this.eventBus.emit(EventTypes.DEFEAT, {
            score: this.gameLogic.score,
            movesUsed: this.gameLogic.moves,
            reason: reason,
            timestamp: Date.now()
        });
    }
}