import { AppError } from './base.error';

export class StockfishError extends AppError {
  constructor(message: string) {
    super(message, 'STOCKFISH_ERROR');
  }
}

export class StockfishInitializationError extends StockfishError {
  constructor() {
    super('Failed to initialize Stockfish engine');
  }
}

export class StockfishAnalysisError extends StockfishError {
  constructor(fen: string) {
    super(`Failed to analyze position: ${fen}`);
  }
}
