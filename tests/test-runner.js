// tests/test-runner.js - Browser-based test runner with zero dependencies
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentTest = null;
        this.startTime = null;
    }
    
    register(name, testFn) {
        this.tests.push({ name, testFn, status: 'pending' });
    }
    
    async runAll() {
        this.startTime = Date.now();
        console.log('=== TEST RUN STARTED ===');
        console.log(`Running ${this.tests.length} tests...\n`);
        
        // Clear previous results
        this.results = [];
        
        for (const test of this.tests) {
            this.currentTest = test;
            const testStart = Date.now();
            
            try {
                // Support both sync and async tests
                await test.testFn();
                test.status = 'passed';
                test.duration = Date.now() - testStart;
                console.log(`✅ ${test.name} (${test.duration}ms)`);
            } catch (error) {
                test.status = 'failed';
                test.error = error;
                test.duration = Date.now() - testStart;
                console.error(`❌ ${test.name} (${test.duration}ms)`);
                console.error(`   ${error.message}`);
                if (error.stack) {
                    console.error(`   ${error.stack.split('\n').slice(1, 3).join('\n   ')}`);
                }
            }
            
            this.results.push({...test});
        }
        
        const totalDuration = Date.now() - this.startTime;
        return this.generateReport(totalDuration);
    }
    
    generateReport(duration) {
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        
        // Console report
        console.log('\n=== TEST SUMMARY ===');
        console.log(`Total: ${this.results.length}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Duration: ${duration}ms`);
        console.log(`Status: ${failed === 0 ? 'ALL TESTS PASSED! 🎉' : 'TESTS FAILED! 💥'}`);
        
        // DOM report
        this.renderHTMLReport(duration);
        
        // Return summary for potential CI integration
        return {
            total: this.results.length,
            passed,
            failed,
            duration,
            results: this.results,
            success: failed === 0
        };
    }
    
    renderHTMLReport(duration) {
        const container = document.getElementById('test-results');
        if (!container) {
            console.warn('No element with id="test-results" found in DOM');
            return;
        }
        
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const success = failed === 0;
        
        const html = `
            <div class="test-summary ${success ? 'all-passed' : 'has-failures'}">
                <h2>Test Results</h2>
                <div class="stats">
                    <div class="stat-box">
                        <span class="stat-label">Total</span>
                        <span class="stat-value">${this.results.length}</span>
                    </div>
                    <div class="stat-box passed">
                        <span class="stat-label">Passed</span>
                        <span class="stat-value">${passed}</span>
                    </div>
                    <div class="stat-box failed">
                        <span class="stat-label">Failed</span>
                        <span class="stat-value">${failed}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Duration</span>
                        <span class="stat-value">${duration}ms</span>
                    </div>
                </div>
                <div class="overall-status ${success ? 'success' : 'failure'}">
                    ${success ? '✅ ALL TESTS PASSED!' : '❌ TESTS FAILED!'}
                </div>
                <ul class="test-list">
                    ${this.results.map(r => `
                        <li class="test-item ${r.status}">
                            <span class="status-icon">${r.status === 'passed' ? '✅' : '❌'}</span>
                            <span class="test-name">${r.name}</span>
                            <span class="test-duration">${r.duration}ms</span>
                            ${r.error ? `
                                <div class="error-details">
                                    <div class="error-message">${this.escapeHtml(r.error.message)}</div>
                                    <pre class="error-stack">${this.escapeHtml(r.error.stack)}</pre>
                                </div>
                            ` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Assert utility class with common assertions
class Assert {
    static equals(actual, expected, message = '') {
        if (actual !== expected) {
            throw new AssertionError(
                message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
            );
        }
    }
    
    static deepEquals(actual, expected, message = '') {
        if (!this._deepEqual(actual, expected)) {
            throw new AssertionError(
                message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
            );
        }
    }
    
    static truthy(value, message = '') {
        if (!value) {
            throw new AssertionError(
                message || `Expected truthy value, got ${JSON.stringify(value)}`
            );
        }
    }
    
    static falsy(value, message = '') {
        if (value) {
            throw new AssertionError(
                message || `Expected falsy value, got ${JSON.stringify(value)}`
            );
        }
    }
    
    static throws(fn, expectedError = null, message = '') {
        let threw = false;
        let actualError = null;
        
        try {
            fn();
        } catch (error) {
            threw = true;
            actualError = error;
        }
        
        if (!threw) {
            throw new AssertionError(message || 'Expected function to throw');
        }
        
        if (expectedError) {
            if (typeof expectedError === 'string' && !actualError.message.includes(expectedError)) {
                throw new AssertionError(
                    message || `Expected error message to include "${expectedError}", got "${actualError.message}"`
                );
            } else if (expectedError instanceof RegExp && !expectedError.test(actualError.message)) {
                throw new AssertionError(
                    message || `Expected error message to match ${expectedError}, got "${actualError.message}"`
                );
            }
        }
    }
    
    static async throwsAsync(asyncFn, expectedError = null, message = '') {
        let threw = false;
        let actualError = null;
        
        try {
            await asyncFn();
        } catch (error) {
            threw = true;
            actualError = error;
        }
        
        if (!threw) {
            throw new AssertionError(message || 'Expected async function to throw');
        }
        
        if (expectedError) {
            if (typeof expectedError === 'string' && !actualError.message.includes(expectedError)) {
                throw new AssertionError(
                    message || `Expected error message to include "${expectedError}", got "${actualError.message}"`
                );
            } else if (expectedError instanceof RegExp && !expectedError.test(actualError.message)) {
                throw new AssertionError(
                    message || `Expected error message to match ${expectedError}, got "${actualError.message}"`
                );
            }
        }
    }
    
    static includes(array, item, message = '') {
        if (!array.includes(item)) {
            throw new AssertionError(
                message || `Expected array to include ${JSON.stringify(item)}`
            );
        }
    }
    
    static notIncludes(array, item, message = '') {
        if (array.includes(item)) {
            throw new AssertionError(
                message || `Expected array not to include ${JSON.stringify(item)}`
            );
        }
    }
    
    static _deepEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (typeof a !== typeof b) return false;
        
        if (Array.isArray(a)) {
            if (!Array.isArray(b) || a.length !== b.length) return false;
            return a.every((item, index) => this._deepEqual(item, b[index]));
        }
        
        if (typeof a === 'object') {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            return keysA.every(key => this._deepEqual(a[key], b[key]));
        }
        
        return false;
    }
}

// Custom error class for assertion failures
class AssertionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AssertionError';
    }
}

// Global test runner instance
const testRunner = new TestRunner();

// Convenience function for registering tests
function test(name, testFn) {
    testRunner.register(name, testFn);
}

// Run all tests when DOM is loaded (unless prevented)
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // Only auto-run if there's a test-results element and no manual override
        if (document.getElementById('test-results') && !window.MANUAL_TEST_RUN) {
            // Small delay to allow test files to register
            setTimeout(() => {
                testRunner.runAll();
            }, 100);
        }
    });
}

// Export for ES6 modules
export { TestRunner, Assert, AssertionError, test, testRunner };