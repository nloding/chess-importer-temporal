export interface StockfishResult {
  evaluation: number | string;
  bestMove: string;
  continuations: Continuation[];
}

export interface Continuation {
  evaluation: number | string;
  moves: string[];
}
