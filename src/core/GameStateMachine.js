// src/core/GameStateMachine.js - State Management
import { EventTypes } from './EventTypes.js';

export class GameStateMachine {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentState = 'INITIALIZING';
        
        // Define all game states and their valid transitions
        this.states = {
            INITIALIZING: { canTransitionTo: ['PLAYING'] },
            PLAYING: { canTransitionTo: ['ANIMATING', 'VICTORY', 'DEFEAT'] },
            ANIMATING: { canTransitionTo: ['PLAYING', 'VICTORY', 'DEFEAT'] },
            VICTORY: { canTransitionTo: ['TRANSITIONING'] },
            DEFEAT: { canTransitionTo: ['TRANSITIONING'] },
            TRANSITIONING: { canTransitionTo: ['INITIALIZING'] }
        };
        
        // Set up event listeners for state triggers
        this.setupStateListeners();
    }
    
    setupStateListeners() {
        // Listen for events that trigger state transitions
        this.eventBus.on(EventTypes.GAME_START, () => this.transitionTo('PLAYING'));
        this.eventBus.on(EventTypes.VICTORY, () => this.transitionTo('VICTORY'));
        this.eventBus.on(EventTypes.DEFEAT, () => this.transitionTo('DEFEAT'));
        
        // Animation state transitions
        this.eventBus.on(EventTypes.ANIMATION_STARTED, () => {
            if (this.currentState === 'PLAYING') this.transitionTo('ANIMATING');
        });
        
        this.eventBus.on(EventTypes.ANIMATION_COMPLETE, () => {
            if (this.currentState === 'ANIMATING') this.transitionTo('PLAYING');
        });
    }
    
    transitionTo(newState) {
        // Validate the transition
        const currentConfig = this.states[this.currentState];
        if (!currentConfig) {
            console.error(`Invalid current state: ${this.currentState}`);
            return false;
        }
        
        if (!currentConfig.canTransitionTo.includes(newState)) {
            console.warn(`Invalid transition: ${this.currentState} → ${newState}`);
            return false;
        }
        
        const previousState = this.currentState;
        this.currentState = newState;
        
        // Emit state change event
        this.eventBus.emit(EventTypes.STATE_CHANGED, {
            from: previousState,
            to: newState,
            timestamp: Date.now()
        });
        
        return true;
    }
    
    // Get current state
    getCurrentState() {
        return this.currentState;
    }
    
    // Check if a transition is valid
    canTransitionTo(targetState) {
        const currentConfig = this.states[this.currentState];
        return currentConfig && currentConfig.canTransitionTo.includes(targetState);
    }
    
    // Check if input is allowed in current state
    canAcceptInput() {
        return this.currentState === 'PLAYING';
    }
    
    // Reset to initial state
    reset() {
        this.currentState = 'INITIALIZING';
        this.eventBus.emit(EventTypes.STATE_CHANGED, {
            from: this.currentState,
            to: 'INITIALIZING',
            timestamp: Date.now()
        });
    }
}