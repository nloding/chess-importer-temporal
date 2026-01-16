import * as fs from 'fs';
import * as path from 'path';
import { startImportPgnFileWorkflow } from '../temporal-client';
import { logger } from '../../utils/logger.util';
import { validatePgnPath } from '../utils/validation';
import { handleCliError, ImportError, TemporalConnectionError } from '../utils/error-handler';

export async function handlePgnCommand(targetPath: string): Promise<void> {
  try {
    const validation = validatePgnPath(targetPath);
    if (!validation.isValid) {
      handleCliError(validation.error!);
      process.exit(1);
    }

    const resolvedPath = path.resolve(targetPath);
    const stat = fs.statSync(resolvedPath);

    if (stat.isFile()) {
      if (!resolvedPath.endsWith('.pgn')) {
        logger.error(`File must be a .pgn file: ${resolvedPath}`);
        process.exit(1);
      }

      try {
        const workflowId = await startImportPgnFileWorkflow(resolvedPath);
        logger.success(`Workflow started: ${workflowId}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Failed to connect to Temporal server')) {
          handleCliError(new TemporalConnectionError(error.message, { operation: 'import-pgn', target: targetPath }));
        } else {
          handleCliError(new ImportError(error instanceof Error ? error.message : String(error), 'IMPORT_ERROR', [
            'Check that Temporal worker is running: npm run worker',
            'Verify Temporal server is running: temporal server start-dev',
          ], { operation: 'import-pgn', target: targetPath }));
        }
        process.exit(1);
      }
    } else if (stat.isDirectory()) {
      const files = findAllPgnFiles(resolvedPath);
      logger.info(`Found ${files.length} PGN files. Starting workflows...`);

      const workflowIds: string[] = [];
      for (const file of files) {
        try {
          const workflowId = await startImportPgnFileWorkflow(file);
          workflowIds.push(workflowId);
          logger.success(`✅ [${workflowIds.length}/${files.length}] ${path.basename(file)} → ${workflowId}`);
        } catch (error) {
          if (error instanceof Error && error.message.includes('Failed to connect to Temporal server')) {
            handleCliError(new TemporalConnectionError(error.message, { operation: 'import-pgn', target: targetPath }));
            process.exit(1);
          } else {
            logger.error(`❌ Failed to start workflow for ${path.basename(file)}: ${error}`);
          }
        }
      }

      logger.success(`\nStarted ${workflowIds.length} workflow(s)`);
      logger.info(`Use 'status' command to check progress`);
      logger.info(`Monitor workflows at: http://localhost:8233/namespaces/${process.env.TEMPORAL_NAMESPACE || 'chess-importer'}/workflows`);
    }
  } catch (error) {
    if (error instanceof Error) {
      handleCliError(error);
    }
    process.exit(1);
  }
}

function findAllPgnFiles(dir: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findAllPgnFiles(fullPath));
    } else if (item.endsWith('.pgn')) {
      files.push(fullPath);
    }
  }

  return files;
}
