# Chess Game Importer

A command-line application for importing chess games from PGN files or Chess.com/Lichess APIs, analyzing them with Stockfish, and storing them in a SQLite database.

## Features

- Import games from PGN files or directories
- Fetch games from Chess.com API with date filtering
- Fetch games from Lichess API with date filtering
- Deep Stockfish analysis (depth 20) for each position
- Multi-PV analysis (top 3 continuations)
- Duplicate detection based on exact PGN match
- SQLite database with full game and position data
- Colored terminal output for progress tracking
- Comprehensive error logging to console and file

## Technology Stack

- **TypeScript** v5.x
- **Node.js** v18+ (required for WASM support)
- **better-sqlite3** - SQLite database operations
- **kokopu** - PGN parsing and chess logic
- **stockfish** - WASM-based Stockfish engine
- **chalk** - Terminal colors
- **date-fns** - Flexible date parsing
- **commander** - CLI argument parsing

## Installation

### Prerequisites

- Node.js v18 or higher
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

## Usage

### Import from PGN Files

Import a single PGN file:

```bash
chess-game-importer pgn /path/to/game.pgn
```

Import all PGN files from a directory (recursive):

```bash
chess-game-importer pgn /path/to/pgns/
```

### Import from Chess.com

Import all games for a user (last 30 days by default):

```bash
chess-game-importer chesscom username
```

Import games with a date range:

```bash
chess-game-importer chesscom username 2025-01-01 2025-01-31
```

Supported date formats:
- `2025-01-01` (ISO format)
- `01/01/2025` (MM/DD/YYYY)
- `Jan 1, 2025`
- `January 1, 2025`
- `1 Jan 2025`
- `1 January 2025`

### Import from Lichess

Import games from Lichess (same syntax as Chess.com):

```bash
chess-game-importer lichess username
chess-game-importer lichess username 2025-01-01 2025-01-31
```

### Global Options

- `-h, --help` - Display help message
- `-v, --version` - Display version number

## Output

### Terminal Output

The CLI provides colored terminal output showing:

- ℹ Information messages (blue)
- ✓ Success messages (green)
- ⚠ Warning messages (yellow) - e.g., duplicate games
- ✗ Error messages (red)

### Progress Tracking

During import, you'll see:

- File being processed
- Games found and parsed
- Positions being analyzed with Stockfish
- Summary of imported/skipped/errored games

### Database

Games are stored in `games.db` with:

- **games table**: Game metadata (players, winner, tournament, PGN)
- **positions table**: Each position with FEN, evaluation, best move, continuations, and board state

Duplicate detection prevents importing the same game twice (based on exact PGN match).

## Development

### Development Mode

Run with automatic reloading on file changes:

```bash
npm run dev
```

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm test -- --coverage
```

### Linting

Check code for issues:

```bash
npm run lint
```

### Formatting

Format code with Prettier:

```bash
npm run format
```

Check formatting without changing:

```bash
npm run format:check
```

## Project Structure

```
chess-game-importer/
├── src/
│   ├── cli/              # CLI command handlers
│   ├── config/           # Configuration files
│   ├── constants/        # SQL and UCI constants
│   ├── errors/           # Custom error classes
│   ├── models/           # TypeScript interfaces
│   ├── services/         # Core business logic
│   └── utils/           # Utility functions
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/             # End-to-end tests
├── dist/               # Compiled JavaScript (generated)
└── games.db            # SQLite database (generated)
```

## Stockfish Analysis

Each position is analyzed to depth 20 with the following configuration:

- **MultiPV**: 3 (top 3 continuations)
- **Hash**: 128 MB
- **Threads**: 1 (for stability)

Analysis results include:
- Evaluation in pawns (or "M3" for mate in 3)
- Best move in UCI notation
- Top 3 principal variations with moves and evaluations

## Error Handling

All errors are logged to:
1. Console (with colors)
2. `error.log` file (with timestamps and stack traces)

The application continues processing after errors, logging them and moving to the next game/file.

## Performance Notes

- Stockfish analysis is sequential (one position at a time) for stability
- Expected speed: ~1-3 seconds per position
- Large PGN files (100+ games) may take several minutes
- Duplicate detection is instant (UNIQUE constraint on PGN)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `npm test && npm run lint`
5. Commit your changes
6. Push to the branch
7. Create a Pull Request

### Code Style

- Use TypeScript with strict mode
- Follow ESLint rules
- Format with Prettier (2 spaces, single quotes)
- Add JSDoc comments for functions
- Use private methods with underscore prefix

### Testing

- Aim for >80% code coverage
- Write unit tests for utilities and services
- Write integration tests for workflows
- Write E2E tests for CLI commands

## License

MIT

## Author

Nathan Loding
