import { cancelWorkflow } from '../temporal-client';
import { logger } from '../../utils/logger.util';
import { validateWorkflowId } from '../utils/validation';
import { handleCliError, ValidationError as CliValidationError } from '../utils/error-handler';

export async function handleCancelCommand(workflowId?: string): Promise<void> {
  try {
    if (!workflowId || workflowId.trim() === '') {
      handleCliError(new CliValidationError('Workflow ID is required', [
        'Provide a valid workflow ID',
        'Use workflow ID from import command output',
        'Example: chess-game-importer cancel abc-123-def-456',
      ]));
      process.exit(1);
    }

    const validationError = validateWorkflowId(workflowId);
    if (validationError) {
      handleCliError(validationError);
      process.exit(1);
    }

    await cancelWorkflow(workflowId);
    logger.success(`Cancellation requested for workflow: ${workflowId}`);
    logger.info(`Monitor status with: npm run cli status ${workflowId}`);
  } catch (error) {
    if (error instanceof Error) {
      handleCliError(error);
    }
    process.exit(1);
  }
}
