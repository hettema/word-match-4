// src/core/GameLogic.js - PURE FUNCTIONS ONLY
// This module manages game state without side effects or events

export class GameLogic {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.moves = 0;
        this.movesLimit = 20;
        this.targetScore = 1000;
        this.gamePhase = 'waiting'; // waiting, playing, victory, defeat
        this.lives = 3;
        this.totalMoves = 0; // For statistics
        this.highScore = 0;
    }
    
    // Initialize level from configuration
    initLevel(levelConfig) {
        if (!levelConfig) return { success: false, error: 'Invalid level configuration' };
        
        const newState = {
            level: levelConfig.id || this.level,
            score: 0,
            moves: 0,
            movesLimit: levelConfig.moveLimit || levelConfig.moves || 20,
            targetScore: levelConfig.targetScore || 1000,
            gamePhase: 'playing',
            levelConfig: { ...levelConfig }
        };
        
        return { success: true, state: newState, changed: true };
    }
    
    // Check if player can make a move
    canMakeMove() {
        return this.gamePhase === 'playing' && this.moves < this.movesLimit;
    }
    
    // Pure function - returns new state after consuming a move
    consumeMove() {
        if (!this.canMakeMove()) {
            return {
                success: false,
                reason: this.gamePhase !== 'playing' ? 'GAME_NOT_ACTIVE' : 'NO_MOVES_LEFT',
                state: this.getGameState()
            };
        }
        
        const newMoves = this.moves + 1;
        const newTotalMoves = this.totalMoves + 1;
        
        return {
            success: true,
            state: {
                ...this.getGameState(),
                moves: newMoves,
                totalMoves: newTotalMoves
            },
            movesRemaining: this.movesLimit - newMoves
        };
    }
    
    // Pure function - returns new state after score update
    updateScore(delta, source = 'unknown') {
        if (this.gamePhase !== 'playing') {
            return {
                success: false,
                reason: 'GAME_NOT_ACTIVE',
                state: this.getGameState()
            };
        }
        
        const newScore = Math.max(0, this.score + delta);
        const newHighScore = Math.max(this.highScore, newScore);
        
        return {
            success: true,
            state: {
                ...this.getGameState(),
                score: newScore,
                highScore: newHighScore
            },
            delta: delta,
            source: source,
            progress: (newScore / this.targetScore) * 100
        };
    }
    
    // Check victory conditions
    checkVictory() {
        if (this.gamePhase !== 'playing') return { isVictory: false, reason: 'GAME_NOT_ACTIVE' };
        const isVictory = this.score >= this.targetScore;
        return {
            isVictory: isVictory,
            score: this.score,
            targetScore: this.targetScore,
            movesUsed: this.moves,
            movesLimit: this.movesLimit,
            stars: this.calculateStars()
        };
    }
    
    // Check defeat conditions
    checkDefeat() {
        if (this.gamePhase !== 'playing') return { isDefeat: false, reason: 'GAME_NOT_ACTIVE' };
        const isDefeat = this.moves >= this.movesLimit && this.score < this.targetScore;
        return {
            isDefeat: isDefeat,
            score: this.score,
            targetScore: this.targetScore,
            movesUsed: this.moves,
            scoreNeeded: this.targetScore - this.score,
            livesRemaining: this.lives
        };
    }
    
    // Calculate star rating (1-3 stars)
    calculateStars() {
        if (this.score < this.targetScore) return 0;
        
        const scoreRatio = this.score / this.targetScore;
        const moveEfficiency = (this.movesLimit - this.moves) / this.movesLimit;
        
        if (scoreRatio >= 2.0 && moveEfficiency >= 0.5) return 3;
        if (scoreRatio >= 1.5 || moveEfficiency >= 0.3) return 2;
        return 1;
    }
    
    // Update game phase
    setGamePhase(newPhase) {
        const validPhases = ['waiting', 'playing', 'victory', 'defeat', 'paused'];
        
        if (!validPhases.includes(newPhase)) {
            return {
                success: false,
                error: 'Invalid game phase',
                state: this.getGameState()
            };
        }
        
        return {
            success: true,
            state: {
                ...this.getGameState(),
                gamePhase: newPhase
            },
            previousPhase: this.gamePhase
        };
    }
    
    // Get current game state
    getGameState() {
        return {
            level: this.level,
            score: this.score,
            moves: this.moves,
            movesLimit: this.movesLimit,
            targetScore: this.targetScore,
            gamePhase: this.gamePhase,
            lives: this.lives,
            totalMoves: this.totalMoves,
            highScore: this.highScore,
            progress: (this.score / this.targetScore) * 100,
            movesRemaining: this.movesLimit - this.moves
        };
    }
    
    // Reset game state
    reset() {
        return {
            state: {
                level: 1,
                score: 0,
                moves: 0,
                movesLimit: 20,
                targetScore: 1000,
                gamePhase: 'waiting',
                lives: this.lives,
                totalMoves: 0,
                highScore: this.highScore
            }
        };
    }
    
    // Update internal state (for after operations)
    updateState(newState) {
        Object.assign(this, newState);
    }
}