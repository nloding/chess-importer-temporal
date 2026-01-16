import { proxyActivities, defineSignal, setHandler, log } from '@temporalio/workflow';
import type * as activities from '../activities';
import type { ParsePgnGamesResult } from '../activities/types';
import { parseFenToBoardState } from '../utils';
import { Square } from '../models/position.model';

export const cancelAnalysisSignal = defineSignal<[string]>('cancel-analysis');

const {
  gameExists,
  insertGame,
  insertPosition,
  extractPositionsFromPgn,
  analyzePosition,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export interface ProcessGameArgs {
  game: ParsePgnGamesResult[number];
}

function createCompleteBoardState(partial: Partial<Record<Square, string>>): Record<Square, string | null> {
  const complete: Record<Square, string | null> = {} as Record<Square, string | null>;

  const squares: Square[] = [
    'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8',
    'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8',
    'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
    'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8',
    'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8',
    'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8',
  ];

  for (const square of squares) {
    complete[square] = partial[square] ?? null;
  }

  return complete;
}

export async function processGame(args: ProcessGameArgs): Promise<void> {
  let shouldCancel = false;

  setHandler(cancelAnalysisSignal, (reason) => {
    log.warn(`Analysis cancellation requested: ${reason}`);
    shouldCancel = true;
  });

  const { whitePlayer, blackPlayer, result, event, fullPgn } = args.game;

  let winner: string;
  if (result === '1-0') winner = whitePlayer;
  else if (result === '0-1') winner = blackPlayer;
  else winner = 'DRAW';

  const gameData = {
    whitePlayer,
    blackPlayer,
    winner,
    tournament: event,
    pgn: fullPgn,
  };

  const exists = await gameExists({ pgn: gameData.pgn });
  if (exists) {
    log.warn(`Duplicate game skipped: ${whitePlayer} - ${blackPlayer}`);
    return;
  }

  const gameId = await insertGame({ game: gameData });
  log.info(`Game ${whitePlayer} - ${blackPlayer} inserted (ID: ${gameId})`);

  const positions = await extractPositionsFromPgn({ gamePgn: fullPgn });
  log.info(`Found ${positions.length} positions to analyze`);

  for (const position of positions) {
    if (shouldCancel) {
      log.info('Cancelling remaining position analysis due to signal');
      break;
    }

    log.info(`Analyzing FEN: ${position.fen.substring(0, 40)}... (move ${position.moveNumber})`);

    const analysis = await analyzePosition({ fen: position.fen });
    const boardState = parseFenToBoardState(position.fen);
    const completeBoardState = createCompleteBoardState(boardState);

    const positionRecord = {
      gameId,
      move: position.moveNumber,
      turn: position.turn,
      fen: position.fen,
      evaluation: analysis.evaluation,
      bestMove: analysis.bestMove,
      continuations: JSON.stringify(analysis.continuations),
      ...completeBoardState,
    };

    await insertPosition({ position: positionRecord });
  }

  log.info(`Game imported successfully`);
}
