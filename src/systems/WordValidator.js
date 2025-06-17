// src/systems/WordValidator.js - Pure word validation logic
// NOW PURE - no async loading, dictionary passed in constructor

export class WordValidator {
    constructor(dictionarySet, options = {}) {
        // Receives pre-loaded dictionary from Bootstrap
        this.dictionary = dictionarySet;
        this.minimumLength = options.minimumLength || 3;
        this.allowedCharacters = options.allowedCharacters || /^[A-Z]+$/;
    }
    
    // Pure function - no async, no loading
    isValid(word) {
        if (!word || typeof word !== 'string') {
            return false;
        }
        
        const upperWord = word.toUpperCase();
        
        // Check minimum length
        if (upperWord.length < this.minimumLength) {
            return false;
        }
        
        // Check allowed characters
        if (!this.allowedCharacters.test(upperWord)) {
            return false;
        }
        
        // Check dictionary
        return this.dictionary.has(upperWord);
    }
    
    // Pure function for additional validation with specific reason
    getInvalidReason(word) {
        if (!word || typeof word !== 'string') {
            return 'INVALID_INPUT';
        }
        
        const upperWord = word.toUpperCase();
        
        if (upperWord.length < this.minimumLength) {
            return 'TOO_SHORT';
        }
        
        if (!this.allowedCharacters.test(upperWord)) {
            return 'INVALID_CHARACTERS';
        }
        
        if (!this.dictionary.has(upperWord)) {
            return 'NOT_IN_DICTIONARY';
        }
        
        return null; // Word is valid
    }
    
    // Get minimum word length
    getMinimumLength() {
        return this.minimumLength;
    }
    
    // Check if a character is allowed
    isAllowedCharacter(char) {
        return this.allowedCharacters.test(char.toUpperCase());
    }
    
    // Get word score based on Scrabble values
    getWordValue(word) {
        const scrabbleValues = {
            A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4,
            I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3,
            Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
            Y: 4, Z: 10
        };
        
        if (!this.isValid(word)) {
            return 0;
        }
        
        return word.toUpperCase().split('').reduce((sum, letter) => {
            return sum + (scrabbleValues[letter] || 0);
        }, 0);
    }
    
    // Get dictionary size for statistics
    getDictionarySize() {
        return this.dictionary.size;
    }
    
    // Check if dictionary has been loaded
    isDictionaryLoaded() {
        return this.dictionary && this.dictionary.size > 0;
    }
}