import { GameProcessorService } from '../../../src/services/game-processor.service';
import { DatabaseService } from '../../../src/services/database.service';
import { PgnParserService } from '../../../src/services/pgn-parser.service';
import { Game } from 'kokopu';

describe('GameProcessorService', () => {
  let gameProcessor: GameProcessorService;
  let mockDb: jest.Mocked<DatabaseService>;
  let mockParser: jest.Mocked<PgnParserService>;
  let mockStockfish: any;

  beforeEach(() => {
    mockDb = {
      insertGame: jest.fn().mockReturnValue(1),
      gameExists: jest.fn().mockReturnValue(false),
      insertPosition: jest.fn().mockReturnValue(1),
    } as any;

    mockParser = {
      extractGameMetadata: jest.fn(),
      extractPositions: jest.fn(),
      parsePgn: jest.fn(),
    } as any;

    mockStockfish = {
      analyzePosition: jest.fn().mockResolvedValue({
        evaluation: 0.5,
        bestMove: 'e2e4',
        continuations: [{ evaluation: 0.5, moves: ['e2e4', 'e7e5'] }],
      }),
    };

    gameProcessor = new GameProcessorService(mockDb, mockParser, mockStockfish);
  });

  describe('processGame', () => {
    it('should extract metadata and insert game', async () => {
      const mockGame = {} as Game;
      const metadata = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      mockParser.extractGameMetadata.mockReturnValue(metadata);
      mockParser.extractPositions.mockReturnValue([]);

      await gameProcessor.processGame(mockGame);

      expect(mockParser.extractGameMetadata).toHaveBeenCalledWith(mockGame);
      expect(mockDb.insertGame).toHaveBeenCalledWith(metadata);
    });

    it('should skip duplicate games', async () => {
      const mockGame = {} as Game;
      const metadata = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      mockParser.extractGameMetadata.mockReturnValue(metadata);
      mockDb.gameExists.mockReturnValue(true);

      await gameProcessor.processGame(mockGame);

      expect(mockDb.gameExists).toHaveBeenCalledWith(metadata.pgn);
      expect(mockDb.insertGame).not.toHaveBeenCalled();
      expect(mockStockfish.analyzePosition).not.toHaveBeenCalled();
    });

    it('should extract and analyze all positions', async () => {
      const mockGame = {} as Game;
      const metadata = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      const positions = [
        {
          moveNumber: 0,
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          turn: 'white' as const,
        },
        {
          moveNumber: 1,
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          turn: 'black' as const,
        },
      ];

      mockParser.extractGameMetadata.mockReturnValue(metadata);
      mockParser.extractPositions.mockReturnValue(positions);
      mockStockfish.analyzePosition.mockResolvedValue({
        evaluation: 0.5,
        bestMove: 'e2e4',
        continuations: [{ evaluation: 0.5, moves: ['e2e4'] }],
      });

      await gameProcessor.processGame(mockGame);

      expect(mockParser.extractPositions).toHaveBeenCalledWith(mockGame);
      expect(mockStockfish.analyzePosition).toHaveBeenCalledTimes(2);
      expect(mockStockfish.analyzePosition).toHaveBeenNthCalledWith(1, positions[0].fen);
      expect(mockStockfish.analyzePosition).toHaveBeenNthCalledWith(2, positions[1].fen);
    });

    it('should insert positions with board state', async () => {
      const mockGame = {} as Game;
      const metadata = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      const positions = [
        {
          moveNumber: 0,
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          turn: 'white' as const,
        },
      ];

      mockParser.extractGameMetadata.mockReturnValue(metadata);
      mockParser.extractPositions.mockReturnValue(positions);

      await gameProcessor.processGame(mockGame);

      expect(mockDb.insertPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: 1,
          move: 0,
          turn: 'white',
          fen: positions[0].fen,
          evaluation: 0.5,
          bestMove: 'e2e4',
          continuations: JSON.stringify([{ evaluation: 0.5, moves: ['e2e4', 'e7e5'] }]),
        })
      );
    });
  });

  describe('processGameFromPgn', () => {
    it('should parse PGN and process game', async () => {
      const pgn = '[Event "Test"]\n\n1. e4 e5 1-0';
      const mockGame = {} as Game;
      const metadata = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn,
      };

      mockParser.parsePgn.mockReturnValue(mockGame);
      mockParser.extractGameMetadata.mockReturnValue(metadata);
      mockParser.extractPositions.mockReturnValue([]);

      await gameProcessor.processGameFromPgn(pgn);

      expect(mockParser.parsePgn).toHaveBeenCalledWith(pgn);
      expect(mockDb.insertGame).toHaveBeenCalledWith(metadata);
    });

    it('should handle parse errors gracefully', async () => {
      const pgn = '[Event "Test"]\n\n1. e4 e5 1-0';
      mockParser.parsePgn.mockImplementation(() => {
        throw new Error('Invalid PGN');
      });

      await expect(gameProcessor.processGameFromPgn(pgn)).rejects.toThrow('Invalid PGN');
    });
  });

  describe('processPosition', () => {
    it('should analyze position with Stockfish', async () => {
      const mockGame = {} as Game;
      const metadata = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      const positions = [
        {
          moveNumber: 0,
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          turn: 'white' as const,
        },
      ];

      mockParser.extractGameMetadata.mockReturnValue(metadata);
      mockParser.extractPositions.mockReturnValue(positions);

      await gameProcessor.processGame(mockGame);

      expect(mockStockfish.analyzePosition).toHaveBeenCalledWith(positions[0].fen);
    });

    it('should handle Stockfish analysis errors', async () => {
      const mockGame = {} as Game;
      const metadata = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      const positions = [
        {
          moveNumber: 0,
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          turn: 'white' as const,
        },
      ];

      mockParser.extractGameMetadata.mockReturnValue(metadata);
      mockParser.extractPositions.mockReturnValue(positions);
      mockStockfish.analyzePosition.mockRejectedValue(new Error('Stockfish error'));

      await gameProcessor.processGame(mockGame);

      expect(mockDb.insertPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          evaluation: 0,
          bestMove: '',
          continuations: '[]',
        })
      );
    });

    it('should extract board state from FEN', async () => {
      const mockGame = {} as Game;
      const metadata = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      const positions = [
        {
          moveNumber: 0,
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          turn: 'white' as const,
        },
      ];

      mockParser.extractGameMetadata.mockReturnValue(metadata);
      mockParser.extractPositions.mockReturnValue(positions);

      await gameProcessor.processGame(mockGame);

      expect(mockDb.insertPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: 1,
          move: 0,
          turn: 'white',
          fen: positions[0].fen,
          evaluation: 0.5,
          bestMove: 'e2e4',
          continuations: JSON.stringify([{ evaluation: 0.5, moves: ['e2e4', 'e7e5'] }]),
        })
      );
    });
  });

  describe('sequential processing', () => {
    it('should process positions sequentially', async () => {
      const mockGame = {} as Game;
      const metadata = {
        whitePlayer: 'Magnus Carlsen',
        blackPlayer: 'Hikaru Nakamura',
        winner: 'Magnus Carlsen',
        tournament: 'World Championship',
        pgn: '[Event "Test"]\n\n1. e4 e5 1-0',
      };

      const positions = [
        {
          moveNumber: 0,
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          turn: 'white' as const,
        },
        {
          moveNumber: 1,
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          turn: 'black' as const,
        },
        {
          moveNumber: 2,
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
          turn: 'white' as const,
        },
      ];

      mockParser.extractGameMetadata.mockReturnValue(metadata);
      mockParser.extractPositions.mockReturnValue(positions);

      const analysisPromises: string[] = [];
      mockStockfish.analyzePosition.mockImplementation(
        (fen: string) =>
          new Promise((resolve) => {
            analysisPromises.push(fen);
            setTimeout(() => {
              resolve({
                evaluation: 0.5,
                bestMove: 'e2e4',
                continuations: [{ evaluation: 0.5, moves: ['e2e4'] }],
              });
            }, 10);
          })
      );

      await gameProcessor.processGame(mockGame);

      expect(analysisPromises).toEqual([positions[0].fen, positions[1].fen, positions[2].fen]);
    });
  });
});
