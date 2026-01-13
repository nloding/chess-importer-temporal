import { DatabaseService } from '@/services/database.service';
import { PgnParserService } from '@/services/pgn-parser.service';
import { Position } from '@/models/position.model';
import * as fs from 'fs';

describe('PGN Import Integration', () => {
  let db: DatabaseService;
  let parser: PgnParserService;
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = `./test-integration-${Date.now()}.db`;
    db = new DatabaseService(testDbPath);
    db.initialize();
    parser = new PgnParserService();
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Full PGN Import Workflow', () => {
    it('should import complete game with all positions', () => {
      const pgn =
        '[Event "Test"]\n[White "Alice"]\n[Black "Bob"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6';
      const game = parser.parsePgn(pgn);
      const metadata = parser.extractGameMetadata(game);

      const gameId = db.insertGame(metadata);
      expect(gameId).toBe(1);

      const positions = parser.extractPositions(game);
      expect(positions.length).toBeGreaterThan(0);

      for (const posInfo of positions) {
        const position: Position = {
          gameId,
          move: posInfo.moveNumber,
          turn: posInfo.turn,
          fen: posInfo.fen,
          evaluation: 0.5,
          bestMove: 'e2e4',
          continuations: '[]',
          A1: 'R',
          A2: 'P',
          A3: null,
          A4: null,
          A5: null,
          A6: null,
          A7: 'p',
          A8: 'r',
          B1: 'N',
          B2: 'P',
          B3: null,
          B4: null,
          B5: null,
          B6: null,
          B7: 'p',
          B8: 'n',
          C1: 'B',
          C2: 'P',
          C3: null,
          C4: null,
          C5: null,
          C6: null,
          C7: 'p',
          C8: 'b',
          D1: 'Q',
          D2: 'P',
          D3: null,
          D4: null,
          D5: null,
          D6: null,
          D7: 'p',
          D8: 'q',
          E1: 'K',
          E2: 'P',
          E3: null,
          E4: null,
          E5: null,
          E6: null,
          E7: 'p',
          E8: 'k',
          F1: 'B',
          F2: 'P',
          F3: null,
          F4: null,
          F5: null,
          F6: null,
          F7: 'p',
          F8: 'b',
          G1: 'N',
          G2: 'P',
          G3: null,
          G4: null,
          G5: null,
          G6: null,
          G7: 'p',
          G8: 'n',
          H1: 'R',
          H2: 'P',
          H3: null,
          H4: null,
          H5: null,
          H6: null,
          H7: 'p',
          H8: 'r',
        };
        db.insertPosition(position);
      }

      const retrievedGame = db.getGameById(gameId);
      expect(retrievedGame).toBeDefined();
      expect(retrievedGame?.whitePlayer).toBe('Alice');
      expect(retrievedGame?.blackPlayer).toBe('Bob');

      const retrievedPositions = db.getPositionsByGameId(gameId);
      expect(retrievedPositions.length).toBe(positions.length);
    });

    it('should handle duplicate detection', () => {
      const pgn = '[Event "Test"]\n[Result "1-0"]\n\n1. e4 e5 1-0';
      const game = parser.parsePgn(pgn);
      const metadata = parser.extractGameMetadata(game);

      const gameId1 = db.insertGame(metadata);
      expect(gameId1).toBe(1);

      expect(db.gameExists(metadata.pgn)).toBe(true);

      expect(() => db.insertGame(metadata)).toThrow();
    });
  });

  describe('Database Transaction Integrity', () => {
    it('should rollback on error during multi-step operation', () => {
      const pgn = '[Event "Test"]\n[Result "1-0"]\n\n1. e4 e5 1-0';
      const game = parser.parsePgn(pgn);
      const metadata = parser.extractGameMetadata(game);

      expect(() => {
        db.transaction(() => {
          db.insertGame(metadata);
          throw new Error('Simulated error');
        });
      }).toThrow();

      expect(db.gameExists(metadata.pgn)).toBe(false);
    });

    it('should commit successful transaction', () => {
      const pgn1 = '[Event "Test1"]\n[Result "1-0"]\n\n1. e4 e5 1-0';
      const game1 = parser.parsePgn(pgn1);
      const metadata1 = parser.extractGameMetadata(game1);

      const pgn2 = '[Event "Test2"]\n[Result "1-0"]\n\n1. e4 e5 1-0';
      const game2 = parser.parsePgn(pgn2);
      const metadata2 = parser.extractGameMetadata(game2);

      const ids = db.transaction(() => {
        const id1 = db.insertGame(metadata1);
        const id2 = db.insertGame(metadata2);
        return [id1, id2];
      });

      expect(ids).toEqual([1, 2]);
      expect(db.gameExists(metadata1.pgn)).toBe(true);
      expect(db.gameExists(metadata2.pgn)).toBe(true);
    });
  });

  describe('Database-Parser Integration', () => {
    it('should correctly map PGN game to database records', () => {
      const pgn =
        '[Event "Tournament"]\n[White "Player1"]\n[Black "Player2"]\n[Result "1/2-1/2"]\n\n1. d4 d5 2. Nf3 Nf6';
      const game = parser.parsePgn(pgn);
      const metadata = parser.extractGameMetadata(game);

      const gameId = db.insertGame(metadata);
      expect(gameId).toBe(1);

      const retrievedGame = db.getGameById(gameId);
      expect(retrievedGame?.tournament).toBe('Tournament');
      expect(retrievedGame?.winner).toBe('DRAW');
      expect(retrievedGame?.pgn).toContain('[Event "Tournament"]');
    });
  });

  describe('Position-Board Mapping', () => {
    it('should correctly store board state from FEN', () => {
      const pgn = '[Event "Test"]\n[Result "*"]\n\n*';
      const game = parser.parsePgn(pgn);
      const metadata = parser.extractGameMetadata(game);

      const gameId = db.insertGame(metadata);
      const positions = parser.extractPositions(game);

      const initialPos = positions[0];
      const position: Position = {
        gameId,
        move: initialPos.moveNumber,
        turn: initialPos.turn,
        fen: initialPos.fen,
        evaluation: 0,
        bestMove: '',
        continuations: '[]',
        A1: 'R',
        A2: 'P',
        A3: null,
        A4: null,
        A5: null,
        A6: null,
        A7: 'p',
        A8: 'r',
        B1: 'N',
        B2: 'P',
        B3: null,
        B4: null,
        B5: null,
        B6: null,
        B7: 'p',
        B8: 'n',
        C1: 'B',
        C2: 'P',
        C3: null,
        C4: null,
        C5: null,
        C6: null,
        C7: 'p',
        C8: 'b',
        D1: 'Q',
        D2: 'P',
        D3: null,
        D4: null,
        D5: null,
        D6: null,
        D7: 'p',
        D8: 'q',
        E1: 'K',
        E2: 'P',
        E3: null,
        E4: null,
        E5: null,
        E6: null,
        E7: 'p',
        E8: 'k',
        F1: 'B',
        F2: 'P',
        F3: null,
        F4: null,
        F5: null,
        F6: null,
        F7: 'p',
        F8: 'b',
        G1: 'N',
        G2: 'P',
        G3: null,
        G4: null,
        G5: null,
        G6: null,
        G7: 'p',
        G8: 'n',
        H1: 'R',
        H2: 'P',
        H3: null,
        H4: null,
        H5: null,
        H6: null,
        H7: 'p',
        H8: 'r',
      };

      const positionId = db.insertPosition(position);
      expect(positionId).toBe(1);

      const retrievedPositions = db.getPositionsByGameId(gameId);
      expect(retrievedPositions).toHaveLength(1);
      expect(retrievedPositions[0].A1).toBe('R');
      expect(retrievedPositions[0].E4).toBeNull();
    });
  });
});
