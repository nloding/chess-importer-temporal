import { NativeConnection, Worker } from '@temporalio/worker';
import { logger } from '../utils/logger.util';
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
