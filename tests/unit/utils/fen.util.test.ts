import { FenUtil } from '../../../src/utils/fen.util';

describe('FenUtil', () => {
  describe('extractBoard', () => {
    it('should extract board placement from full FEN', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const board = FenUtil.extractBoard(fen);
      expect(board).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    });

    it('should extract board from FEN with castling rights', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const board = FenUtil.extractBoard(fen);
      expect(board).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    });

    it('should handle FEN with en passant square', () => {
      const fen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';
      const board = FenUtil.extractBoard(fen);
      expect(board).toBe('rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R');
    });
  });

  describe('isValid', () => {
    it('should return true for valid starting position FEN', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      expect(FenUtil.isValid(fen)).toBe(true);
    });

    it('should return true for valid midgame FEN', () => {
      const fen = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3';
      expect(FenUtil.isValid(fen)).toBe(true);
    });

    it('should return false for FEN with missing parts', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq';
      expect(FenUtil.isValid(fen)).toBe(false);
    });

    it('should return false for FEN with invalid pieces', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNX w KQkq - 0 1';
      expect(FenUtil.isValid(fen)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(FenUtil.isValid('')).toBe(false);
    });

    it('should return false for FEN with invalid characters in placement', () => {
      expect(FenUtil.isValid('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN! w KQkq - 0 1')).toBe(
        false
      );
    });
  });

  describe('fenToBoard', () => {
    it('should convert starting position to visual board', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const board = FenUtil.fenToBoard(fen);
      expect(board).toHaveLength(8);
      expect(board[0]).toBe('rnbqkbnr');
      expect(board[7]).toBe('RNBQKBNR');
    });

    it('should replace numbers with spaces', () => {
      const fen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 3 3';
      const board = FenUtil.fenToBoard(fen);
      expect(board[1]).toBe('pp ppppp');
      expect(board[2]).toBe('        ');
      expect(board[3]).toBe('  p     ');
    });

    it('should handle multiple empty squares', () => {
      const fen = '8/8/8/8/8/8/8/8 w - - 0 1';
      const board = FenUtil.fenToBoard(fen);
      expect(board[0]).toBe('        ');
      expect(board).toHaveLength(8);
    });

    it('should handle mixed empty and occupied squares', () => {
      const fen = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1';
      const board = FenUtil.fenToBoard(fen);
      expect(board[0]).toBe('r   k  r');
      expect(board[7]).toBe('R   K  R');
    });
  });
});
