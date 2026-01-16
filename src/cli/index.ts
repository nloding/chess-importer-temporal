#!/usr/bin/env node

import { Command } from 'commander';
import { handlePgnCommand } from './commands/pgn';
import { handleChesscomCommand } from './commands/chesscom';
import { handleLichessCommand } from './commands/lichess';
import { handleStatusCommand } from './commands/status';
import { handleCancelCommand } from './commands/cancel';
import { logger } from '../utils/logger.util';

const program = new Command();

program
  .name('chess-game-importer')
  .description(
    'Import chess games from PGN files or Chess.com/Lichess APIs with Stockfish analysis'
  )
  .version('1.0.0');

program
  .command('pgn <path>')
  .description('Import games from PGN file or directory')
  .action(async (path: string) => {
    try {
      await handlePgnCommand(path);
    } catch (error) {
      logger.error(`Failed to process PGN: ${error}`);
      process.exit(1);
    }
  });

program
  .command('chesscom <username> [startDate] [endDate]')
  .description('Import games from Chess.com API')
  .action(async (username: string, startDate?: string, endDate?: string) => {
    try {
      await handleChesscomCommand(username, startDate, endDate);
    } catch (error) {
      logger.error(`Failed to fetch Chess.com games: ${error}`);
      process.exit(1);
    }
  });

program
  .command('lichess <username> [startDate] [endDate]')
  .description('Import games from Lichess API')
  .action(async (username: string, startDate?: string, endDate?: string) => {
    try {
      await handleLichessCommand(username, startDate, endDate);
    } catch (error) {
      logger.error(`Failed to fetch Lichess games: ${error}`);
      process.exit(1);
    }
  });

program
  .command('status <workflow-id>')
  .description('Check workflow status')
  .action(async (workflowId: string) => {
    try {
      await handleStatusCommand(workflowId);
    } catch (error) {
      logger.error(`Failed to get workflow status: ${error}`);
      process.exit(1);
    }
  });

program
  .command('cancel <workflow-id>')
  .description('Cancel a running workflow')
  .action(async (workflowId: string) => {
    try {
      await handleCancelCommand(workflowId);
    } catch (error) {
      logger.error(`Failed to cancel workflow: ${error}`);
      process.exit(1);
    }
  });

process.on('SIGINT', () => {
  logger.info('\nShutting down gracefully...');
  process.exit(0);
});

program.parseAsync(process.argv).catch((error) => {
  logger.error(`Error: ${error}`);
  process.exit(1);
});
