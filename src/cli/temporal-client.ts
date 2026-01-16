import { Client } from '@temporalio/client';
import { importPgnFile } from '../workflows/import-pgn-workflow';
import { logger } from '../utils/logger.util';

const client = new Client({
  namespace: process.env.TEMPORAL_NAMESPACE || 'chess-importer',
});

export async function testConnection(): Promise<boolean> {
  try {
    await client.workflow.list();
    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to connect to Temporal server: ${error.message}`, {
        cause: error,
      } as any);
    }
    throw error;
  }
}

export async function startImportPgnFileWorkflow(filePath: string): Promise<string> {
  const workflowId = `import-pgn-${filePathToId(filePath)}-${Date.now()}`;
  logger.info(`Starting PGN import workflow for: ${filePath}`);
  logger.info(`Workflow ID: ${workflowId}`);

  const handle = await client.workflow.start(importPgnFile, {
    taskQueue: 'chess-import',
    workflowId,
    args: [{ filePath }],
  });

  logger.info(`Workflow started successfully`);
  logger.info(`Monitor progress: http://localhost:8233/namespaces/${process.env.TEMPORAL_NAMESPACE || 'chess-importer'}/workflows/${workflowId}`);

  return handle.workflowId;
}

export async function getWorkflowStatus(workflowId: string): Promise<WorkflowStatus> {
  const handle = client.workflow.getHandle(workflowId);

  try {
    const result = await handle.result();
    return {
      workflowId,
      status: 'COMPLETED',
      startTime: null,
      endTime: new Date(),
      result,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('is still running')) {
        return {
          workflowId,
          status: 'RUNNING',
          startTime: null,
          endTime: null,
        };
      } else if (error.message.includes('not found')) {
        return {
          workflowId,
          status: 'FAILED',
          startTime: null,
          endTime: new Date(),
          error: 'Workflow not found',
        };
      } else if (error.message.includes('canceled')) {
        return {
          workflowId,
          status: 'CANCELED',
          startTime: null,
          endTime: new Date(),
          error: error.message,
        };
      } else if (error.message.includes('terminated')) {
        return {
          workflowId,
          status: 'TERMINATED',
          startTime: null,
          endTime: new Date(),
          error: error.message,
        };
      } else {
        return {
          workflowId,
          status: 'FAILED',
          startTime: null,
          endTime: new Date(),
          error: error.message,
        };
      }
    }
    return {
      workflowId,
      status: 'UNKNOWN',
      startTime: null,
      endTime: null,
      error: String(error),
    };
  }
}

export async function cancelWorkflow(workflowId: string): Promise<void> {
  try {
    const handle = client.workflow.getHandle(workflowId);
    await handle.cancel();
    logger.info(`Cancellation requested for workflow: ${workflowId}`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('already completed')) {
        throw new Error(`Workflow ${workflowId} is not running or has already completed`);
      }
      throw error;
    }
    throw error;
  }
}

function filePathToId(filePath: string): string {
  return filePath
    .replace(/[^\w-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}

interface WorkflowStatus {
  workflowId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'TERMINATED' | 'TIMED_OUT' | 'UNKNOWN';
  startTime: Date | null;
  endTime: Date | null;
  result?: any;
  error?: string;
}
