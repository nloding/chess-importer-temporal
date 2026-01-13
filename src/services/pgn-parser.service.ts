import { pgnRead, Game, pgnWrite } from 'kokopu';
import * as fs from 'fs';
import { InvalidPgnError } from '../errors/parsing.error';
import { logger } from '../utils/logger.util';

export interface GameMetadata {
  whitePlayer: string;
  blackPlayer: string;
  winner: string;
  tournament: string | null;
  pgn: string;
}

export interface PositionInfo {
  moveNumber: number;
  fen: string;
  turn: 'white' | 'black';
}

export class PgnParserService {
  parsePgn(pgnString: string): Game {
    try {
      const database = pgnRead(pgnString);
      if (database.gameCount() === 0) {
        throw new InvalidPgnError();
      }
      return database.game(0);
    } catch (error) {
      if (error instanceof InvalidPgnError) {
        throw error;
      }
      throw new InvalidPgnError();
    }
  }

  parsePgnFile(filePath: string): Game[] {
    try {
      const pgnContent = fs.readFileSync(filePath, 'utf8');
      const database = pgnRead(pgnContent);
      const games: Game[] = [];

      for (let i = 0; i < database.gameCount(); i++) {
        games.push(database.game(i));
      }

      return games;
    } catch (error) {
      logger.error(`Failed to parse PGN file: ${filePath}`);
      throw error;
    }
  }

  extractGameMetadata(game: Game): GameMetadata {
    const whitePlayer = game.playerName('w') || 'Unknown';
    const blackPlayer = game.playerName('b') || 'Unknown';

    const result = game.result();
    let winner: string;
    if (result === '1-0') {
      winner = whitePlayer;
    } else if (result === '0-1') {
      winner = blackPlayer;
    } else {
      winner = 'DRAW';
    }

    const tournament = game.event() || null;
    const pgn = this.gameToPgnString(game);

    return {
      whitePlayer,
      blackPlayer,
      winner,
      tournament,
      pgn,
    };
  }

  extractPositions(game: Game): PositionInfo[] {
    const positions: PositionInfo[] = [];
    const mainVariation = game.mainVariation();

    const initialPosition = game.initialPosition();
    positions.push({
      moveNumber: 0,
      fen: initialPosition.fen(),
      turn: 'white',
    });

    for (let node = mainVariation.first(); node; node = node.next()) {
      const position = node.position();
      const moveColor = node.moveColor();
      const turn = moveColor === 'w' ? 'white' : 'black';

      positions.push({
        moveNumber: node.fullMoveNumber(),
        fen: position.fen(),
        turn,
      });
    }

    return positions;
  }

  private gameToPgnString(game: Game): string {
    return pgnWrite(game);
  }
}
