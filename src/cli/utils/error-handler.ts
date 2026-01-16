import { logger } from '../../utils/logger.util';

interface ErrorContext {
  command?: string;
  operation?: string;
  target?: string;
}

export interface CliError extends Error {
  code: string;
  suggestions: string[];
  context: ErrorContext;
}

export class ImportError extends Error implements CliError {
  code: string;
  suggestions: string[];
  context: ErrorContext;

  constructor(message: string, code: string, suggestions: string[], context: ErrorContext = {}) {
    super(message);
    this.name = 'ImportError';
    this.code = code;
    this.suggestions = suggestions;
    this.context = context;
  }
}

export class ValidationError extends Error implements CliError {
  code: string;
  suggestions: string[];
  context: ErrorContext;

  constructor(message: string, suggestions: string[], context: ErrorContext = {}) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.suggestions = suggestions;
    this.context = context;
  }
}

export class TemporalConnectionError extends Error implements CliError {
  code: string;
  suggestions: string[];
  context: ErrorContext;

  constructor(message: string, context: ErrorContext = {}) {
    super(message);
    this.name = 'TemporalConnectionError';
    this.code = 'CONNECTION_ERROR';
    this.suggestions = [
      'Ensure Temporal server is running: `temporal server start-dev`',
      'Check TEMPORAL_ADDRESS environment variable',
      'Verify network connectivity to Temporal server',
    ];
    this.context = context;
  }
}

export function handleCliError(error: Error | CliError): void {
  logger.error(`\n${'='.repeat(60)}`);
  logger.error(`Error`);
  logger.error('='.repeat(60));

  if (error instanceof Error) {
    logger.error(`Message: ${error.message}`);
    logger.error(`Type: ${error.name || 'Error'}`);
  }

  if ('suggestions' in error && error.suggestions.length > 0) {
    logger.info(`\n💡 Possible solutions:`);
    error.suggestions.forEach((suggestion, index) => {
      logger.info(`  ${index + 1}. ${suggestion}`);
    });
  }

  if ('context' in error && error.context) {
    const context = error.context;
    if (context.command) logger.info(`\nCommand: ${context.command}`);
    if (context.operation) logger.info(`Operation: ${context.operation}`);
    if (context.target) logger.info(`Target: ${context.target}`);
  }

  logger.info(`\nFor more help, run: chess-game-importer --help`);
}

export function formatError(error: Error): string {
  let message = error.message;

  if (error.name) {
    message = `[${error.name}] ${message}`;
  }

  return message;
}
