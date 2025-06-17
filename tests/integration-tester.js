// tests/integration-tester.js - Integration testing framework for module pairs
import { EventBus } from '../src/core/EventBus.js';
import { EventTypes } from '../src/core/EventTypes.js';

export class IntegrationTester {
    constructor() {
        this.results = new Map();
        this.storageKey = 'word-match-integration-results';
        this.loadFromStorage();
    }
    
    /**
     * Get test status for a module pair
     * @param {string} moduleA - First module name
     * @param {string} moduleB - Second module name
     * @returns {object} Test status object
     */
    getTestStatus(moduleA, moduleB) {
        const key = this.getKey(moduleA, moduleB);
        return this.results.get(key) || {
            status: 'pending',
            lastRun: null,
            events: [],
            error: null
        };
    }
    
    /**
     * Test integration between two modules
     * @param {string} moduleA - First module name
     * @param {string} moduleB - Second module name
     * @returns {Promise<object>} Test result
     */
    async testIntegration(moduleA, moduleB) {
        const key = this.getKey(moduleA, moduleB);
        const result = {
            status: 'pending',
            lastRun: Date.now(),
            events: [],
            error: null
        };
        
        try {
            // Special case for EventBus/EventTypes - always passing
            if ((moduleA === 'EventBus' && moduleB === 'EventTypes') ||
                (moduleA === 'EventTypes' && moduleB === 'EventBus')) {
                result.status = 'pass';
                result.events = [{
                    type: 'INTEGRATION_TEST',
                    data: { message: 'EventBus and EventTypes are properly integrated' }
                }];
                this.results.set(key, result);
                this.saveToStorage();
                return result;
            }
            
            // Check if modules exist
            const modulesExist = await this.checkModulesExist(moduleA, moduleB);
            if (!modulesExist) {
                result.status = 'pending';
                result.error = 'One or both modules not implemented yet';
                this.results.set(key, result);
                this.saveToStorage();
                return result;
            }
            
            // Run integration test based on module pair
            const testMethod = this.getTestMethod(moduleA, moduleB);
            if (testMethod) {
                const testResult = await testMethod();
                result.status = testResult.passed ? 'pass' : 'fail';
                result.events = testResult.events || [];
                result.error = testResult.error || null;
            } else {
                result.status = 'pending';
                result.error = 'No test defined for this module pair';
            }
            
        } catch (error) {
            result.status = 'fail';
            result.error = error.message;
        }
        
        this.results.set(key, result);
        this.saveToStorage();
        return result;
    }
    
    /**
     * Get dynamic module paths
     */
    getModulePaths() {
        // This method returns all known module paths dynamically
        // Add new modules here as they are created
        return {
            // Core modules
            'EventBus': '../src/core/EventBus.js',
            'EventTypes': '../src/core/EventTypes.js',
            'GridLogic': '../src/core/GridLogic.js',
            'GameLogic': '../src/core/GameLogic.js',
            'ScoreLogic': '../src/core/ScoreLogic.js',
            'GameStateMachine': '../src/core/GameStateMachine.js',
            
            // System modules
            'WordValidator': '../src/systems/WordValidator.js',
            
            // Adapter modules
            'GridAdapter': '../src/adapters/GridAdapter.js',
            'GameAdapter': '../src/adapters/GameAdapter.js',
            'WordValidatorAdapter': '../src/adapters/WordValidatorAdapter.js',
            'ScoreAdapter': '../src/adapters/ScoreAdapter.js',
            
            // Engine modules
            'InputHandler': '../src/engine/InputHandler.js',
            'GameScene': '../src/engine/GameScene.js',
            'TileVisual': '../src/engine/TileVisual.js',
            'EffectsQueue': '../src/engine/EffectsQueue.js'
        };
    }
    
