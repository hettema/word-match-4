# Claude Development Guide

This file contains important information for Claude (AI assistant) when working on this project.

## Tile.js Integration (ENGINE-02a Complete)

### Overview
GameScene now uses Tile.js instances instead of inline sprite management. Each tile manages its own visual state.

### Key Changes
- `tileSprites` array → `tiles` array of Tile instances
- Tile color/display logic moved to Tile.js
- Visual effects handled through Tile methods:
  - `tile.setSelected(bool)` - Selection state
  - `tile.updateDestabilizationVisual()` - Surge effects
  - `tile.setHovered(bool)` - Hover state

### Integration Points for Future Tasks
- **InputHandler**: Use `tile.setSelected()` and `tile.setHovered()`
- **EffectsQueue**: Coordinate with Tile animation methods
- **Word Tracer**: Access `tile.worldX`, `tile.worldY` for positions
- **Special Tiles**: Types already defined in Tile.js TILE_TYPES

### Important Notes
- Tiles handle their own pointer events
- GameScene coordinates Tile instances via grid position
- All visual state managed by individual Tile objects

## Known Issues

### Contract Validator Complex Types
The EventBus contract validator has limitations with complex nested type definitions. For events with complex array structures (like `Array<{from: {x, y}, to: {x, y}}>`), we use simplified contracts (like `Array`) with comments documenting the actual structure. See GRAVITY_APPLIED in EventTypes.js for an example.

## Test Infrastructure

### Single Source of Truth
- **All tests are located in the `tests/` directory**
- **Test index: `tests/index.html`** - Main entry point for all tests
- **Test runner: `tests/test-runner.js`** - Already implemented, do NOT recreate
- **Test documentation: `tests/README.md`** - Patterns and examples

### Adding New Tests
1. Create test file in `tests/` directory (e.g., `tests/module-name.test.html`)
2. Follow the template in `tests/README.md`
3. Add link to the test in appropriate section of `tests/index.html`
4. Use the existing test runner by importing: `import { test, Assert } from './test-runner.js'`

### Test Organization
- `tests/` - All test files
- `tests/ice-cubes/` - Integration tests using ice cubes pattern
- `tests/integration-test.html` - Ice cubes test harness (moved from root)

### Important Notes
- **TESTING-01 is COMPLETE** - Test infrastructure already exists
- **TESTING-02a might be redundant** - Check if it duplicates TESTING-01 work
- All future modules should add their tests to the existing infrastructure
- Do NOT create new test runners or index files

## Commands

### Running Tests
```bash
npx http-server -p 8080
# Navigate to http://localhost:8080/tests/
# Select tests to run
# Check console AND browser display for results
# IMPORTANT: Shut down server when done
```

### Linting and Type Checking
When implementing modules, always run these commands before marking task as complete:
- `npm run lint` (if available)
- `npm run typecheck` (if available)

If these commands are not found, ask the user for the correct commands and update this file.

## Architecture Reminders

### Event-Driven Rules
1. EventBus is the ONLY event system for game logic
2. Pure functions cannot emit events (adapters do this)
3. All modules use dependency injection
4. No Node.js dependencies allowed

### File Size Limits
- Maximum 500 lines per file
- Prefer longer lines over more lines
- Break into utilities if needed

## Task Completion Checklist
Before marking any task as done:
1. ✅ All acceptance criteria met
2. ✅ Guard rail checklist completed
3. ✅ Tests written and passing
4. ✅ File size under limits
5. ✅ No forbidden patterns used
6. ✅ Moved task to done/ folder
7. ✅ Committed and pushed changes