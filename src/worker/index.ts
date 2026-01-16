import { NativeConnection, Worker } from '@temporalio/worker';
import { logger } from '../utils/logger.util';
// import * as pgnActivities from '../activities/pgn.activities';
// import * as apiActivities from '../activities/api.activities';
// import * as databaseActivities from '../activities/database.activities';
// import * as stockfishActivities from '../activities/stockfish.activities';
import * as activities from '../activities/activities';
import { terminateStockfish } from '../activities/stockfish.activities';

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  try {
    const worker = await Worker.create({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE || 'chess-importer',
      taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'chess-import',
      workflowsPath: require.resolve('../workflows'),
      activities,
      // activities: {
      //   readPgnFile: {
      //     fn: pgnActivities.readPgnFile,
      //     startToCloseTimeout: '1m',
      //   },
      //   parsePgnGames: {
      //     fn: pgnActivities.parsePgnGames,
      //     startToCloseTimeout: '1m',
      //   },
      //   extractPositionsFromPgn: {
      //     fn: pgnActivities.extractPositionsFromPgn,
      //     startToCloseTimeout: '1m',
      //   },
      //   fetchChessComGames: {
      //     fn: apiActivities.fetchChessComGames,
      //     startToCloseTimeout: '5m',
      //     retry: {
      //       maximumAttempts: 3,
      //       initialInterval: '1s',
      //       backoffCoefficient: 2,
      //     },
      //   },
      //   fetchLichessGames: {
      //     fn: apiActivities.fetchLichessGames,
      //     startToCloseTimeout: '5m',
      //     retry: {
      //       maximumAttempts: 3,
      //       initialInterval: '1s',
      //       backoffCoefficient: 2,
      //     },
      //   },
      //   insertGame: {
      //     fn: databaseActivities.insertGame,
      //     startToCloseTimeout: '30s',
      //   },
      //   insertPosition: {
      //     fn: databaseActivities.insertPosition,
      //     startToCloseTimeout: '30s',
      //   },
      //   gameExists: {
      //     fn: databaseActivities.gameExists,
      //     startToCloseTimeout: '10s',
      //   },
      //   analyzePosition: {
      //     fn: stockfishActivities.analyzePosition,
      //     startToCloseTimeout: '3m',
      //     retry: {
      //       maximumAttempts: 2,
      //       initialInterval: '5s',
      //     },
      //   },
      //},
    });

    logger.info(`Worker started on task queue: chess-import`);
    logger.info('Waiting for workflows...');

    process.on('SIGINT', async () => {
      logger.info('Shutting down worker...');
      await worker.shutdown();
      await terminateStockfish();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down worker...');
      await worker.shutdown();
      await terminateStockfish();
      process.exit(0);
    });

    await worker.run();
  } finally {
    await connection.close();
    await terminateStockfish();
    logger.info('Worker stopped');
  }
}

run().catch((err) => {
  logger.error(`Worker error: ${err}`);
  process.exit(1);
});
