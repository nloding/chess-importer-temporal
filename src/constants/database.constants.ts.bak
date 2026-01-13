export const CREATE_GAMES_TABLE = `
  CREATE TABLE IF NOT EXISTS games (
    game_id INTEGER PRIMARY KEY,
    white_player TEXT NOT NULL,
    black_player TEXT NOT NULL,
    winner TEXT NOT NULL,
    tournament TEXT,
    pgn TEXT NOT NULL,
    UNIQUE(pgn)
  );
`;

export const CREATE_POSITIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS positions (
    position_id INTEGER PRIMARY KEY,
    game_id INTEGER NOT NULL,
    move INTEGER NOT NULL,
    turn TEXT NOT NULL,
    fen TEXT NOT NULL,
    evaluation DOUBLE,
    best_move TEXT,
    continuations TEXT,
    A1 TEXT, A2 TEXT, A3 TEXT, A4 TEXT, A5 TEXT, A6 TEXT, A7 TEXT, A8 TEXT,
    B1 TEXT, B2 TEXT, B3 TEXT, B4 TEXT, B5 TEXT, B6 TEXT, B7 TEXT, B8 TEXT,
    C1 TEXT, C2 TEXT, C3 TEXT, C4 TEXT, C5 TEXT, C6 TEXT, C7 TEXT, C8 TEXT,
    D1 TEXT, D2 TEXT, D3 TEXT, D4 TEXT, D5 TEXT, D6 TEXT, D7 TEXT, D8 TEXT,
    E1 TEXT, E2 TEXT, E3 TEXT, E4 TEXT, E5 TEXT, E6 TEXT, E7 TEXT, E8 TEXT,
    F1 TEXT, F2 TEXT, F3 TEXT, F4 TEXT, F5 TEXT, F6 TEXT, F7 TEXT, F8 TEXT,
    G1 TEXT, G2 TEXT, G3 TEXT, G4 TEXT, G5 TEXT, G6 TEXT, G7 TEXT, G8 TEXT,
    H1 TEXT, H2 TEXT, H3 TEXT, H4 TEXT, H5 TEXT, H6 TEXT, H7 TEXT, H8 TEXT,
    FOREIGN KEY (game_id)
      REFERENCES games (game_id)
         ON DELETE CASCADE
         ON UPDATE NO ACTION
  );
`;

export const CREATE_POSITIONS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_positions_game_id ON positions(game_id);
`;

export const INSERT_GAME = `
  INSERT INTO games (
    white_player, black_player, winner, tournament, pgn
  ) VALUES (?, ?, ?, ?, ?)
`;

export const SELECT_GAME_BY_PGN = `
  SELECT game_id FROM games WHERE pgn = ?
`;

export const INSERT_POSITION = `
  INSERT INTO positions (
    game_id, move, turn, fen, evaluation, best_move, continuations,
    A1, A2, A3, A4, A5, A6, A7, A8,
    B1, B2, B3, B4, B5, B6, B7, B8,
    C1, C2, C3, C4, C5, C6, C7, C8,
    D1, D2, D3, D4, D5, D6, D7, D8,
    E1, E2, E3, E4, E5, E6, E7, E8,
    F1, F2, F3, F4, F5, F6, F7, F8,
    G1, G2, G3, G4, G5, G6, G7, G8,
    H1, H2, H3, H4, H5, H6, H7, H8
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?
  )
`;

export const SELECT_GAME_BY_ID = `
  SELECT game_id, white_player, black_player, winner, tournament, pgn
  FROM games
  WHERE game_id = ?
`;

export const SELECT_POSITIONS_BY_GAME_ID = `
  SELECT
    position_id, game_id, move, turn, fen, evaluation, best_move, continuations,
    A1, A2, A3, A4, A5, A6, A7, A8,
    B1, B2, B3, B4, B5, B6, B7, B8,
    C1, C2, C3, C4, C5, C6, C7, C8,
    D1, D2, D3, D4, D5, D6, D7, D8,
    E1, E2, E3, E4, E5, E6, E7, E8,
    F1, F2, F3, F4, F5, F6, F7, F8,
    G1, G2, G3, G4, G5, G6, G7, G8,
    H1, H2, H3, H4, H5, H6, H7, H8
  FROM positions
  WHERE game_id = ?
  ORDER BY move ASC
`;
