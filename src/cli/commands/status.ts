import { getWorkflowStatus } from '../temporal-client';
import { logger } from '../../utils/logger.util';
import { validateWorkflowId } from '../utils/validation';
import { handleCliError, ValidationError as CliValidationError } from '../utils/error-handler';

export async function handleStatusCommand(workflowId?: string): Promise<void> {
  try {
    if (!workflowId || workflowId.trim() === '') {
      handleCliError(new CliValidationError('Workflow ID is required', [
        'Provide a valid workflow ID',
        'Use workflow ID from import command output',
        'Example: chess-game-importer status abc-123-def-456',
      ]));
      process.exit(1);
    }

    const validationError = validateWorkflowId(workflowId);
    if (validationError) {
      handleCliError(validationError);
      process.exit(1);
    }

    const status = await getWorkflowStatus(workflowId);

    logger.info(`\n=== Workflow Status ===`);
    logger.info(`Workflow ID: ${status.workflowId}`);
    logger.info(`Status: ${formatStatus(status.status)}`);
    logger.info(`Start Time: ${status.startTime?.toISOString() || 'N/A'}`);
    logger.info(`End Time: ${status.endTime?.toISOString() || 'N/A'}`);

    if (status.result) {
      logger.success(`\nResult: ${JSON.stringify(status.result, null, 2)}`);
    }

    if (status.error) {
      logger.error(`\nError: ${status.error}`);
    }

    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      handleCliError(error);
    }
    process.exit(1);
  }
}

function formatStatus(status: string): string {
  const colors: Record<string, string> = {
    RUNNING: '🟢 Running',
    COMPLETED: '✅ Completed',
    FAILED: '❌ Failed',
    CANCELED: '🟡 Canceled',
    TERMINATED: '🔴 Terminated',
    TIMED_OUT: '⏰ Timed Out',
    UNKNOWN: '❓ Unknown',
  };
  return colors[status] || status;
}
