# Ice Cubes Testing Guide

## What is Ice Cubes Testing?

Ice Cubes testing is a pattern for validating event contracts between systems in an event-driven architecture. The name comes from the analogy of ice cubes melting into water - we want to catch mismatches early when event names match but data shapes don't (the "ice cubes vs water" problem).

## Purpose

- Verify event contracts match between emitters and consumers
- Catch data shape mismatches early in development
- Document event flow between systems
- Prevent integration issues before they become expensive to fix

## How to Use the Ice Cubes Test Harness

### 1. Basic Usage

Navigate to `tests/integration-test.html` in your browser:
```bash
npx http-server -p 8080
# Open http://localhost:8080/tests/integration-test.html
```

### 2. Testing Individual Events

Click any test button to emit a specific event:
- **Test TILE_PRESSED** - Emits a tile press event with x, y, timestamp
- **Test WORD_SUBMITTED** - Emits a word submission with tiles array
- **Test SCORE_CHANGED** - Emits a score change with delta and source
- etc.

The wildcard listener will capture ALL events and display:
- Timestamp of the event
- Event type (name)
- Complete data structure in JSON format

### 3. Contract Validation

Click **"Validate All Contracts"** to automatically test every event type against its contract:
- ✅ Green results show valid contracts
- ❌ Red results show contract violations or missing contracts
- Summary shows total pass/fail count

### 4. Integration Testing Workflow

When integrating two systems:

1. **Run Ice Cubes Test First**
   ```javascript
   // Emit event from System A
   testTilePress();
   // Check the logged output
   ```

2. **Create Event Audit Table**
   ```markdown
   | Event Name     | Emitted By | Data Shape              | Consumed By |
   |---------------|------------|-------------------------|-------------|
   | TILE_PRESSED  | InputHandler | {x: number, y: number} | GameAdapter |
   ```

3. **Verify Contract Match**
   ```javascript
   // Expected by consumer:
   { x: number, y: number, timestamp: number }
   
   // Actual from emitter:
   { x: 3, y: 4, timestamp: 1234567890 }
   
   // ✅ Shapes match!
   ```

4. **Fix Mismatches at Source**
   If shapes don't match, fix the emitter NOT create an adapter!

## Example Integration Test

```javascript
// In your module test file:
import { validateEventData } from './ice-cubes/contract-validator.js';

test('GameAdapter emits correct SELECTION_CHANGED event', () => {
    const eventBus = new EventBus();
    let capturedEvent = null;
    
    // Capture the event
    eventBus.on('SELECTION_CHANGED', (data) => {
        capturedEvent = data;
    });
    
    // Trigger the action
    gameAdapter.handleTilePress({ x: 3, y: 4 });
    
    // Validate contract
    const validation = validateEventData('SELECTION_CHANGED', capturedEvent);
    Assert.truthy(validation.valid, validation.errors.join(', '));
});
```

## Contract Validator API

The `contract-validator.js` module provides utilities:

### validateEventData(eventType, data)
Validates event data against its contract.
```javascript
const result = validateEventData('TILE_PRESSED', { x: 3, y: 4 });
// Returns: { valid: boolean, errors: string[] }
```

### generateEventAuditTable(capturedEvents)
Generates an HTML table of captured events.
```javascript
const table = generateEventAuditTable(window.capturedEvents);
document.getElementById('audit').innerHTML = table;
```

### compareEventData(expected, actual)
Compares expected vs actual data shapes.
```javascript
const result = compareEventData(
    { x: 'number', y: 'number' },
    { x: 3, y: 4, z: 5 }
);
// Returns: { matches: false, report: 'Extra field: z' }
```

## Best Practices

1. **Test Early** - Run ice cubes test before writing integration code
2. **Fix at Source** - Never create adapters to fix shape mismatches
3. **Document Flow** - Keep event audit tables updated
4. **Validate Contracts** - Run contract validation after any event changes
5. **Check Console** - Always check both visual display and console logs

## Common Issues

### "No contract defined"
Add the event contract to `EventContracts` in `EventTypes.js`

### "Field must be X, got Y"
The data type doesn't match the contract - fix the emitter

### "Missing required field"
The emitter isn't providing all required data - add the field

### "Extra fields"
Warning only - but consider if the contract needs updating