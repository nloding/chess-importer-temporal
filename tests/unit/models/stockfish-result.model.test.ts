import { StockfishResult, Continuation } from '../../../src/models/stockfish-result.model';

describe('StockfishResult', () => {
  describe('Type Validation', () => {
    it('should accept evaluation as number for centipawns', () => {
      const continuation: Continuation = {
        evaluation: 0.5,
        moves: ['e2e4', 'e7e5'],
      };

      const result: StockfishResult = {
        evaluation: 0.5,
        bestMove: 'e2e4',
        continuations: [continuation],
      };

      expect(typeof result.evaluation).toBe('number');
      expect(result.evaluation).toBe(0.5);
    });

    it('should accept evaluation as string for mate scores', () => {
      const continuation: Continuation = {
        evaluation: 'M3',
        moves: ['e2e4', 'e7e5'],
      };

      const result: StockfishResult = {
        evaluation: 'M3',
        bestMove: 'e2e4',
        continuations: [continuation],
      };

      expect(typeof result.evaluation).toBe('string');
      expect(result.evaluation).toBe('M3');
    });

    it('should accept bestMove as UCI notation string', () => {
      const result: StockfishResult = {
        evaluation: 0.5,
        bestMove: 'e2e4',
        continuations: [],
      };

      expect(typeof result.bestMove).toBe('string');
      expect(result.bestMove).toBe('e2e4');
    });

    it('should accept up to 3 continuations', () => {
      const continuation1: Continuation = {
        evaluation: 0.5,
        moves: ['e2e4', 'e7e5'],
      };

      const continuation2: Continuation = {
        evaluation: 0.3,
        moves: ['d2d4', 'd7d5'],
      };

      const continuation3: Continuation = {
        evaluation: 0.1,
        moves: ['g1f3', 'c7c6'],
      };

      const result: StockfishResult = {
        evaluation: 0.5,
        bestMove: 'e2e4',
        continuations: [continuation1, continuation2, continuation3],
      };

      expect(result.continuations).toHaveLength(3);
    });
  });

  describe('Continuation Type Validation', () => {
    it('should accept evaluation as number for centipawns', () => {
      const continuation: Continuation = {
        evaluation: 0.5,
        moves: ['e2e4'],
      };

      expect(typeof continuation.evaluation).toBe('number');
      expect(continuation.evaluation).toBe(0.5);
    });

    it('should accept evaluation as string for mate scores', () => {
      const continuation: Continuation = {
        evaluation: 'M3',
        moves: ['e2e4'],
      };

      expect(typeof continuation.evaluation).toBe('string');
      expect(continuation.evaluation).toBe('M3');
    });

    it('should accept moves as array of UCI notation strings', () => {
      const continuation: Continuation = {
        evaluation: 0.5,
        moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'],
      };

      expect(Array.isArray(continuation.moves)).toBe(true);
      expect(continuation.moves).toHaveLength(4);
      continuation.moves.forEach((move) => {
        expect(typeof move).toBe('string');
      });
    });

    it('should accept empty moves array', () => {
      const continuation: Continuation = {
        evaluation: 0.5,
        moves: [],
      };

      expect(continuation.moves).toHaveLength(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should represent a typical Stockfish analysis result', () => {
      const result: StockfishResult = {
        evaluation: 0.5,
        bestMove: 'e2e4',
        continuations: [
          {
            evaluation: 0.5,
            moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'],
          },
          {
            evaluation: 0.3,
            moves: ['d2d4', 'd7d5', 'c2c4', 'e7e6'],
          },
          {
            evaluation: 0.1,
            moves: ['g1f3', 'c7c6', 'e2e4', 'd7d5'],
          },
        ],
      };

      expect(result.evaluation).toBe(0.5);
      expect(result.bestMove).toBe('e2e4');
      expect(result.continuations).toHaveLength(3);
      expect(result.continuations[0].moves).toHaveLength(5);
    });

    it('should represent a mate in X position', () => {
      const result: StockfishResult = {
        evaluation: 'M3',
        bestMove: 'h5h6',
        continuations: [
          {
            evaluation: 'M3',
            moves: ['h5h6', 'g8h8', 'h6g7'],
          },
          {
            evaluation: 'M4',
            moves: ['h5h6', 'g8h8', 'h6f8', 'e8d7'],
          },
          {
            evaluation: 'M5',
            moves: ['h5h6', 'g8h8', 'h6f8', 'e8d7', 'f8d6'],
          },
        ],
      };

      expect(result.evaluation).toBe('M3');
      expect(typeof result.evaluation).toBe('string');
      expect(result.continuations[0].evaluation).toBe('M3');
    });

    it('should represent a negative evaluation (black advantage)', () => {
      const result: StockfishResult = {
        evaluation: -0.8,
        bestMove: 'd7d5',
        continuations: [
          {
            evaluation: -0.8,
            moves: ['d7d5', 'e2e4', 'd5e4'],
          },
          {
            evaluation: -0.6,
            moves: ['c7c5', 'e2e4', 'c5d4'],
          },
          {
            evaluation: -0.5,
            moves: ['g8f6', 'e2e4', 'e7e6'],
          },
        ],
      };

      expect(result.evaluation).toBeLessThan(0);
      expect(result.evaluation).toBe(-0.8);
    });

    it('should represent equal position', () => {
      const result: StockfishResult = {
        evaluation: 0,
        bestMove: 'e2e4',
        continuations: [
          {
            evaluation: 0,
            moves: ['e2e4', 'e7e5'],
          },
          {
            evaluation: 0.1,
            moves: ['d2d4', 'd7d5'],
          },
          {
            evaluation: -0.1,
            moves: ['g1f3', 'c7c6'],
          },
        ],
      };

      expect(result.evaluation).toBe(0);
    });
  });

  describe('Type Safety', () => {
    it('should enforce that evaluation is either number or string', () => {
      const result1: StockfishResult = {
        evaluation: 0.5,
        bestMove: 'e2e4',
        continuations: [],
      };

      const result2: StockfishResult = {
        evaluation: 'M3',
        bestMove: 'h5h6',
        continuations: [],
      };

      expect(result1.evaluation).toBe(0.5);
      expect(result2.evaluation).toBe('M3');
    });

    it('should enforce that moves are strings', () => {
      const continuation: Continuation = {
        evaluation: 0.5,
        moves: ['e2e4', 'e7e5', 'g1f3'],
      };

      continuation.moves.forEach((move) => {
        expect(typeof move).toBe('string');
      });
    });
  });
});
