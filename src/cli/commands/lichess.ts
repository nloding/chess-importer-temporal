import { DatabaseService } from '../../services/database.service';
import { GameProcessorService } from '../../services/game-processor.service';
import { PgnParserService } from '../../services/pgn-parser.service';
import { StockfishService } from '../../services/stockfish.service';
import { LichessApiClient } from '../../services/api.service';
import { logger } from '../../utils/logger.util';
import { parseFlexibleDate, getDefaultStartDate, isValidDateRange } from '../../utils/date.util';
import { Game } from 'kokopu';

export async function handleLichessCommand(
  username: string,
  startDateStr?: string,
  endDateStr?: string
): Promise<void> {
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
      logger.error('Start date must be before or equal to end date');
      process.exit(1);
    }

    logger.info(`Fetching games for ${username}`);
    logger.info(`Date range: ${startDate.toDateString()} to ${endDate.toDateString()}`);

    const apiClient = new LichessApiClient();
    const pgn = await apiClient.fetchGames(username, startDate, endDate);

    if (!pgn) {
      logger.warning('No games found in the specified date range');
      return;
    }

    const games = parsePgnGames(pgn);
    logger.info(`Found ${games.length} game(s) from Lichess`);

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
    logger.error(`Error: ${error}`);
    process.exit(1);
  } finally {
    stockfish.terminate();
  }
}

function parsePgnGames(pgnContent: string): Game[] {
  const { pgnRead } = require('kokopu');
  const database = pgnRead(pgnContent);

  const games: Game[] = [];
  for (let i = 0; i < database.gameCount(); i++) {
    games.push(database.game(i));
  }

  return games;
}
