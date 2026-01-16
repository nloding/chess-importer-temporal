import { StockfishService } from '../services/stockfish.service';
import { log } from '@temporalio/activity';
import type {
  AnalyzePositionArgs,
  AnalyzePositionResult,
} from './types';

interface QueuedRequest {
  fen: string;
  resolve: (result: AnalyzePositionResult) => void;
  reject: (error: Error) => void;
}

class StockfishQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private stockfish: StockfishService | null = null;

  async analyzePosition(fen: string): Promise<AnalyzePositionResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fen, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const { fen, resolve, reject } = this.queue.shift()!;

    try {
      const stockfish = await this.getStockfishService();
      log.info(`Analyzing position: ${fen.substring(0, 40)}... (queue size: ${this.queue.length})`);
      const result = await stockfish.analyzePosition(fen);
      log.debug(`Analysis complete: eval=${result.evaluation}, best=${result.bestMove}`);
      resolve(result);
    } catch (err) {
      log.error(`Stockfish analysis failed: ${err}`);
      reject(err as Error);
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }

  private async getStockfishService(): Promise<StockfishService> {
    if (!this.stockfish) {
      log.info('Initializing Stockfish engine (queue-managed singleton)');
      this.stockfish = new StockfishService();
      await this.stockfish.initialize();
      log.info('Stockfish engine initialized successfully');
    }
    return this.stockfish;
  }

  async terminate(): Promise<void> {
    if (this.stockfish) {
      this.stockfish.terminate();
      this.stockfish = null;
      log.info('Stockfish engine terminated');
    }
  }
}

const stockfishQueue = new StockfishQueue();

export async function analyzePosition(args: AnalyzePositionArgs): Promise<AnalyzePositionResult> {
  return await stockfishQueue.analyzePosition(args.fen);
}

export async function terminateStockfish(): Promise<void> {
  await stockfishQueue.terminate();
}
