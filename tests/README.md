# Test Writing Patterns

## Overview
This testing infrastructure provides browser-based testing with zero external dependencies. All tests run in the browser and output results to both console and DOM.

## Basic Test Structure

```javascript
// Import test utilities
import { test, Assert } from './test-runner.js';
import { ModuleToTest } from '../src/core/ModuleToTest.js';

// Write a test
test('Test name describing what it should do', () => {
    // Arrange
    const instance = new ModuleToTest();
    
    // Act
    const result = instance.doSomething();
    
    // Assert
    Assert.equals(result, expectedValue);
});
```

## Available Assertions

```javascript
// Basic equality
Assert.equals(actual, expected, 'optional message');

// Deep equality for objects/arrays
Assert.deepEquals(actual, expected, 'optional message');

// Truthy/falsy checks
Assert.truthy(value, 'optional message');
Assert.falsy(value, 'optional message');

// Array includes
Assert.includes(array, item, 'optional message');
Assert.notIncludes(array, item, 'optional message');

// Exception testing
Assert.throws(() => {
    someFunction();
}, 'expected error message');

// Async exception testing
await Assert.throwsAsync(async () => {
    await someAsyncFunction();
}, 'expected error message');
```

## Writing Async Tests

```javascript
test('Async operations should work', async () => {
    const result = await someAsyncOperation();
    Assert.equals(result, expectedValue);
});
```

## Event-Driven Testing Pattern

```javascript
test('Module should emit correct events', () => {
    const eventBus = new EventBus();
    const capturedEvents = [];
    
    // Use wildcard listener to capture all events
    eventBus.on('*', (type, data) => {
        capturedEvents.push({ type, data });
    });
    
    // Trigger action
    module.doSomething();
    
    // Verify events
    Assert.equals(capturedEvents.length, 1);
    Assert.equals(capturedEvents[0].type, 'EXPECTED_EVENT');
});
```

## Ice Cubes Testing Pattern

```javascript
test('Integration between modules via events', () => {
    const eventBus = new EventBus();
    const moduleA = new ModuleA(eventBus);
    const moduleB = new ModuleB(eventBus);
    
    // Capture event flow
    const events = [];
    eventBus.on('*', (type, data) => {
        events.push({ type, data });
    });
    
    // Trigger cascade
    moduleA.trigger();
    
    // Verify event contracts match
    const emittedEvent = events.find(e => e.type === 'SOME_EVENT');
    Assert.truthy(emittedEvent, 'Event should be emitted');
    Assert.deepEquals(emittedEvent.data, expectedShape);
});
```

## Test File Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Module Tests</title>
    <style>
        body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #2c3e50; }
        .back-link { color: #3498db; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <a href="index.html" class="back-link">← Back to Test Suite</a>
        <h1>Module Tests</h1>
        <div id="test-results"></div>
    </div>

    <script type="module">
        import { test, Assert } from './test-runner.js';
        
        // Your tests here
        test('First test', () => {
            Assert.equals(1 + 1, 2);
        });
    </script>
</body>
</html>
```

## Running Tests

1. Start local server: `npx http-server -p 8080`
2. Navigate to `http://localhost:8080/tests/`
3. Click on individual test files or use "Run All Tests"
4. Check both browser display and console for results
5. Shut down server when done

## Best Practices

1. **Test in isolation** - Each test should be independent
2. **Use descriptive names** - Test names should describe what they verify
3. **Follow AAA pattern** - Arrange, Act, Assert
4. **Test event contracts** - Verify both event types and data shapes
5. **Mock dependencies** - Use dependency injection for testability
6. **Keep tests fast** - Avoid long timeouts or delays
7. **Test edge cases** - Include boundary conditions and error cases

## Debugging Failed Tests

- Check browser console for detailed error messages
- Stack traces show exact failure location
- Use `console.log` within tests for debugging
- Test runner preserves error context

## Contract Validation Testing

```javascript
test('Event should match contract', () => {
    const eventBus = new EventBus();
    eventBus.enableContractValidation = true;
    
    // This should throw due to contract violation
    Assert.throws(() => {
        eventBus.emit(EventTypes.TILE_PRESSED, { 
            x: 'invalid', // Should be number
            y: 5,
            timestamp: Date.now()
        });
    }, 'must be number');
});
```