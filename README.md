# Chess Game Importer

A command-line application for importing chess games from PGN files or Chess.com/Lichess APIs, analyzing them with Stockfish, and storing them in a SQLite database.

## Features

- Import games from PGN files or directories
- Fetch games from Chess.com API with date filtering
- Fetch games from Lichess API with date filtering
- Deep Stockfish analysis (depth 20) for each position
- Multi-PV analysis (top 3 continuations)
- Duplicate detection based on exact PGN match
- **Temporal.io orchestration** - Reliable, retryable, and observable workflows
- SQLite database with full game and position data
- Colored terminal output for progress tracking
- Comprehensive error logging with actionable suggestions

## Installation

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- **Temporal CLI** (for development server)

### Install Temporal CLI

```bash
# macOS
brew install temporal

# Linux
curl -sSf https://temporal.io/get.sh | sudo bash

# Windows (using Chocolatey)
choco install temporal-cli
```

### Install Dependencies

```bash
npm install
```

### Build Project

```bash
npm run build
```

## Running with Temporal

### Quick Start

You need **three terminal windows** to run the application:

```bash
# Terminal 1: Start Temporal Server (local development)
temporal server start-dev

# Terminal 2: Start the Worker (processes workflows and activities)
npm run worker

# Terminal 3: Run the CLI (starts workflows, returns immediately)
npm run cli pgn /path/to/game.pgn
```

### Available Commands

Import a single PGN file:

```bash
npm run cli pgn /path/to/game.pgn
```

Import all PGN files from a directory (recursive):

```bash
npm run cli pgn /path/to/pgns/
```

Monitor a running or completed workflow:

```bash
npm run cli status <workflow-id>
```

Stop a running workflow:

```bash
npm run cli cancel <workflow-id>
```

Import from Chess.com:

**Note:** Chess.com command uses direct processing (not yet migrated to Temporal). This will be updated in future versions.

```bash
npm run cli chesscom username
npm run cli chesscom username 2025-01-01 2025-01-31
```

Import from Lichess:

**Note:** Lichess command uses direct processing (not yet migrated to Temporal). This will be updated in future versions.

```bash
npm run cli lichess username
npm run cli lichess username 2025-01-01 2025-01-31
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
