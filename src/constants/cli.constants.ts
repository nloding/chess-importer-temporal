export const INFO_SYMBOL = 'ℹ';
export const SUCCESS_SYMBOL = '✓';
export const WARNING_SYMBOL = '⚠';
export const ERROR_SYMBOL = '✗';
export const DEBUG_SYMBOL = '→';

export const PATH_NOT_FOUND_ERROR = (path: string): string => `Path not found: ${path}`;
export const INVALID_PGN_ERROR = 'Invalid PGN format';
export const DUPLICATE_GAME_WARNING = (white: string, black: string): string =>
  `Duplicate game skipped: ${white} vs ${black}`;
export const GAME_INSERTED = (white: string, black: string): string =>
  `Game inserted: ${white} - ${black}`;
export const POSITION_ANALYZING = (fen: string): string =>
  `  Analyzing FEN: ${fen.substring(0, 20)}...`;
export const POSITION_ANALYZED = (evaluation: number, bestMove: string): string =>
  `    Stockfish: ${evaluation}, best: ${bestMove}`;
export const GAME_IMPORTED = 'Game imported successfully';
export const FETCHING_ARCHIVES = 'Fetching game archives...';
export const FETCHING_ARCHIVE = (archive: string): string => `  Fetching archive: ${archive}`;
export const NO_GAMES_FOUND = 'No games found for the specified criteria';
export const GAMES_IMPORTED = (count: number): string => `Imported ${count} game(s)`;
export const GAMES_SKIPPED = (count: number): string => `Skipped ${count} duplicate game(s)`;
export const GAMES_FAILED = (count: number): string => `Failed to import ${count} game(s)`;
