import { EventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';

class GameStateUI {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.victoryOverlay = null;
        this.defeatOverlay = null;
        this.init();
    }

    init() {
        this.createOverlays();
        this.registerEventListeners();
    }

    createOverlays() {
        this.createVictoryOverlay();
        this.createDefeatOverlay();
    }

    createVictoryOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'victoryOverlay';
        overlay.className = 'game-overlay';
        overlay.innerHTML = `
            <div class="overlay-content victory-content">
                <h1 class="overlay-title victory-title">VICTORY!</h1>
                <div class="score-section">
                    <p class="score-label">Final Score</p>
                    <p class="score-value" id="victoryScore">0</p>
                </div>
                <button class="overlay-button primary-button" id="nextLevelBtn">Next Level</button>
            </div>
        `;
        document.body.appendChild(overlay);
        this.victoryOverlay = overlay;

        const nextLevelBtn = document.getElementById('nextLevelBtn');
        nextLevelBtn.addEventListener('click', () => this.handleNextLevel());
    }

    createDefeatOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'defeatOverlay';
        overlay.className = 'game-overlay';
        overlay.innerHTML = `
            <div class="overlay-content defeat-content">
                <h1 class="overlay-title defeat-title">GAME OVER</h1>
                <div class="score-section">
                    <p class="score-label">Final Score</p>
                    <p class="score-value" id="defeatScore">0</p>
                </div>
                <button class="overlay-button primary-button" id="retryBtn">Retry</button>
            </div>
        `;
        document.body.appendChild(overlay);
        this.defeatOverlay = overlay;

        const retryBtn = document.getElementById('retryBtn');
        retryBtn.addEventListener('click', () => this.handleRetry());
    }

    registerEventListeners() {
        this.eventBus.on(EventTypes.VICTORY, this.handleVictory.bind(this));
        this.eventBus.on(EventTypes.DEFEAT, this.handleDefeat.bind(this));
    }

    handleVictory(data) {
        const scoreElement = document.getElementById('victoryScore');
        scoreElement.textContent = data.score || 0;
        
        this.blurGameCanvas();
        this.showOverlay(this.victoryOverlay);
    }

    handleDefeat(data) {
        const scoreElement = document.getElementById('defeatScore');
        scoreElement.textContent = data.score || 0;
        
        this.blurGameCanvas();
        this.showOverlay(this.defeatOverlay);
    }

    handleNextLevel() {
        this.hideOverlay(this.victoryOverlay);
        this.unblurGameCanvas();
    }

    handleRetry() {
        this.hideOverlay(this.defeatOverlay);
        this.unblurGameCanvas();
    }

    showOverlay(overlay) {
        overlay.classList.add('active');
    }

    hideOverlay(overlay) {
        overlay.classList.remove('active');
    }

    blurGameCanvas() {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.classList.add('blurred');
        }
    }

    unblurGameCanvas() {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.classList.remove('blurred');
        }
    }

    destroy() {
        this.eventBus.off(EventTypes.VICTORY, this.handleVictory.bind(this));
        this.eventBus.off(EventTypes.DEFEAT, this.handleDefeat.bind(this));
        
        if (this.victoryOverlay) {
            this.victoryOverlay.remove();
        }
        if (this.defeatOverlay) {
            this.defeatOverlay.remove();
        }
    }
}

export default GameStateUI;