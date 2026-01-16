import { DatabaseService } from '../../services/database.service';
import { GameProcessorService } from '../../services/game-processor.service';
import { PgnParserService } from '../../services/pgn-parser.service';
import { StockfishService } from '../../services/stockfish.service';
import { ChessComApiClient } from '../../services/api.service';
import { logger } from '../../utils/logger.util';
import { parseFlexibleDate, getDefaultStartDate, isValidDateRange } from '../../utils/date.util';
import { handleCliError, ImportError, ValidationError } from '../utils/error-handler';

export async function handleChesscomCommand(
  username: string,
  startDateStr?: string,
  endDateStr?: string
): Promise<void> {
  try {
    if (!username || username.trim() === '') {
      handleCliError(new ValidationError('Username is required', [
        'Provide a Chess.com username',
        'Usage: chess-game-importer chesscom <username> [start-date] [end-date]',
      ]));
      process.exit(1);
    }

    const db = new DatabaseService();
    db.initialize();

    const stockfish = new StockfishService();
    await stockfish.initialize();

    const pgnParser = new PgnParserService();
    const gameProcessor = new GameProcessorService(db, pgnParser, stockfish);

    try {
      const startDate = parseFlexibleDate(startDateStr || '') || getDefaultStartDate();
      const endDate = parseFlexibleDate(endDateStr || '') || new Date();

      if (!isValidDateRange(startDate, endDate)) {
        handleCliError(new ValidationError('Start date must be before or equal to end date', [
          'Check that start date is before end date',
          'Example: chess-game-importer chesscom myuser 2024-01-01 2024-12-31',
        ]));
        process.exit(1);
      }

      logger.info(`Fetching games for ${username}`);
      logger.info(`Date range: ${startDate.toDateString()} to ${endDate.toDateString()}`);

      const apiClient = new ChessComApiClient();
      const pgn = await apiClient.fetchGames(username, startDate, endDate);

      if (!pgn) {
        logger.warning('No games found in the specified date range');
        return;
      }

      const games = pgnParser.parsePgnGames(pgn);
      logger.info(`Found ${games.length} game(s) from Chess.com`);

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (const game of games) {
        try {
          await gameProcessor.processGame(game);
          imported++;
        } catch (error) {
          if (error instanceof Error && error.message.includes('Duplicate game')) {
            skipped++;
          } else {
            logger.error(`Error processing game: ${error}`);
            errors++;
          }
        }
      }

      logger.info('\n--- Summary ---');
      logger.info(`Total games imported: ${imported}`);
      logger.info(`Total games skipped (duplicates): ${skipped}`);
      logger.info(`Total errors: ${errors}`);
    } catch (error) {
      if (error instanceof Error) {
        handleCliError(new ImportError(error.message, 'CHESSCOM_API_ERROR', [
          'Check that Chess.com username is correct',
          'Verify your network connection',
          'Chess.com may be rate limiting - try again later',
        ], { operation: 'import-chesscom', target: username }));
      }
      process.exit(1);
    } finally {
      stockfish.terminate();
    }
  } catch (error) {
    if (error instanceof Error) {
      handleCliError(error);
    }
    process.exit(1);
  }
}

