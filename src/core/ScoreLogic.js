// src/core/ScoreLogic.js - PURE FUNCTIONS ONLY
// This module calculates scores without side effects or events

export class ScoreLogic {
    constructor() {
        // UK Scrabble letter values
        this.letterValues = {
            A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4,
            I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3,
            Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
            Y: 4, Z: 10
        };
        
        // Scoring configuration
        this.config = {
            minWordLength: 3,
            wordLengthBonusBase: 10,
            wordLengthBonusPerLetter: 5,
            chainMultiplierBase: 1.5,
            chainMultiplierIncrement: 0.5
        };
    }
    
    // Calculate base score from letter values
    calculateBaseScore(tiles) {
        if (!tiles || !Array.isArray(tiles) || tiles.length === 0) return 0;
        return tiles.reduce((sum, tile) => {
            const letter = (tile.letter || '').toUpperCase();
            return sum + (this.letterValues[letter] || 0);
        }, 0);
    }
    
    // Get value for a single letter
    getLetterValue(letter) {
        const upperLetter = (letter || '').toUpperCase();
        return this.letterValues[upperLetter] || 0;
    }
    
    // Calculate word length bonus
    calculateWordLengthBonus(wordLength) {
        if (wordLength < this.config.minWordLength) return 0;
        const extraLetters = wordLength - this.config.minWordLength;
        return this.config.wordLengthBonusBase + (extraLetters * this.config.wordLengthBonusPerLetter);
    }
    
    // Calculate chain multiplier based on cascade chain length
    calculateChainMultiplier(chainLength) {
        if (chainLength <= 0) return 1;
        return this.config.chainMultiplierBase + (chainLength - 1) * this.config.chainMultiplierIncrement;
    }
    
    // Calculate total score combining all factors
    calculateTotalScore(baseScore, wordLength, chainLength = 0, specialMultiplier = 1) {
        if (baseScore < 0 || wordLength < 0 || chainLength < 0 || specialMultiplier < 0) return 0;
        
        const lengthBonus = this.calculateWordLengthBonus(wordLength);
        const chainMultiplier = this.calculateChainMultiplier(chainLength);
        const subtotal = baseScore + lengthBonus;
        const total = Math.floor(subtotal * chainMultiplier * specialMultiplier);
        
        return {
            baseScore, lengthBonus, chainMultiplier, specialMultiplier, subtotal, total,
            breakdown: {
                base: baseScore,
                lengthBonus: lengthBonus,
                afterLength: subtotal,
                chainBonus: `x${chainMultiplier}`,
                specialBonus: `x${specialMultiplier}`,
                final: total
            }
        };
    }
    
    // Quick calculation for word from tiles
    calculateWordScore(tiles, chainLength = 0, specialMultiplier = 1) {
        const baseScore = this.calculateBaseScore(tiles);
        const wordLength = tiles ? tiles.length : 0;
        const result = this.calculateTotalScore(baseScore, wordLength, chainLength, specialMultiplier);
        return result.total;
    }
}