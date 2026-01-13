import { Game } from 'kokopu';
import { Position } from '../models';
import { DatabaseService } from './database.service';
import { PgnParserService, PositionInfo } from './pgn-parser.service';
import { StockfishService } from './stockfish.service';
import { parseFenToBoardState } from '../utils';
import { logger } from '../utils/logger.util';

export class GameProcessorService {
  constructor(
    private db: DatabaseService,
    private pgnParser: PgnParserService,
    private stockfish: StockfishService
  ) {}

  async processGame(game: Game): Promise<void> {
    const metadata = this.pgnParser.extractGameMetadata(game);

    if (this.db.gameExists(metadata.pgn)) {
      logger.warning(`Duplicate game skipped: ${metadata.whitePlayer} - ${metadata.blackPlayer}`);
      return;
    }

    const gameId = this.db.insertGame(metadata);
    logger.info(`Game ${metadata.whitePlayer} - ${metadata.blackPlayer} inserted (ID: ${gameId})`);

    const positions = this.pgnParser.extractPositions(game);
    logger.debug(`Found ${positions.length} positions to analyze`);

    for (const position of positions) {
      await this.processPosition(gameId, position);
    }

    logger.success(`Game imported successfully: ${metadata.whitePlayer} - ${metadata.blackPlayer}`);
  }

  async processGameFromPgn(pgn: string): Promise<void> {
    const game = this.pgnParser.parsePgn(pgn);
    await this.processGame(game);
  }

  private async processPosition(gameId: number, positionInfo: PositionInfo): Promise<void> {
    logger.info(
      `Analyzing FEN: ${positionInfo.fen.substring(0, 40)}... (move ${positionInfo.moveNumber})`
    );

    let analysis;
    try {
      analysis = await this.stockfish.analyzePosition(positionInfo.fen);
      logger.debug(`  Stockfish: ${analysis.evaluation}, best: ${analysis.bestMove}`);
    } catch (error) {
      logger.error(`  Stockfish analysis failed for FEN: ${positionInfo.fen}`);
      analysis = {
        evaluation: 0,
        bestMove: '',
        continuations: [],
      };
    }

    const boardState = parseFenToBoardState(positionInfo.fen);

    const position: Position = {
      gameId,
      move: positionInfo.moveNumber,
      turn: positionInfo.turn,
      fen: positionInfo.fen,
      evaluation: analysis.evaluation,
      bestMove: analysis.bestMove,
      continuations: JSON.stringify(analysis.continuations),
      A1: boardState.A1 ?? null,
      A2: boardState.A2 ?? null,
      A3: boardState.A3 ?? null,
      A4: boardState.A4 ?? null,
      A5: boardState.A5 ?? null,
      A6: boardState.A6 ?? null,
      A7: boardState.A7 ?? null,
      A8: boardState.A8 ?? null,
      B1: boardState.B1 ?? null,
      B2: boardState.B2 ?? null,
      B3: boardState.B3 ?? null,
      B4: boardState.B4 ?? null,
      B5: boardState.B5 ?? null,
      B6: boardState.B6 ?? null,
      B7: boardState.B7 ?? null,
      B8: boardState.B8 ?? null,
      C1: boardState.C1 ?? null,
      C2: boardState.C2 ?? null,
      C3: boardState.C3 ?? null,
      C4: boardState.C4 ?? null,
      C5: boardState.C5 ?? null,
      C6: boardState.C6 ?? null,
      C7: boardState.C7 ?? null,
      C8: boardState.C8 ?? null,
      D1: boardState.D1 ?? null,
      D2: boardState.D2 ?? null,
      D3: boardState.D3 ?? null,
      D4: boardState.D4 ?? null,
      D5: boardState.D5 ?? null,
      D6: boardState.D6 ?? null,
      D7: boardState.D7 ?? null,
      D8: boardState.D8 ?? null,
      E1: boardState.E1 ?? null,
      E2: boardState.E2 ?? null,
      E3: boardState.E3 ?? null,
      E4: boardState.E4 ?? null,
      E5: boardState.E5 ?? null,
      E6: boardState.E6 ?? null,
      E7: boardState.E7 ?? null,
      E8: boardState.E8 ?? null,
      F1: boardState.F1 ?? null,
      F2: boardState.F2 ?? null,
      F3: boardState.F3 ?? null,
      F4: boardState.F4 ?? null,
      F5: boardState.F5 ?? null,
      F6: boardState.F6 ?? null,
      F7: boardState.F7 ?? null,
      F8: boardState.F8 ?? null,
      G1: boardState.G1 ?? null,
      G2: boardState.G2 ?? null,
      G3: boardState.G3 ?? null,
      G4: boardState.G4 ?? null,
      G5: boardState.G5 ?? null,
      G6: boardState.G6 ?? null,
      G7: boardState.G7 ?? null,
      G8: boardState.G8 ?? null,
      H1: boardState.H1 ?? null,
      H2: boardState.H2 ?? null,
      H3: boardState.H3 ?? null,
      H4: boardState.H4 ?? null,
      H5: boardState.H5 ?? null,
      H6: boardState.H6 ?? null,
      H7: boardState.H7 ?? null,
      H8: boardState.H8 ?? null,
    };

    this.db.insertPosition(position);
  }
}
