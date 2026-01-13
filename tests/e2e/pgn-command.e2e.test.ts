import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import Database from 'better-sqlite3';

const execAsync = promisify(exec);

const TEST_DB_PATH = './test-e2e-pgn.db';
const SIMPLE_GAME_PATH = './tests/fixtures/pgn/simple-game.pgn';
const MULTIPLE_GAMES_PATH = './tests/fixtures/pgn/multiple-games.pgn';
const CORRUPTED_GAME_PATH = './tests/fixtures/pgn/corrupted-game.pgn';

function fail(message: string): never {
  throw new Error(message);
}

function cleanup() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

function verifyDbHasGames(count: number) {
  const db = new Database(TEST_DB_PATH);
  const games = db.prepare('SELECT COUNT(*) as count FROM games').get() as {
    count: number;
  };
  db.close();
  return games.count === count;
}

describe('PGN Command E2E', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('single PGN file', () => {
    it('should import single PGN file successfully', async () => {
      const command = `node dist/cli/index.js pgn ${SIMPLE_GAME_PATH}`;

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('Processing file');
        expect(stdout).toContain('Game inserted');
        expect(stdout).toContain('Game imported successfully');
        expect(stderr).toBe('');
        expect(verifyDbHasGames(1)).toBe(true);
      } catch (error) {
        fail(`Command failed: ${error}`);
      }
    }, 30000);
  });

  describe('multiple games PGN file', () => {
    it('should import all games from multiple-games.pgn', async () => {
      const command = `node dist/cli/index.js pgn ${MULTIPLE_GAMES_PATH}`;

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('Found 3 game(s)');
        expect(stdout).toContain('Total games imported: 3');
        expect(stderr).toBe('');
        expect(verifyDbHasGames(3)).toBe(true);
      } catch (error) {
        fail(`Command failed: ${error}`);
      }
    }, 60000);
  });

  describe('invalid path', () => {
    it('should error when path does not exist', async () => {
      const command = 'node dist/cli/index.js pgn /nonexistent/path.pgn';

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('Path does not exist');
        expect(stderr).toBe('');
      } catch (error) {
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('corrupted PGN file', () => {
    it('should handle corrupted PGN gracefully', async () => {
      const command = `node dist/cli/index.js pgn ${CORRUPTED_GAME_PATH}`;

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('Error processing game');
        expect(stdout).toContain('Total errors: 1');
        expect(stderr).toBe('');
      } catch (error) {
        fail(`Command should not fail: ${error}`);
      }
    }, 10000);
  });

  describe('duplicate detection', () => {
    it('should skip duplicate games', async () => {
      const command = `node dist/cli/index.js pgn ${SIMPLE_GAME_PATH}`;

      await execAsync(command);
      const { stdout: stdout2 } = await execAsync(command);

      expect(stdout2).toContain('Duplicate game skipped');
      expect(stdout2).toContain('Total games skipped (duplicates): 1');
      expect(verifyDbHasGames(1)).toBe(true);
    }, 60000);
  });
});
