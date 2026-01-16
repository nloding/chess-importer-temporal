import * as fs from 'fs/promises';
import { pgnRead, pgnWrite } from 'kokopu';
import { log, ApplicationFailure } from '@temporalio/activity';
import type {
  ReadPgnFileArgs,
  ParsePgnGamesArgs,
  ExtractPositionsFromPgnArgs,
  ParsePgnGamesResult,
  ExtractPositionsFromPgnResult,
} from './types';

export async function readPgnFile(args: ReadPgnFileArgs): Promise<string> {
  const { filePath } = args;
  log.info(`Reading PGN file: ${filePath}`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    log.info(`Successfully read ${content.length} bytes from ${filePath}`);
    return content;
  } catch (err) {
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw ApplicationFailure.nonRetryable(`File not found: ${filePath}`, 'FileNotFoundError', { filePath });
    }
    throw err;
  }
}

export async function parsePgnGames(args: ParsePgnGamesArgs): Promise<ParsePgnGamesResult> {
  const { pgnContent } = args;
  log.info(`Parsing PGN content (${pgnContent.length} bytes)`);

  try {
    const database = pgnRead(pgnContent);
    const games: ParsePgnGamesResult = [];

    for (let i = 0; i < database.gameCount(); i++) {
      const game = database.game(i);
      games.push({
        whitePlayer: game.playerName('w') || 'Unknown',
        blackPlayer: game.playerName('b') || 'Unknown',
        result: game.result(),
        event: game.event() || null,
        fullPgn: pgnWrite(game),
      });
    }

    log.info(`Parsed ${games.length} game(s) from PGN content`);
    return games;
  } catch (err) {
    throw ApplicationFailure.nonRetryable(`Invalid PGN format: ${(err as Error).message}`, 'PgnParseError', { pgnLength: pgnContent.length });
  }
}

export async function extractPositionsFromPgn(args: ExtractPositionsFromPgnArgs): Promise<ExtractPositionsFromPgnResult> {
  const { gamePgn } = args;
  log.debug('Extracting positions from game PGN');
  const game = pgnRead(gamePgn).game(0);
  const positions: ExtractPositionsFromPgnResult = [];

  const initialPosition = game.initialPosition();
  positions.push({
    moveNumber: 0,
    fen: initialPosition.fen(),
    turn: 'white',
  });

  const mainVariation = game.mainVariation();
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

  log.info(`Extracted ${positions.length} position(s) from game`);
  return positions;
}
