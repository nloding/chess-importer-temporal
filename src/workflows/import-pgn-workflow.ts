import { proxyActivities, executeChild, log } from '@temporalio/workflow';
import type * as activities from '../activities';
import type { ParsePgnGamesResult } from '../activities/types';
import { processGame } from './process-game-workflow';

const { readPgnFile, parsePgnGames } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

export interface ImportPgnFileArgs {
  filePath: string;
}

export async function importPgnFile(args: ImportPgnFileArgs): Promise<{
  imported: number;
  skipped: number;
  errors: number;
}> {
  const pgnContent = await readPgnFile({ filePath: args.filePath });
  const games = await parsePgnGames({ pgnContent });
  const stats = {
    imported: 0,
    skipped: 0,
    errors: 0,
  };

  log.info(`Processing ${games.length} game(s) from ${args.filePath}`);

  const concurrency = 3;
  for (let i = 0; i < games.length; i += concurrency) {
    const batch = games.slice(i, i + concurrency);

    await Promise.all(
      batch.map((game: ParsePgnGamesResult[number]) =>
        executeChild(processGame, {
          args: [{ game }],
          workflowId: `game-${Date.now()}-${Math.random()}`,
          taskQueue: 'chess-import',
        })
        .then(() => stats.imported++)
        .catch(err => {
          stats.errors++;
          log.error(`Game processing failed: ${game.whitePlayer} vs ${game.blackPlayer}: ${err}`);
        })
      )
    );
  }

  log.info(`Import complete: ${stats.imported} imported, ${stats.errors} errors`);
  return stats;
}