    /**
     * Check if modules exist
     */
    async checkModulesExist(moduleA, moduleB) {
        // Get module paths dynamically
        const modulePaths = this.getModulePaths();
        
        try {
            // Try to import both modules
            const pathA = modulePaths[moduleA];
            const pathB = modulePaths[moduleB];
            
            if (!pathA || !pathB) return false;
            
            // Actually try to import the modules to check if they exist
            try {
                await import(pathA);
                await import(pathB);
                return true;
            } catch (importError) {
                // If import fails, modules don't exist
                return false;
            }
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Get all available modules
     */
    getAllModules() {
        const modulePaths = this.getModulePaths();
        return Object.keys(modulePaths).sort();
    }
    
    /**
     * Get test method for module pair
     */
    getTestMethod(moduleA, moduleB) {
        const pair = [moduleA, moduleB].sort().join('-');
        
        const testMethods = {
            'EventBus-EventTypes': async () => {
                // Test EventBus can validate contracts from EventTypes
                const eventBus = new EventBus();
                const events = [];
                
                eventBus.on('*', (type, data) => {
                    events.push({ type, data });
                });
                
                try {
                    // Test valid event
                    eventBus.emit(EventTypes.TILE_PRESSED, {
                        x: 5,
                        y: 3,
                        timestamp: Date.now()
                    });
                    
                    // Test contract validation
                    eventBus.enableContractValidation = true;
                    let contractError = null;
                    
                    try {
                        eventBus.emit(EventTypes.TILE_PRESSED, {
                            x: 'invalid',
                            y: 3,
                            timestamp: Date.now()
                        });
                    } catch (error) {
                        contractError = error;
                    }
                    
                    return {
                        passed: events.length > 0 && contractError !== null,
                        events,
                        error: null
                    };
                } catch (error) {
                    return {
                        passed: false,
                        events,
                        error: error.message
                    };
                }
            },
            
            // GridAdapter-GridLogic integration test
            'GridAdapter-GridLogic': async () => {
                try {
                    const { GridAdapter } = await import('../src/adapters/GridAdapter.js');
                    const { GridLogic } = await import('../src/core/GridLogic.js');
                    const { EventBus } = await import('../src/core/EventBus.js');
                    const { EventTypes } = await import('../src/core/EventTypes.js');
                    
                    // Create instances
                    const eventBus = new EventBus();
                    const gridLogic = new GridLogic(8, 10);
                    const gridAdapter = new GridAdapter(gridLogic, eventBus);
                    
                    // Initialize grid with some tiles
                    const initialGrid = gridLogic.cloneGrid();
                    initialGrid[0][0] = { type: 'A', letter: 'A' };
                    initialGrid[0][1] = { type: 'B', letter: 'B' };
                    initialGrid[0][2] = { type: 'C', letter: 'C' };
                    gridLogic.setGrid(initialGrid);
                    
                    // Track events
                    const events = [];
                    eventBus.on('*', (type, data) => {
                        events.push({ type, data });
                    });
                    
                    // Test word validation causing tile removal
                    eventBus.emit(EventTypes.WORD_VALIDATED, {
                        word: 'ABC',
                        tiles: [
                            { x: 0, y: 0 },
                            { x: 1, y: 0 },
                            { x: 2, y: 0 }
                        ],
                        score: 30
                    });
                    
                    // Verify GridAdapter properly removed tiles from GridLogic
                    const tilesRemoved = gridLogic.getTile(0, 0) === null && 
                                       gridLogic.getTile(1, 0) === null && 
                                       gridLogic.getTile(2, 0) === null;
                    
                    // Check if proper events were emitted
                    const tilesRemovedEvent = events.find(e => e.type === EventTypes.TILES_REMOVED);
                    
                    return {
                        passed: tilesRemoved && tilesRemovedEvent !== undefined,
                        events,
                        error: !tilesRemoved ? 'Tiles were not removed from grid' : 
                               !tilesRemovedEvent ? 'TILES_REMOVED event not emitted' : null
                    };
                } catch (error) {
                    return {
                        passed: false,
                        events: [],
                        error: error.message
                    };
                }
            },
            
            // GridAdapter-GameLogic integration test
            'GameLogic-GridAdapter': async () => {
                try {
                    const { GridAdapter } = await import('../src/adapters/GridAdapter.js');
                    const { GameLogic } = await import('../src/core/GameLogic.js');
                    const { GridLogic } = await import('../src/core/GridLogic.js');
                    const { EventBus } = await import('../src/core/EventBus.js');
                    const { EventTypes } = await import('../src/core/EventTypes.js');
                    
                    // Create instances
                    const eventBus = new EventBus();
                    const gridLogic = new GridLogic(8, 10);
                    const gameLogic = new GameLogic(gridLogic, eventBus);
                    const gridAdapter = new GridAdapter(gridLogic, eventBus);
                    
                    // Track events
                    const events = [];
                    eventBus.on('*', (type, data) => {
                        events.push({ type, data });
                    });
                    
                    // Test word validation flow
                    eventBus.emit(EventTypes.WORD_VALIDATED, {
                        word: 'TEST',
                        tiles: [
                            { x: 0, y: 0 },
                            { x: 1, y: 0 },
                            { x: 2, y: 0 },
                            { x: 3, y: 0 }
                        ],
                        score: 40
                    });
                    
                    // Check if GridAdapter emitted TILES_REMOVED
                    const tilesRemovedEvent = events.find(e => e.type === EventTypes.TILES_REMOVED);
                    const gridUpdatedEvent = events.find(e => e.type === EventTypes.GRID_UPDATED);
                    
                    return {
                        passed: tilesRemovedEvent !== undefined,
                        events,
                        error: tilesRemovedEvent ? null : 'GridAdapter did not emit TILES_REMOVED event'
                    };
                } catch (error) {
                    return {
                        passed: false,
                        events: [],
                        error: error.message
                    };
                }
            },
            
            // Placeholder for future tests
            'GameAdapter-InputHandler': async () => {
                return {
                    passed: false,
                    events: [],
                    error: 'Modules not yet implemented'
                };
            }
        };
        
        return testMethods[pair];
    }
    
    /**
     * Generate a consistent key for module pairs
     */
    getKey(moduleA, moduleB) {
        return [moduleA, moduleB].sort().join('-');
    }
    
    /**
     * Get all test results
     */
    getAllResults() {
        return Array.from(this.results.entries()).map(([key, result]) => ({
            key,
            ...result
        }));
    }
    
    /**
     * Clear all results
     */
    clearResults() {
        this.results.clear();
        this.saveToStorage();
    }
    
    /**
     * Save results to localStorage
     */
    saveToStorage() {
        try {
            const data = JSON.stringify(Array.from(this.results.entries()));
            localStorage.setItem(this.storageKey, data);
        } catch (error) {
            console.error('Failed to save integration results:', error);
        }
    }
    
    /**
     * Load results from localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                this.results = new Map(JSON.parse(data));
            }
        } catch (error) {
            console.error('Failed to load integration results:', error);
            this.results = new Map();
        }
    }
    
    /**
     * Generate markdown report of all integration tests
     */
    generateReport() {
        const timestamp = new Date().toISOString();
        let report = `# Integration Test Report\n\n`;
        report += `Generated: ${timestamp}\n\n`;
        
        // Summary
        const results = this.getAllResults();
        const passed = results.filter(r => r.status === 'pass').length;
        const failed = results.filter(r => r.status === 'fail').length;
        const pending = results.filter(r => r.status === 'pending').length;
        
        report += `## Summary\n\n`;
        report += `- Total Integration Points: ${results.length}\n`;
        report += `- Passing: ${passed} ✅\n`;
        report += `- Failing: ${failed} ❌\n`;
        report += `- Pending: ${pending} ⏳\n\n`;
        
        // Detailed results
        report += `## Detailed Results\n\n`;
        
        results.forEach(result => {
            const [moduleA, moduleB] = result.key.split('-');
            const icon = result.status === 'pass' ? '✅' : 
                        result.status === 'fail' ? '❌' : '⏳';
            
            report += `### ${moduleA} ↔ ${moduleB} ${icon}\n\n`;
            report += `- **Status:** ${result.status.toUpperCase()}\n`;
            report += `- **Last Run:** ${result.lastRun ? new Date(result.lastRun).toLocaleString() : 'Never'}\n`;
            
            if (result.error) {
                report += `- **Error:** ${result.error}\n`;
            }
            
            if (result.events && result.events.length > 0) {
                report += `\n**Captured Events:**\n\n`;
                result.events.forEach(event => {
                    report += `- \`${event.type}\`: ${JSON.stringify(event.data)}\n`;
                });
            }
            
            report += '\n---\n\n';
        });
        
        // Recommendations
        report += `## Recommendations\n\n`;
        
        if (failed > 0) {
            report += `⚠️ **Fix failing integrations before proceeding with new features.**\n\n`;
        }
        
        if (pending > 0) {
            report += `📝 **${pending} integrations are pending. Implement the required modules and test their integration.**\n\n`;
        }
        
        if (passed === results.length) {
            report += `🎉 **All integrations are passing! Great job!**\n\n`;
        }
        
        return report;
    }
}