// src/core/EventBus.js - Must support wildcard for testing
import { validateEventContract } from './EventTypes.js';

class EventBus extends EventTarget {
    constructor() {
        super();
        this._wildcardHandlers = [];
        this._eventLog = []; // For debugging
        this.enableLogging = true;
        this.enableContractValidation = true; // v3.1 - Can disable in production
        this.recordEvents = true; // v3.1 - For replay debugging
    }
    
    emit(type, data) {
        // v3.1 - Contract validation
        if (this.enableContractValidation) {
            try {
                validateEventContract(type, data);
            } catch (error) {
                console.error(`Contract violation for ${type}:`, error.message);
                console.error('Data:', data);
                throw error; // Fail fast in development
            }
        }
        
        if (this.enableLogging) {
            console.log(`[EVENT] ${type}:`, data);
        }
        
        // v3.1 - Enhanced event recording for replay
        if (this.recordEvents) {
            this._eventLog.push({ 
                type, 
                data: JSON.parse(JSON.stringify(data)), // Deep clone
                timestamp: Date.now(),
                stackTrace: new Error().stack // For debugging
            });
        }
        
        // Notify wildcard handlers first (for ice cubes tests)
        this._wildcardHandlers.forEach(handler => {
            handler(type, data);
        });
        
        // Regular event dispatch
        this.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
    
    on(type, handler) {
        // Support wildcard listeners for testing
        if (type === '*') {
            this._wildcardHandlers.push(handler);
            return;
        }
        
        // Regular event listener
        this.addEventListener(type, (event) => {
            handler(event.detail); // Handler receives data directly
        });
    }
    
    off(type, handler) {
        if (type === '*') {
            const index = this._wildcardHandlers.indexOf(handler);
            if (index > -1) {
                this._wildcardHandlers.splice(index, 1);
            }
            return;
        }
        
        this.removeEventListener(type, handler);
    }
    
    // v3.1 - Event replay for debugging
    replay(fromTimestamp = 0, toTimestamp = Date.now(), speed = 1) {
        const events = this._eventLog.filter(e => 
            e.timestamp >= fromTimestamp && e.timestamp <= toTimestamp
        );
        
        console.log(`Replaying ${events.length} events...`);
        
        events.forEach((event, index) => {
            const delay = index === 0 ? 0 : 
                (event.timestamp - events[index - 1].timestamp) / speed;
            
            setTimeout(() => {
                console.log(`[REPLAY] ${event.type}:`, event.data);
                this.emit(event.type, event.data);
            }, delay);
        });
    }
    
    // v3.1 - Get event log for analysis
    getEventLog(eventType = null) {
        if (eventType) {
            return this._eventLog.filter(e => e.type === eventType);
        }
        return [...this._eventLog];
    }
    
    // v3.1 - Clear event log
    clearEventLog() {
        this._eventLog = [];
    }
}

export { EventBus };