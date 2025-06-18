// EffectsQueue.js - Manages animation sequencing and timing
import { EventTypes } from '../core/EventTypes.js';

export class EffectsQueue {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.queue = [];
        this.isProcessing = false;
        this.currentAnimation = null;
    }
    
    init() {
        // Listen for events that trigger animations
        this.eventBus.on(EventTypes.TILES_REMOVED, (data) => this.handleTilesRemoved(data));
        this.eventBus.on(EventTypes.GRAVITY_APPLIED, (data) => this.handleGravityApplied(data));
        this.eventBus.on(EventTypes.RIPPLE_EFFECT, (data) => this.handleRippleEffect(data));
    }
    
    handleTilesRemoved(data) {
        const { positions, source, timestamp } = data;
        
        // Queue explosion animations for each removed tile
        positions.forEach((pos, index) => {
            this.queue.push({
                type: 'explosion',
                target: { x: pos.x, y: pos.y },
                delay: index * 50, // Stagger explosions
                duration: 500,
                source: source,
                timestamp: timestamp
            });
        });
        
        // Start processing if not already running
        if (!this.isProcessing) {
            this.processQueue();
        }
    }
    
    handleGravityApplied(data) {
        const { tilesDropped, timestamp } = data;
        
        // Queue fall animations for dropped tiles
        tilesDropped.forEach((drop, index) => {
            this.queue.push({
                type: 'fall',
                target: { from: drop.from, to: drop.to, tile: drop.tile },
                delay: index * 30, // Stagger falls
                duration: 300,
                timestamp: timestamp
            });
        });
        
        // Continue processing
        if (!this.isProcessing) {
            this.processQueue();
        }
    }
    
    handleRippleEffect(data) {
        const { epicenter, affectedTiles, surgePower, timestamp } = data;
        
        // Queue ripple animation
        this.queue.push({
            type: 'ripple',
            target: { epicenter, affectedTiles, surgePower },
            delay: 0,
            duration: 600,
            timestamp: timestamp
        });
        
        // Continue processing
        if (!this.isProcessing) {
            this.processQueue();
        }
    }
    
    processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            // All animations complete - emit completion event
            this.eventBus.emit(EventTypes.ANIMATION_COMPLETE, {
                type: 'queue_complete',
                target: null,
                timestamp: Date.now()
            });
            return;
        }
        
        this.isProcessing = true;
        this.currentAnimation = this.queue.shift();
        
        // Wait for any delay
        setTimeout(() => {
            // Emit animation started
            this.emitAnimationStarted(
                this.currentAnimation.type,
                this.currentAnimation.target,
                this.currentAnimation.duration
            );
            
            // Wait for animation duration
            setTimeout(() => {
                // Emit animation complete for this specific animation
                this.emitAnimationComplete(
                    this.currentAnimation.type,
                    this.currentAnimation.target
                );
                
                // Process next in queue
                this.processQueue();
            }, this.currentAnimation.duration);
            
        }, this.currentAnimation.delay);
    }
    
    emitAnimationStarted(type, target, duration) {
        this.eventBus.emit(EventTypes.ANIMATION_STARTED, {
            type: type,
            target: target,
            duration: duration,
            timestamp: Date.now()
        });
    }
    
    emitAnimationComplete(type, target) {
        // Note: This is for individual animations
        // The main ANIMATION_COMPLETE that triggers gravity is emitted
        // when the entire queue is empty (in processQueue)
    }
    
    // Utility method to clear queue (for testing or reset)
    clearQueue() {
        this.queue = [];
        this.isProcessing = false;
        this.currentAnimation = null;
    }
    
    // Get current queue size (for testing)
    getQueueSize() {
        return this.queue.length;
    }
    
    // Check if actively processing
    isActive() {
        return this.isProcessing;
    }
}