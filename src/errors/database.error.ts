import { AppError } from './base.error';

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR');
  }
}

export class InsertGameError extends DatabaseError {
  constructor() {
    super('Failed to insert game');
  }
}
