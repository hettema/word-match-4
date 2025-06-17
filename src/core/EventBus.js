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
        this.maxEventLogSize = 1000; // v3.1 - Prevent memory bloat
        this.maxEventLogMemory = 10 * 1024 * 1024; // 10MB limit
        this._eventLogMemoryUsage = 0;
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
            try {
                const clonedData = JSON.parse(JSON.stringify(data)); // Deep clone
                const eventRecord = { 
                    type, 
                    data: clonedData,
                    timestamp: Date.now(),
                    stackTrace: new Error().stack // For debugging
                };
                
                // Estimate memory usage (rough approximation)
                const eventSize = JSON.stringify(eventRecord).length * 2; // 2 bytes per char
                
                // Check memory limits
                if (this._eventLogMemoryUsage + eventSize > this.maxEventLogMemory) {
                    // Remove oldest events until we have space
                    while (this._eventLog.length > 0 && this._eventLogMemoryUsage + eventSize > this.maxEventLogMemory) {
                        const removed = this._eventLog.shift();
                        this._eventLogMemoryUsage -= JSON.stringify(removed).length * 2;
                    }
                    console.warn('[EVENT REPLAY] Memory limit reached, removed oldest events');
                }
                
                // Check size limit
                if (this._eventLog.length >= this.maxEventLogSize) {
                    const removed = this._eventLog.shift();
                    this._eventLogMemoryUsage -= JSON.stringify(removed).length * 2;
                }
                
                this._eventLog.push(eventRecord);
                this._eventLogMemoryUsage += eventSize;
            } catch (error) {
                // Handle circular references gracefully
                console.warn(`[EVENT REPLAY] Failed to record event ${type}:`, error.message);
            }
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
    replay(fromTimestamp = 0, toTimestamp = Date.now(), speed = 1, options = {}) {
        const events = this._eventLog.filter(e => 
            e.timestamp >= fromTimestamp && e.timestamp <= toTimestamp
        );
        
        if (events.length === 0) {
            console.log('[EVENT REPLAY] No events found in specified time range');
            return;
        }
        
        const startTime = events[0]?.timestamp || Date.now();
        const endTime = events[events.length - 1]?.timestamp || Date.now();
        const duration = endTime - startTime;
        
        console.log('╔════════════════════════════════════════════════════════════════');
        console.log(`║ EVENT REPLAY: ${events.length} events over ${duration}ms`);
        console.log(`║ Speed: ${speed}x | From: ${new Date(fromTimestamp).toISOString()}`);
        console.log(`║ To: ${new Date(toTimestamp).toISOString()}`);
        console.log('╚════════════════════════════════════════════════════════════════');
        
        let cumulativeDelay = 0;
        
        events.forEach((event, index) => {
            const delay = index === 0 ? 0 : 
                (event.timestamp - events[index - 1].timestamp) / speed;
            cumulativeDelay += delay;
            
            setTimeout(() => {
                const relativeTime = event.timestamp - startTime;
                console.log(`[REPLAY ${index + 1}/${events.length}] +${relativeTime}ms ${event.type}:`, event.data);
                
                // Temporarily disable recording during replay to avoid duplication
                const originalRecordState = this.recordEvents;
                this.recordEvents = false;
                
                try {
                    this.emit(event.type, event.data);
                } finally {
                    this.recordEvents = originalRecordState;
                }
                
                if (index === events.length - 1) {
                    console.log('╚════════════════════════ REPLAY COMPLETE ══════════════════════╝');
                }
            }, cumulativeDelay);
        });
    }
    
    // v3.1 - Get event log for analysis
    getEventLog(eventType = null, options = {}) {
        let events = [...this._eventLog];
        
        // Filter by event type
        if (eventType) {
            events = events.filter(e => e.type === eventType);
        }
        
        // Additional filtering options
        if (options.fromTimestamp) {
            events = events.filter(e => e.timestamp >= options.fromTimestamp);
        }
        if (options.toTimestamp) {
            events = events.filter(e => e.timestamp <= options.toTimestamp);
        }
        if (options.limit) {
            events = events.slice(-options.limit);
        }
        
        return events;
    }
    
    // v3.1 - Clear event log
    clearEventLog() {
        this._eventLog = [];
        this._eventLogMemoryUsage = 0;
        console.log('[EVENT REPLAY] Event log cleared');
    }
    
    // v3.1 - Get event log statistics
    getEventLogStats() {
        const stats = {
            totalEvents: this._eventLog.length,
            memoryUsage: this._eventLogMemoryUsage,
            memoryUsageMB: (this._eventLogMemoryUsage / (1024 * 1024)).toFixed(2),
            oldestEvent: this._eventLog[0]?.timestamp,
            newestEvent: this._eventLog[this._eventLog.length - 1]?.timestamp,
            eventTypes: {}
        };
        
        // Count events by type
        this._eventLog.forEach(event => {
            stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;
        });
        
        return stats;
    }
}

export { EventBus };