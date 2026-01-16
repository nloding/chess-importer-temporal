// PGN Activity Types
export interface ReadPgnFileArgs {
  filePath: string;
}

export type ReadPgnFileResult = string;

export interface ParsePgnGamesArgs {
  pgnContent: string;
}

export interface PositionInfo {
  moveNumber: number;
  fen: string;
  turn: 'white' | 'black';
}

export type ParsePgnGamesResult = Array<{
  whitePlayer: string;
  blackPlayer: string;
  result: string;
  event: string | null;
  fullPgn: string;
}>;

export interface ExtractPositionsFromPgnArgs {
  gamePgn: string;
}

export type ExtractPositionsFromPgnResult = PositionInfo[];

// API Activity Types
export interface FetchChessComGamesArgs {
  username: string;
  startDate: Date;
  endDate: Date;
}

export type FetchChessComGamesResult = string;

export interface FetchLichessGamesArgs {
  username: string;
  startDate: Date;
  endDate: Date;
}

export type FetchLichessGamesResult = string;

// Database Activity Types
export interface InsertGameArgs {
  game: {
    whitePlayer: string;
    blackPlayer: string;
    winner: string;
    tournament: string | null;
    pgn: string;
  };
}

export type InsertGameResult = number;

export interface InsertPositionArgs {
  position: {
    gameId: number;
    move: number;
    turn: 'white' | 'black';
    fen: string;
    evaluation: number | string;
    bestMove: string;
    continuations: string;
    A1: string | null;
    A2: string | null;
    A3: string | null;
    A4: string | null;
    A5: string | null;
    A6: string | null;
    A7: string | null;
    A8: string | null;
    B1: string | null;
    B2: string | null;
    B3: string | null;
    B4: string | null;
    B5: string | null;
    B6: string | null;
    B7: string | null;
    B8: string | null;
    C1: string | null;
    C2: string | null;
    C3: string | null;
    C4: string | null;
    C5: string | null;
    C6: string | null;
    C7: string | null;
    C8: string | null;
    D1: string | null;
    D2: string | null;
    D3: string | null;
    D4: string | null;
    D5: string | null;
    D6: string | null;
    D7: string | null;
    D8: string | null;
    E1: string | null;
    E2: string | null;
    E3: string | null;
    E4: string | null;
    E5: string | null;
    E6: string | null;
    E7: string | null;
    E8: string | null;
    F1: string | null;
    F2: string | null;
    F3: string | null;
    F4: string | null;
    F5: string | null;
    F6: string | null;
    F7: string | null;
    F8: string | null;
    G1: string | null;
    G2: string | null;
    G3: string | null;
    G4: string | null;
    G5: string | null;
    G6: string | null;
    G7: string | null;
    G8: string | null;
    H1: string | null;
    H2: string | null;
    H3: string | null;
    H4: string | null;
    H5: string | null;
    H6: string | null;
    H7: string | null;
    H8: string | null;
  };
}

export type InsertPositionResult = number;

export interface GameExistsArgs {
  pgn: string;
}

export type GameExistsResult = boolean;

// Stockfish Activity Types
export interface AnalyzePositionArgs {
  fen: string;
}

export type AnalyzePositionResult = {
  evaluation: number | string;
  bestMove: string;
  continuations: Array<{
    evaluation: number | string;
    moves: string[];
  }>;
};
