import { DatabaseService } from '@/services/database.service';
import { Game } from '@/models/game.model';
import { Position } from '@/models/position.model';
import * as fs from 'fs';

describe('DatabaseService', () => {
  let db: DatabaseService;
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = `./test-db-${Date.now()}.db`;
    db = new DatabaseService(testDbPath);
    db.initialize();
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('insertGame', () => {
    it('should insert a game and return game_id', () => {
      const game: Game = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      const gameId = db.insertGame(game);

      expect(gameId).toBe(1);
    });

    it('should throw duplicate error for same PGN', () => {
      const game: Game = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      db.insertGame(game);

      expect(() => db.insertGame(game)).toThrow();
    });
  });

  describe('gameExists', () => {
    it('should return true for existing game', () => {
      const game: Game = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      db.insertGame(game);

      expect(db.gameExists(game.pgn)).toBe(true);
    });

    it('should return false for non-existing game', () => {
      expect(db.gameExists('non-existent pgn')).toBe(false);
    });
  });

  describe('insertPosition', () => {
    it('should insert a position and return position_id', () => {
      const game: Game = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: null,
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      const gameId = db.insertGame(game);

      const position: Position = {
        gameId,
        move: 0,
        turn: 'white',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
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

      const positionId = db.insertPosition(position);

      expect(positionId).toBe(1);
    });
  });

  describe('getGameById', () => {
    it('should return game by id', () => {
      const game: Game = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      db.insertGame(game);

      const retrievedGame = db.getGameById(1);

      expect(retrievedGame).toEqual(game);
    });

    it('should return null for non-existing game id', () => {
      const retrievedGame = db.getGameById(999);

      expect(retrievedGame).toBeNull();
    });
  });

  describe('getPositionsByGameId', () => {
    it('should return all positions for a game', () => {
      const game: Game = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: null,
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      const gameId = db.insertGame(game);

      const position: Position = {
        gameId,
        move: 0,
        turn: 'white',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
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

      const positions = db.getPositionsByGameId(gameId);

      expect(positions).toHaveLength(1);
      expect(positions[0].move).toBe(0);
    });

    it('should return empty array for non-existing game', () => {
      const positions = db.getPositionsByGameId(999);

      expect(positions).toEqual([]);
    });
  });

  describe('transaction', () => {
    it('should commit successful transaction', () => {
      const game: Game = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: null,
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      const result = db.transaction(() => {
        return db.insertGame(game);
      });

      expect(result).toBe(1);
      expect(db.gameExists(game.pgn)).toBe(true);
    });

    it('should rollback on transaction error', () => {
      const game: Game = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: null,
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      expect(() => {
        db.transaction(() => {
          db.insertGame(game);
          throw new Error('Intentional error');
        });
      }).toThrow();

      expect(db.gameExists(game.pgn)).toBe(false);
    });
  });

  describe('CASCADE delete', () => {
    it('should delete positions when game is deleted', () => {
      const game: Game = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: null,
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      const gameId = db.insertGame(game);

      const position: Position = {
        gameId,
        move: 0,
        turn: 'white',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
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

      const positionsBefore = db.getPositionsByGameId(gameId);
      expect(positionsBefore).toHaveLength(1);

      db.transaction(() => {
        const stmt = db['db'].prepare('DELETE FROM games WHERE game_id = ?');
        stmt.run(gameId);
      });

      const positionsAfter = db.getPositionsByGameId(gameId);
      expect(positionsAfter).toHaveLength(0);
    });
  });
});
