// eslint-disable-next-line @typescript-eslint/no-var-requires
// const stockfish = require('stockfish/src/stockfish-17.1-8e4d048.js');
import { StockfishResult, Continuation } from '../models/stockfish-result.model';
import {
  UCI,
  ISREADY,
  QUIT,
  MULTI_PV,
  HASH_SIZE,
  THREADS,
  ANALYSIS_DEPTH,
  GO_DEPTH,
  POSITION_PREFIX,
} from '../constants/stockfish.constants';
import { StockfishError, StockfishInitializationError } from '../errors/stockfish.error';
import { logger } from '../utils/logger.util';
import { initializeStockfish, StockfishEngine } from './stockfish-initializer.service';

interface AnalysisState {
  continuations: (Continuation | undefined)[];
  bestMove: string | null;
}

export class StockfishService {
  private engine: StockfishEngine | null;
  private isReady: boolean = false;
  private currentAnalysis: AnalysisState | null = null;
  private resolveAnalysis: ((result: StockfishResult) => void) | null = null;
  private rejectAnalysis: ((error: Error) => void) | null = null;

  constructor() {
    this.engine = null;
  }

  async initialize(): Promise<void> {
    this.engine = await initializeStockfish();
    
    if (!this.engine || !this.engine.sendCommand) {
      throw new StockfishInitializationError();
    }
    
    this.engine.listener = (line: string): void => {
      this.handleEngineMessage(line);
    };

    this.engine.sendCommand(UCI);
    this.engine.sendCommand(MULTI_PV);
    this.engine.sendCommand(HASH_SIZE);
    this.engine.sendCommand(THREADS);
    this.engine.sendCommand(ISREADY);
    console.log(UCI, MULTI_PV, HASH_SIZE, THREADS, ISREADY);

    this.isReady = true;
    logger.debug('Stockfish engine initialized');
    console.log('ready');
  }

  async analyzePosition(fen: string): Promise<StockfishResult> {
    if (!this.isReady) {
      throw new StockfishError('Engine not ready');
    }

    return new Promise((resolve, reject) => {
      this.currentAnalysis = {
        continuations: [undefined, undefined, undefined],
        bestMove: null,
      };
      this.resolveAnalysis = resolve;
      this.rejectAnalysis = reject;

      if (this.engine && this.engine.sendCommand) {
        this.engine.sendCommand(`${POSITION_PREFIX}${fen}`);
        this.engine.sendCommand(GO_DEPTH);
      }
    });
  }

  terminate(): void {
    if (this.engine && this.engine.sendCommand) {
      this.engine.sendCommand(QUIT);
      this.engine = null;
      this.isReady = false;
      logger.debug('Stockfish engine terminated');
    }
  }

  private handleEngineMessage(message: string): void {
    if (message.startsWith('bestmove')) {
      this.handleBestMove(message);
      return;
    }

    if (message.startsWith('info depth')) {
      this.parseInfoLine(message);
    }
  }

  private parseInfoLine(message: string): void {
    if (!this.currentAnalysis) {
      return;
    }

    const depthMatch = message.match(/depth (\d+)/);
    if (!depthMatch || parseInt(depthMatch[1], 10) < ANALYSIS_DEPTH) {
      return;
    }

    const multipvMatch = message.match(/multipv (\d+)/);
    const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
    const pvMatch = message.match(/pv (.+)/);

    if (multipvMatch && scoreMatch && pvMatch) {
      const multipv = parseInt(multipvMatch[1], 10);
      const scoreType = scoreMatch[1];
      const scoreValue = parseInt(scoreMatch[2], 10);
      const pvMoves = pvMatch[1].trim().split(/\s+/);

      let evaluation: number | string;
      if (scoreType === 'mate') {
        evaluation = `M${Math.abs(scoreValue)}`;
      } else {
        evaluation = scoreValue / 100;
      }

      this.currentAnalysis.continuations[multipv - 1] = {
        evaluation,
        moves: pvMoves,
      };
    }
  }

  private handleBestMove(message: string): void {
    if (!this.currentAnalysis || !this.resolveAnalysis) {
      if (this.rejectAnalysis) {
        this.rejectAnalysis(new Error("No current analysis available."));
        return;
      }
      return;
    }

    const parts = message.split(' ');
    const bestMove = parts[1];

    this.currentAnalysis.bestMove = bestMove;

    const result: StockfishResult = {
      evaluation: this.currentAnalysis.continuations[0]?.evaluation || 0,
      bestMove,
      continuations: this.currentAnalysis.continuations.filter(
        (c): c is Continuation => c !== undefined
      ),
    };

    this.resolveAnalysis(result);
    this.currentAnalysis = null;
    this.resolveAnalysis = null;
  }
}
