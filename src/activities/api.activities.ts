import { log, ApplicationFailure } from '@temporalio/activity';
import { ChessComApiClient, LichessApiClient } from '../services/api.service';
import type {
  FetchChessComGamesArgs,
  FetchLichessGamesArgs,
} from './types';

export async function fetchChessComGames(args: FetchChessComGamesArgs): Promise<string> {
  const { username, startDate, endDate } = args;
  log.info(`Fetching Chess.com games for ${username} (${startDate.toISOString()} to ${endDate.toISOString()})`);

  try {
    const apiClient = new ChessComApiClient();
    const pgn = await apiClient.fetchGames(username, startDate, endDate);
    log.info(`Successfully fetched ${pgn.length} bytes from Chess.com API`);
    return pgn;
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      throw ApplicationFailure.nonRetryable(`Chess.com user not found: ${username}`, 'UserNotFoundError', { username });
    }
    throw err;
  }
}

export async function fetchLichessGames(args: FetchLichessGamesArgs): Promise<string> {
  const { username, startDate, endDate } = args;
  log.info(`Fetching Lichess games for ${username} (${startDate.toISOString()} to ${endDate.toISOString()})`);

  try {
    const apiClient = new LichessApiClient();
    const pgn = await apiClient.fetchGames(username, startDate, endDate);
    log.info(`Successfully fetched ${pgn.length} bytes from Lichess API`);
    return pgn;
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      throw ApplicationFailure.nonRetryable(`Lichess user not found: ${username}`, 'UserNotFoundError', { username });
    }
    throw err;
  }
}
