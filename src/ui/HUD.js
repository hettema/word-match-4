/**
 * HUD.js
 * 
 * HTML/CSS-based HUD component for displaying game information.
 * Follows the hybrid architecture where UI elements use HTML/CSS
 * while the game board uses Phaser.
 */

import { EventTypes } from '../core/EventTypes.js';

export default class HUD {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // State
        this.currentScore = 0;
        this.targetScore = 0;
        this.remainingMoves = 0;
        
        // Create DOM elements
        this.createHUDElements();
        
        // Subscribe to events
        this.subscribeToEvents();
    }
    
    createHUDElements() {
        // Create HUD container
        this.hudContainer = document.createElement('div');
        this.hudContainer.className = 'hud-container';
        
        // Score Panel
        const scorePanel = this.createPanel('score-panel');
        const scoreLabel = this.createElement('div', 'hud-label', 'SCORE');
        this.scoreValue = this.createElement('div', 'hud-value', '0');
        const scoreTarget = this.createElement('div', 'hud-target', 'Target: 0');
        scorePanel.appendChild(scoreLabel);
        scorePanel.appendChild(this.scoreValue);
        scorePanel.appendChild(scoreTarget);
        this.targetElement = scoreTarget;
        
        // Moves Panel
        const movesPanel = this.createPanel('moves-panel');
        const movesLabel = this.createElement('div', 'hud-label', 'MOVES');
        this.movesValue = this.createElement('div', 'hud-value', '0');
        movesPanel.appendChild(movesLabel);
        movesPanel.appendChild(this.movesValue);
        
        // Pause Button
        const pauseButton = this.createElement('button', 'pause-button', '⏸');
        pauseButton.setAttribute('aria-label', 'Pause game');
        pauseButton.addEventListener('click', () => this.onPauseClick());
        
        // Add elements to container
        this.hudContainer.appendChild(scorePanel);
        this.hudContainer.appendChild(movesPanel);
        this.hudContainer.appendChild(pauseButton);
        
        // Add to DOM
        document.body.appendChild(this.hudContainer);
    }
    
    createPanel(className) {
        const panel = document.createElement('div');
        panel.className = `hud-panel ${className}`;
        return panel;
    }
    
    createElement(tag, className, content = '') {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = content;
        return element;
    }
    
    subscribeToEvents() {
        this.eventBus.on(EventTypes.SCORE_CHANGED, this.onScoreChanged.bind(this));
        this.eventBus.on(EventTypes.MOVES_CHANGED, this.onMovesChanged.bind(this));
        this.eventBus.on(EventTypes.LEVEL_LOADED, this.onLevelLoaded.bind(this));
    }
    
    onScoreChanged(data) {
        this.currentScore = data.score;
        this.scoreValue.textContent = this.currentScore.toString();
        
        // Add animation class for score change
        this.scoreValue.classList.remove('score-change');
        void this.scoreValue.offsetWidth; // Force reflow
        this.scoreValue.classList.add('score-change');
    }
    
    onMovesChanged(data) {
        this.remainingMoves = data.moves;
        this.movesValue.textContent = this.remainingMoves.toString();
        
        // Add warning class if moves are low
        if (this.remainingMoves <= 5) {
            this.movesValue.classList.add('low-moves');
        } else {
            this.movesValue.classList.remove('low-moves');
        }
    }
    
    onLevelLoaded(data) {
        if (data.config) {
            this.targetScore = data.config.targetScore || 0;
            this.targetElement.textContent = `Target: ${this.targetScore}`;
            
            // Reset moves if provided in config
            if (data.config.moves) {
                this.remainingMoves = data.config.moves;
                this.movesValue.textContent = this.remainingMoves.toString();
            }
        }
    }
    
    onPauseClick() {
        // Note: Pause functionality will be handled by game state system
        // HUD only provides the button, doesn't emit events per requirements
        console.log('Pause button clicked');
    }
    
    destroy() {
        // Clean up DOM elements
        if (this.hudContainer && this.hudContainer.parentNode) {
            this.hudContainer.parentNode.removeChild(this.hudContainer);
        }
        
        // Unsubscribe from events
        this.eventBus.off(EventTypes.SCORE_CHANGED, this.onScoreChanged.bind(this));
        this.eventBus.off(EventTypes.MOVES_CHANGED, this.onMovesChanged.bind(this));
        this.eventBus.off(EventTypes.LEVEL_LOADED, this.onLevelLoaded.bind(this));
    }
}