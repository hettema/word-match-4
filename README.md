# Word Match 4

A browser-based puzzle game combining Scrabble-style word building with match-3 cascade mechanics. Trace words on a letter grid to trigger explosive chain reactions!

## Game Overview

Word Match challenges players to:
- Trace connected letters to form valid words (minimum 3 letters)
- Trigger explosions that create ripple effects on surrounding tiles
- Achieve target scores within limited moves
- Master special tiles like bombs, multipliers, and blockers

## Technical Architecture

The game uses an event-driven architecture with:
- **Pure Functions**: Core game logic with no side effects
- **Event Bus**: Central communication system between modules
- **Adapters**: Bridge between pure logic and event system
- **Phaser 3**: Rendering engine for smooth animations
- **HTML/CSS**: Overlay effects for scores and explosions

## Getting Started

### Prerequisites
- Node.js 14+ 
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Installation
```bash
# Clone the repository
git clone https://github.com/hettema/word-match-4.git
cd word-match-4

# Install dependencies
npm install

# Start the development server
npm start
```

Then open http://localhost:8080 in your browser.

### Running Tests
```bash
npm test
```

This will open the test runner in your browser at http://localhost:8081/tests/

## Project Structure

```
word-match-4/
├── src/
│   ├── core/        # Pure game logic
│   ├── adapters/    # Event bridge layer
│   ├── engine/      # Phaser rendering
│   ├── systems/     # Supporting systems
│   └── utils/       # Utilities
├── config/          # Game configuration
├── assets/          # Game assets
├── tests/           # Test suite
└── docs/            # Documentation
```

## Development

The project follows strict development principles:
- Event-driven architecture (no direct module coupling)
- Browser-based testing only (no Node.js dependencies in game code)
- Maximum 500 lines per source file
- Comprehensive test coverage

See the [Technical Design Document](tdd-word-match.md) for detailed architecture information.

## Contributing

Please read the [Kanban Rules](kanban-rules.md) before contributing. All tasks are tracked in the `todo/` folder.

## License

MIT License - see LICENSE file for details