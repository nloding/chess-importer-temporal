import { AppError } from './base.error';

export class ApiError extends AppError {
  constructor(message: string) {
    super(message, 'API_ERROR');
  }
}

export class FetchGamesError extends ApiError {
  constructor(username: string) {
    super(`Failed to fetch games for user: ${username}`);
  }
}
