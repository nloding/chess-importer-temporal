import { PgnParserService } from '@/services/pgn-parser.service';
import { InvalidPgnError } from '@/errors/parsing.error';

describe('PgnParserService', () => {
  let parser: PgnParserService;

  beforeEach(() => {
    parser = new PgnParserService();
  });

  describe('parsePgn', () => {
    it('should parse simple game', () => {
      const pgn = '[Event "Test"]\n\n1. e4 e5 1-0';
      const game = parser.parsePgn(pgn);

      expect(game.result()).toBe('1-0');
    });

    it('should throw InvalidPgnError for invalid PGN', () => {
      const invalidPgn = 'not a pgn';

      expect(() => parser.parsePgn(invalidPgn)).toThrow(InvalidPgnError);
    });

    it('should throw InvalidPgnError for empty PGN', () => {
      const emptyPgn = '';

      expect(() => parser.parsePgn(emptyPgn)).toThrow(InvalidPgnError);
    });
  });

  describe('extractGameMetadata', () => {
    it('should extract all metadata from game', () => {
      const pgn =
        '[Event "Test Tournament"]\n[White "Magnus Carlsen"]\n[Black "Hikaru Nakamura"]\n[Result "1-0"]\n\n1. e4 e5 1-0';
      const game = parser.parsePgn(pgn);
      const metadata = parser.extractGameMetadata(game);

      expect(metadata.whitePlayer).toBe('Magnus Carlsen');
      expect(metadata.blackPlayer).toBe('Hikaru Nakamura');
      expect(metadata.winner).toBe('Magnus Carlsen');
      expect(metadata.tournament).toBe('Test Tournament');
      expect(metadata.pgn).toContain('1. e4 e5 1-0');
    });

    it('should handle game with white winning', () => {
      const pgn = '[White "Alice"]\n[Black "Bob"]\n[Result "1-0"]\n\n1. e4 e5 1-0';
      const game = parser.parsePgn(pgn);
      const metadata = parser.extractGameMetadata(game);

      expect(metadata.winner).toBe('Alice');
    });

    it('should handle game with black winning', () => {
      const pgn = '[White "Alice"]\n[Black "Bob"]\n[Result "0-1"]\n\n1. e4 e5 0-1';
      const game = parser.parsePgn(pgn);
      const metadata = parser.extractGameMetadata(game);

      expect(metadata.winner).toBe('Bob');
    });

    it('should handle draw', () => {
      const pgn = '[White "Alice"]\n[Black "Bob"]\n[Result "1/2-1/2"]\n\n1. e4 e5 1/2-1/2';
      const game = parser.parsePgn(pgn);
      const metadata = parser.extractGameMetadata(game);

      expect(metadata.winner).toBe('DRAW');
    });

    it('should handle game without event/tournament', () => {
      const pgn = '[White "Alice"]\n[Black "Bob"]\n[Result "1-0"]\n\n1. e4 e5 1-0';
      const game = parser.parsePgn(pgn);
      const metadata = parser.extractGameMetadata(game);

      expect(metadata.tournament).toBeNull();
    });

    it('should handle unknown player names', () => {
      const pgn = '[Result "1-0"]\n\n1. e4 e5 1-0';
      const game = parser.parsePgn(pgn);
      const metadata = parser.extractGameMetadata(game);

      expect(metadata.whitePlayer).toBe('Unknown');
      expect(metadata.blackPlayer).toBe('Unknown');
    });
  });

  describe('extractPositions', () => {
    it('should extract all positions including initial', () => {
      const pgn = '[Event "Test"]\n\n1. e4 e5 2. Nf3 Nc6';
      const game = parser.parsePgn(pgn);
      const positions = parser.extractPositions(game);

      expect(positions.length).toBe(5);
      expect(positions[0].moveNumber).toBe(0);
      expect(positions[0].fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(positions[0].turn).toBe('white');
    });

    it('should handle game with no moves', () => {
      const pgn = '[Result "*"]\n\n*';
      const game = parser.parsePgn(pgn);
      const positions = parser.extractPositions(game);

      expect(positions).toHaveLength(1);
      expect(positions[0].moveNumber).toBe(0);
    });

    it('should handle all move types', () => {
      const pgn = '[Event "Test"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6';
      const game = parser.parsePgn(pgn);
      const positions = parser.extractPositions(game);

      expect(positions).toHaveLength(7);
      expect(positions[1].moveNumber).toBe(1);
      expect(positions[1].turn).toBe('white');
    });
  });

  describe('parsePgnFile', () => {
    it('should handle file reading errors gracefully', () => {
      const invalidPath = '/path/to/nonexistent/file.pgn';

      expect(() => parser.parsePgnFile(invalidPath)).toThrow();
    });
  });
});
