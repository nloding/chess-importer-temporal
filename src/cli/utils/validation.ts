import * as fs from 'fs';
import * as path from 'path';
import { ValidationError } from './error-handler';

export interface PathValidationResult {
  isValid: boolean;
  error?: ValidationError;
}

export function validatePgnPath(inputPath: string): PathValidationResult {
  if (!inputPath || inputPath.trim() === '') {
    return {
      isValid: false,
      error: new ValidationError('PGN file path is required', [
        'Provide a path to a .pgn file or directory',
        'Usage: chess-game-importer pgn <path>',
      ]),
    };
  }

  const absolutePath = path.resolve(inputPath);

  if (!fs.existsSync(absolutePath)) {
    return {
      isValid: false,
      error: new ValidationError(`Path does not exist: ${inputPath}`, [
        'Check that path is correct',
        'Verify that file or directory exists',
        'Ensure you have permission to access the path',
      ], { target: inputPath }),
    };
  }

  const stat = fs.statSync(absolutePath);
  if (!stat.isFile() && !stat.isDirectory()) {
    return {
      isValid: false,
      error: new ValidationError('Path must be a file or directory', [
        'Provide a path to a .pgn file or directory containing .pgn files',
        'Special files (sockets, pipes) are not supported',
      ], { target: inputPath }),
    };
  }

  if (stat.isFile() && !inputPath.endsWith('.pgn')) {
    return {
      isValid: false,
      error: new ValidationError(`File must have .pgn extension: ${inputPath}`, [
        'Ensure file is a PGN file',
        'Supported file types: .pgn',
      ], { target: inputPath }),
    };
  }

  if (stat.isDirectory()) {
    const items = fs.readdirSync(absolutePath);
    const hasPgnFiles = items.some(item => item.endsWith('.pgn'));

    if (!hasPgnFiles) {
      return {
        isValid: false,
        error: new ValidationError(`No .pgn files found in directory: ${inputPath}`, [
          'Add .pgn files to the directory',
          'Check that files have .pgn extension',
          'Ensure you have read permissions for the directory',
        ], { target: inputPath }),
      };
    }
  }

  return { isValid: true };
}

export function validateWorkflowId(workflowId: string): ValidationError | null {
  if (!workflowId || workflowId.trim() === '') {
    return new ValidationError('Workflow ID is required', [
      'Provide a valid workflow ID',
      'Use workflow ID from import command output',
      'Example: chess-game-importer status abc-123-def-456',
    ]);
  }

  if (workflowId.length < 10) {
    return new ValidationError('Invalid workflow ID format', [
      'Workflow ID should be at least 10 characters',
      'Use the full workflow ID from import command output',
      'Check status with: chess-game-importer list',
    ]);
  }

  return null;
}
