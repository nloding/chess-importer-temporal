import Database from 'better-sqlite3';
import { Game } from '../models/game.model';
import { Position } from '../models/position.model';
import {
  CREATE_GAMES_TABLE,
  CREATE_POSITIONS_TABLE,
  CREATE_POSITIONS_INDEX,
  INSERT_GAME,
  SELECT_GAME_BY_PGN,
  INSERT_POSITION,
  SELECT_GAME_BY_ID,
  SELECT_POSITIONS_BY_GAME_ID,
} from '../constants/database.constants';
import { logger } from '../utils/logger.util';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string = './games.db') {
    this.db = new Database(dbPath);
  }

  initialize(): void {
    this.db.exec(CREATE_GAMES_TABLE);
    this.db.exec(CREATE_POSITIONS_TABLE);
    this.db.exec(CREATE_POSITIONS_INDEX);
    logger.debug('Database initialized');
  }

  insertGame(game: Game): number {
    try {
      const stmt = this.db.prepare(INSERT_GAME);
      const result = stmt.run(
        game.whitePlayer,
        game.blackPlayer,
        game.winner,
        game.tournament,
        game.pgn
      );
      return result.lastInsertRowid as number;
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
        throw new Error(`Game already exists: ${game.whitePlayer} vs ${game.blackPlayer}`);
      }
      throw error;
    }
  }

  gameExists(pgn: string): boolean {
    const stmt = this.db.prepare(SELECT_GAME_BY_PGN);
    const result = stmt.get(pgn);
    return result !== undefined;
  }

  insertPosition(position: Position): number {
    const stmt = this.db.prepare(INSERT_POSITION);
    const result = stmt.run(
      position.gameId,
      position.move,
      position.turn,
      position.fen,
      position.evaluation,
      position.bestMove,
      position.continuations,
      position.A1,
      position.A2,
      position.A3,
      position.A4,
      position.A5,
      position.A6,
      position.A7,
      position.A8,
      position.B1,
      position.B2,
      position.B3,
      position.B4,
      position.B5,
      position.B6,
      position.B7,
      position.B8,
      position.C1,
      position.C2,
      position.C3,
      position.C4,
      position.C5,
      position.C6,
      position.C7,
      position.C8,
      position.D1,
      position.D2,
      position.D3,
      position.D4,
      position.D5,
      position.D6,
      position.D7,
      position.D8,
      position.E1,
      position.E2,
      position.E3,
      position.E4,
      position.E5,
      position.E6,
      position.E7,
      position.E8,
      position.F1,
      position.F2,
      position.F3,
      position.F4,
      position.F5,
      position.F6,
      position.F7,
      position.F8,
      position.G1,
      position.G2,
      position.G3,
      position.G4,
      position.G5,
      position.G6,
      position.G7,
      position.G8,
      position.H1,
      position.H2,
      position.H3,
      position.H4,
      position.H5,
      position.H6,
      position.H7,
      position.H8
    );
    return result.lastInsertRowid as number;
  }

  getGameById(gameId: number): Game | null {
    const stmt = this.db.prepare(SELECT_GAME_BY_ID);
    const result = stmt.get(gameId) as
      | {
          white_player: string;
          black_player: string;
          winner: string;
          tournament: string | null;
          pgn: string;
        }
      | undefined;

    if (!result) {
      return null;
    }

    return {
      whitePlayer: result.white_player,
      blackPlayer: result.black_player,
      winner: result.winner,
      tournament: result.tournament,
      pgn: result.pgn,
    };
  }

  getPositionsByGameId(gameId: number): Position[] {
    const stmt = this.db.prepare(SELECT_POSITIONS_BY_GAME_ID);
    const results = stmt.all(gameId) as Array<{
      game_id: number;
      move: number;
      turn: string;
      fen: string;
      evaluation: number | null;
      best_move: string | null;
      continuations: string | null;
      A1: string | null;
      A2: string | null;
      A3: string | null;
      A4: string | null;
      A5: string | null;
      A6: string | null;
      A7: string | null;
      A8: string | null;
      B1: string | null;
      B2: string | null;
      B3: string | null;
      B4: string | null;
      B5: string | null;
      B6: string | null;
      B7: string | null;
      B8: string | null;
      C1: string | null;
      C2: string | null;
      C3: string | null;
      C4: string | null;
      C5: string | null;
      C6: string | null;
      C7: string | null;
      C8: string | null;
      D1: string | null;
      D2: string | null;
      D3: string | null;
      D4: string | null;
      D5: string | null;
      D6: string | null;
      D7: string | null;
      D8: string | null;
      E1: string | null;
      E2: string | null;
      E3: string | null;
      E4: string | null;
      E5: string | null;
      E6: string | null;
      E7: string | null;
      E8: string | null;
      F1: string | null;
      F2: string | null;
      F3: string | null;
      F4: string | null;
      F5: string | null;
      F6: string | null;
      F7: string | null;
      F8: string | null;
      G1: string | null;
      G2: string | null;
      G3: string | null;
      G4: string | null;
      G5: string | null;
      G6: string | null;
      G7: string | null;
      G8: string | null;
      H1: string | null;
      H2: string | null;
      H3: string | null;
      H4: string | null;
      H5: string | null;
      H6: string | null;
      H7: string | null;
      H8: string | null;
    }>;

    return results.map((row) => ({
      gameId: row.game_id,
      move: row.move,
      turn: (row.turn === 'white' ? 'white' : 'black') as 'white' | 'black',
      fen: row.fen,
      evaluation: row.evaluation,
      bestMove: row.best_move,
      continuations: row.continuations,
      A1: row.A1,
      A2: row.A2,
      A3: row.A3,
      A4: row.A4,
      A5: row.A5,
      A6: row.A6,
      A7: row.A7,
      A8: row.A8,
      B1: row.B1,
      B2: row.B2,
      B3: row.B3,
      B4: row.B4,
      B5: row.B5,
      B6: row.B6,
      B7: row.B7,
      B8: row.B8,
      C1: row.C1,
      C2: row.C2,
      C3: row.C3,
      C4: row.C4,
      C5: row.C5,
      C6: row.C6,
      C7: row.C7,
      C8: row.C8,
      D1: row.D1,
      D2: row.D2,
      D3: row.D3,
      D4: row.D4,
      D5: row.D5,
      D6: row.D6,
      D7: row.D7,
      D8: row.D8,
      E1: row.E1,
      E2: row.E2,
      E3: row.E3,
      E4: row.E4,
      E5: row.E5,
      E6: row.E6,
      E7: row.E7,
      E8: row.E8,
      F1: row.F1,
      F2: row.F2,
      F3: row.F3,
      F4: row.F4,
      F5: row.F5,
      F6: row.F6,
      F7: row.F7,
      F8: row.F8,
      G1: row.G1,
      G2: row.G2,
      G3: row.G3,
      G4: row.G4,
      G5: row.G5,
      G6: row.G6,
      G7: row.G7,
      G8: row.G8,
      H1: row.H1,
      H2: row.H2,
      H3: row.H3,
      H4: row.H4,
      H5: row.H5,
      H6: row.H6,
      H7: row.H7,
      H8: row.H8,
    }));
  }

  transaction<T>(fn: () => T): T {
    const transaction = this.db.transaction(fn);
    return transaction();
  }

  close(): void {
    this.db.close();
    logger.debug('Database closed');
  }
}
