// GameBootstrap.js - Mandatory entry point for Word Match game
import { EventBus } from './src/core/EventBus.js';
import { EventTypes } from './src/core/EventTypes.js';
import { WordValidator } from './src/systems/WordValidator.js';
import { GameScene } from './src/engine/GameScene.js';
import { GridLogic } from './src/core/GridLogic.js';

class GameBootstrap {
    constructor() {
        console.log('=== GAME BOOTSTRAP STARTING ===');
        
        // 1. Create the event bus (single instance)
        this.eventBus = new EventBus();
        
        // 2. Handle ALL async loading BEFORE creating systems
        this.loadResources().then(() => {
            this.initializeSystems();
            // TEMPORARY: Small delay to ensure visual stub is loaded
            setTimeout(() => {
                this.initializePhaser();
                this.startGame();
            }, 100);
        }).catch(error => {
            console.error('Bootstrap failed:', error);
            // Display error to user
            const container = document.getElementById('game-container');
            if (container) {
                container.innerHTML = `
                    <div style="color: red; text-align: center; padding: 20px;">
                        <h2>Failed to load game</h2>
                        <p>${error.message}</p>
                        <p>Please refresh the page to try again.</p>
                    </div>
                `;
            }
        });
    }
    
    async loadResources() {
        console.log('Loading resources...');
        
        try {
            // Load dictionary
            const dictResponse = await fetch('./assets/dict.txt');
            if (!dictResponse.ok) {
                throw new Error(`Failed to load dictionary: ${dictResponse.status} ${dictResponse.statusText}`);
            }
            const dictText = await dictResponse.text();
            this.dictionaryWords = new Set(
                dictText.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length > 0)
            );
            
            // Load level config
            const levelResponse = await fetch('./config/levels.json');
            if (!levelResponse.ok) {
                throw new Error(`Failed to load level config: ${levelResponse.status} ${levelResponse.statusText}`);
            }
            this.levelConfig = await levelResponse.json();
            
            console.log(`Resources loaded: ${this.dictionaryWords.size} words`);
            this.eventBus.emit(EventTypes.DICTIONARY_LOADED, {
                wordCount: this.dictionaryWords.size,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Resource loading error:', error);
            throw error;
        }
    }
    
    initializeSystems() {
        console.log('Initializing systems...');
        
        // 3. Create pure logic modules (no async, no events)
        // Note: We'll create these as they're implemented
        // this.gameLogic = new GameLogic();
        this.gridLogic = new GridLogic(8, 8); // From config later
        // this.scoreLogic = new ScoreLogic();
        
        // WordValidator is NOW pure - receives pre-loaded dictionary
        this.wordValidator = new WordValidator(this.dictionaryWords);
        console.log(`WordValidator initialized with ${this.wordValidator.getDictionarySize()} words`);
        
        // 4. Create adapters (connect logic to events)
        // Note: We'll create these as they're implemented
        // this.gameAdapter = new GameAdapter(this.gameLogic, this.eventBus);
        // this.gridAdapter = new GridAdapter(this.gridLogic, this.eventBus);
        // this.scoreAdapter = new ScoreAdapter(this.scoreLogic, this.eventBus);
        // this.wordValidatorAdapter = new WordValidatorAdapter(this.wordValidator, this.eventBus);
        
        console.log('Systems initialized (placeholders for now)');
    }
    
    initializePhaser() {
        console.log('Initializing Phaser...');
        
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'game-container',
            backgroundColor: '#2c3e50',
            scene: GameScene,
            // Pass references via registry
            callbacks: {
                preBoot: (game) => {
                    game.registry.set('eventBus', this.eventBus);
                    game.registry.set('gridLogic', this.gridLogic);
                    // game.registry.set('gameLogic', this.gameLogic);
                }
            }
        };
        
        this.game = new Phaser.Game(config);
        
        // CRITICAL: Bridge Phaser events to our EventBus
        // This is the ONLY place Phaser events connect to game logic
        this.game.events.on('ready', () => {
            console.log('Phaser ready, setting up event bridges...');
            
            // Get the current scene (will be GameScene when implemented)
            const scene = this.game.scene.scenes[0];
            
            if (scene && scene.input) {
                // Convert Phaser input events to EventBus events IMMEDIATELY
                scene.input.on('pointerdown', (pointer) => {
                    // For now, just log since we don't have getTileAt yet
                    console.log('Pointer down at:', pointer.x, pointer.y);
                    // When GameScene is implemented:
                    // const tile = scene.getTileAt(pointer.x, pointer.y);
                    // if (tile) {
                    //     this.eventBus.emit(EventTypes.TILE_PRESSED, {
                    //         x: tile.x,
                    //         y: tile.y,
                    //         timestamp: Date.now()
                    //     });
                    // }
                });
                
                scene.input.on('pointermove', (pointer) => {
                    // Similar conversion for move events
                    // if (scene.isTracing) {
                    //     const tile = scene.getTileAt(pointer.x, pointer.y);
                    //     if (tile) {
                    //         this.eventBus.emit(EventTypes.TILE_ENTERED, {
                    //             x: tile.x,
                    //             y: tile.y,
                    //             timestamp: Date.now()
                    //         });
                    //     }
                    // }
                });
                
                scene.input.on('pointerup', () => {
                    this.eventBus.emit(EventTypes.INPUT_RELEASED, {
                        timestamp: Date.now()
                    });
                });
            }
        });
    }
    
    startGame() {
        console.log('Starting game');
        this.eventBus.emit(EventTypes.GAME_START, { 
            level: 1,
            timestamp: Date.now()
        });
    }
}

// Entry point
window.addEventListener('DOMContentLoaded', () => {
    window.gameBootstrap = new GameBootstrap();
});

export { GameBootstrap };