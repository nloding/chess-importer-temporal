import * as fs from 'fs';
import * as path from 'path';
import { Game } from 'kokopu';
import { DatabaseService } from '../../services/database.service';
import { GameProcessorService } from '../../services/game-processor.service';
import { PgnParserService } from '../../services/pgn-parser.service';
import { StockfishService } from '../../services/stockfish.service';
import { logger } from '../../utils/logger.util';

export async function handlePgnCommand(targetPath: string): Promise<void> {
  const db = new DatabaseService();
  db.initialize();

  const stockfish = new StockfishService();
  await stockfish.initialize();

  const pgnParser = new PgnParserService();
  const gameProcessor = new GameProcessorService(db, pgnParser, stockfish);

  try {
    const stats = await processPath(targetPath, gameProcessor);

    logger.info('\n--- Summary ---');
    logger.info(`Total games imported: ${stats.imported}`);
    logger.info(`Total games skipped (duplicates): ${stats.skipped}`);
    logger.info(`Total errors: ${stats.errors}`);
  } catch (error) {
    logger.error(`Error: ${error}`);
    process.exit(1);
  } finally {
    stockfish.terminate();
  }
}

interface ImportStats {
  imported: number;
  skipped: number;
  errors: number;
}

async function processPath(
  targetPath: string,
  gameProcessor: GameProcessorService
): Promise<ImportStats> {
  const stats: ImportStats = {
    imported: 0,
    skipped: 0,
    errors: 0,
  };

  const resolvedPath = path.resolve(targetPath);

  if (!fs.existsSync(resolvedPath)) {
    logger.error(`Path does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  const stat = fs.statSync(resolvedPath);

  if (stat.isFile()) {
    if (resolvedPath.endsWith('.pgn')) {
      logger.info(`Processing file: ${resolvedPath}`);
      await processPgnFile(resolvedPath, gameProcessor, stats);
    } else {
      logger.error(`File must be a .pgn file: ${resolvedPath}`);
      process.exit(1);
    }
  } else if (stat.isDirectory()) {
    logger.info(`Scanning directory: ${resolvedPath}`);
    await processDirectory(resolvedPath, gameProcessor, stats);
  } else {
    logger.error(`Path is neither a file nor directory: ${resolvedPath}`);
    process.exit(1);
  }

  return stats;
}

async function processDirectory(
  dirPath: string,
  gameProcessor: GameProcessorService,
  stats: ImportStats
): Promise<void> {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await processDirectory(filePath, gameProcessor, stats);
    } else if (file.endsWith('.pgn')) {
      logger.info(`Processing file: ${filePath}`);
      await processPgnFile(filePath, gameProcessor, stats);
    }
  }
}

async function processPgnFile(
  filePath: string,
  gameProcessor: GameProcessorService,
  stats: ImportStats
): Promise<void> {
  try {
    const pgnContent = fs.readFileSync(filePath, 'utf8');
    const games = parsePgnGames(pgnContent);

    logger.info(`Found ${games.length} game(s) in file`);

    for (const game of games) {
      try {
        await gameProcessor.processGame(game);
        stats.imported++;
      } catch (error) {
        if (error instanceof Error && error.message.includes('Duplicate game')) {
          stats.skipped++;
        } else {
          logger.error(`Error processing game: ${error}`);
          stats.errors++;
        }
      }
    }
  } catch (error) {
    logger.error(`Error reading PGN file ${filePath}: ${error}`);
    stats.errors++;
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
