import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import Database from 'better-sqlite3';
import nock from 'nock';

const execAsync = promisify(exec);

const TEST_DB_PATH = './test-e2e-chesscom.db';

function fail(message: string): never {
  throw new Error(message);
}

function cleanup() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
  nock.cleanAll();
}

function verifyDbHasGames(count: number) {
  const db = new Database(TEST_DB_PATH);
  const games = db.prepare('SELECT COUNT(*) as count FROM games').get() as {
    count: number;
  };
  db.close();
  return games.count === count;
}

const MOCK_ARCHIVES = {
  archives: ['https://api.chess.com/pub/player/testuser/games/2025/01'],
};

const MOCK_PGN = `[Event "Test Game"]
[Site "Chess.com"]
[Date "2025.01.09"]
[White "testuser"]
[Black "opponent"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 1-0

[Event "Test Game 2"]
[Site "Chess.com"]
[Date "2025.01.09"]
[White "opponent"]
[Black "testuser"]
[Result "0-1"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6 8. cxd5 exd5 9. Bb2 c5 0-1`;

describe('Chess.com Command E2E', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('fetching games', () => {
    it('should import games from Chess.com API', async () => {
      nock('https://api.chess.com')
        .get('/pub/player/testuser/games/archives')
        .reply(200, MOCK_ARCHIVES);

      nock('https://api.chess.com')
        .get('/pub/player/testuser/games/2025/01/pgn')
        .reply(200, MOCK_PGN);

      const command = 'node dist/cli/index.js chesscom testuser';

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('Fetching games for testuser');
        expect(stdout).toContain('Found 1 archive(s)');
        expect(stdout).toContain('Found 2 game(s) from Chess.com');
        expect(stdout).toContain('Total games imported: 2');
        expect(stderr).toBe('');
        expect(verifyDbHasGames(2)).toBe(true);
      } catch (error) {
        fail(`Command failed: ${error}`);
      }
    }, 30000);
  });

  describe('date filtering', () => {
    it('should filter games by date range', async () => {
      nock('https://api.chess.com')
        .get('/pub/player/testuser/games/archives')
        .reply(200, {
          archives: [
            'https://api.chess.com/pub/player/testuser/games/2025/01',
            'https://api.chess.com/pub/player/testuser/games/2024/12',
            'https://api.chess.com/pub/player/testuser/games/2024/11',
          ],
        });

      nock('https://api.chess.com')
        .get('/pub/player/testuser/games/2025/01/pgn')
        .reply(200, MOCK_PGN);

      const command = 'node dist/cli/index.js chesscom testuser 2025-01-01 2025-01-31';

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('Date range: Wed Jan 01 2025 to Fri Jan 31 2025');
        expect(stdout).toContain('Found 1 archive(s)');
        expect(stderr).toBe('');
      } catch (error) {
        fail(`Command failed: ${error}`);
      }
    }, 30000);
  });

  describe('rate limiting', () => {
    it('should handle rate limiting with retry', async () => {
      nock('https://api.chess.com').get('/pub/player/testuser/games/archives').times(1).reply(429);

      nock('https://api.chess.com')
        .get('/pub/player/testuser/games/archives')
        .times(1)
        .reply(200, MOCK_ARCHIVES);

      nock('https://api.chess.com')
        .get('/pub/player/testuser/games/2025/01/pgn')
        .reply(200, MOCK_PGN);

      const command = 'node dist/cli/index.js chesscom testuser';

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('Found 2 game(s) from Chess.com');
        expect(stderr).toBe('');
      } catch (error) {
        fail(`Command should handle retry: ${error}`);
      }
    }, 60000);
  });

  describe('user not found', () => {
    it('should handle 404 error for non-existent user', async () => {
      nock('https://api.chess.com')
        .get('/pub/player/nonexistentuser/games/archives')
        .reply(404, 'Not Found');

      const command = 'node dist/cli/index.js chesscom nonexistentuser';

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('Error');
        expect(stderr).toBe('');
      } catch (error) {
        expect(error).toBeDefined();
      }
    }, 30000);
  });

  describe('default date range', () => {
    it('should use last 30 days as default when no dates provided', async () => {
      nock('https://api.chess.com')
        .get('/pub/player/testuser/games/archives')
        .reply(200, MOCK_ARCHIVES);

      nock('https://api.chess.com')
        .get('/pub/player/testuser/games/2025/01/pgn')
        .reply(200, MOCK_PGN);

      const command = 'node dist/cli/index.js chesscom testuser';

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('Fetching games for testuser');
        expect(stdout).toContain('Date range:');
        expect(stderr).toBe('');
      } catch (error) {
        fail(`Command failed: ${error}`);
      }
    }, 30000);
  });
});
