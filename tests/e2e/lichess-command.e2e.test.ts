import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import Database from 'better-sqlite3';
import nock from 'nock';

const execAsync = promisify(exec);

const TEST_DB_PATH = './test-e2e-lichess.db';

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

const MOCK_PGN = `[Event "Test Game"]
[Site "lichess.org"]
[Date "2025.01.09"]
[White "testuser"]
[Black "opponent"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 1-0

[Event "Test Game 2"]
[Site "lichess.org"]
[Date "2025.01.09"]
[White "opponent"]
[Black "testuser"]
[Result "0-1"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6 8. cxd5 exd5 9. Bb2 c5 0-1`;

describe('Lichess Command E2E', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('fetching games', () => {
    it('should import games from Lichess API', async () => {
      nock('https://lichess.org')
        .get(
          /\/api\/games\/user\/testuser\?since=.+&until=.+&clocks=false&evals=false&opening=false/
        )
        .reply(200, MOCK_PGN);

      const command = 'node dist/cli/index.js lichess testuser';

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('Fetching games for testuser');
        expect(stdout).toContain('Found 2 game(s) from Lichess');
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
      nock('https://lichess.org')
        .get(
          /\/api\/games\/user\/testuser\?since=1735689600000&until=1738281600000&clocks=false&evals=false&opening=false/
        )
        .reply(200, MOCK_PGN);

      const command = 'node dist/cli/index.js lichess testuser 2025-01-01 2025-01-31';

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('Date range: Wed Jan 01 2025 to Fri Jan 31 2025');
        expect(stdout).toContain('Found 2 game(s) from Lichess');
        expect(stderr).toBe('');
      } catch (error) {
        fail(`Command failed: ${error}`);
      }
    }, 30000);
  });

  describe('rate limiting', () => {
    it('should handle rate limiting with retry', async () => {
      nock('https://lichess.org')
        .get(/\/api\/games\/user\/testuser\?.+/)
        .times(1)
        .reply(429, 'Rate limit exceeded');

      nock('https://lichess.org')
        .get(/\/api\/games\/user\/testuser\?.+/)
        .times(1)
        .reply(200, MOCK_PGN);

      const command = 'node dist/cli/index.js lichess testuser';

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('Found 2 game(s) from Lichess');
        expect(stderr).toBe('');
      } catch (error) {
        fail(`Command should handle retry: ${error}`);
      }
    }, 60000);
  });

  describe('user not found', () => {
    it('should handle 404 error for non-existent user', async () => {
      nock('https://lichess.org')
        .get(/\/api\/games\/user\/nonexistentuser\?.+/)
        .reply(404, 'Not Found');

      const command = 'node dist/cli/index.js lichess nonexistentuser';

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
      nock('https://lichess.org')
        .get(/\/api\/games\/user\/testuser\?.+/)
        .reply(200, MOCK_PGN);

      const command = 'node dist/cli/index.js lichess testuser';

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

  describe('empty result', () => {
    it('should handle empty game list gracefully', async () => {
      nock('https://lichess.org')
        .get(/\/api\/games\/user\/testuser\?.+/)
        .reply(200, '');

      const command = 'node dist/cli/index.js lichess testuser';

      try {
        const { stdout, stderr } = await execAsync(command);
        expect(stdout).toContain('No games found in the specified date range');
        expect(stderr).toBe('');
      } catch (error) {
        fail(`Command should handle empty result: ${error}`);
      }
    }, 30000);
  });
});
