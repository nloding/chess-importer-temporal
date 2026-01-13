import { AppError } from './base.error';

export class ParsingError extends AppError {
  constructor(message: string) {
    super(message, 'PARSING_ERROR');
  }
}

export class InvalidPgnError extends ParsingError {
  constructor() {
    super('Invalid PGN format');
  }
}

export class DuplicateGameError extends ParsingError {
  constructor(white: string, black: string) {
    super(`Duplicate game: ${white} vs ${black}`);
  }
}
