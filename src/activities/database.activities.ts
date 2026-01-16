import { DatabaseService } from '../services/database.service';
import { log } from '@temporalio/activity';
import type {
  InsertGameArgs,
  InsertPositionArgs,
  GameExistsArgs,
} from './types';

let dbInstance: DatabaseService | null = null;

export function getDatabaseService(): DatabaseService {
  if (!dbInstance) {
    log.info('Initializing DatabaseService singleton');
    dbInstance = new DatabaseService();
    dbInstance.initialize();
    log.info('DatabaseService initialized successfully');
  }
  return dbInstance;
}

export async function insertGame(args: InsertGameArgs): Promise<number> {
  const db = getDatabaseService();
  log.info(`Inserting game: ${args.game.whitePlayer} vs ${args.game.blackPlayer}`);
  const gameId = db.insertGame(args.game);
  log.info(`Game inserted with ID: ${gameId}`);
  return gameId;
}

export async function insertPosition(args: InsertPositionArgs): Promise<number> {
  const db = getDatabaseService();
  log.debug(`Inserting position for game ${args.position.gameId}, move ${args.position.move}`);
  const positionId = db.insertPosition(args.position);
  return positionId;
}

export async function gameExists(args: GameExistsArgs): Promise<boolean> {
  const db = getDatabaseService();
  const exists = db.gameExists(args.pgn);
  if (exists) {
    log.info(`Duplicate game detected (PGN hash match)`);
  }
  return exists;
}
