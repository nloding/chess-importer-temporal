export interface Game {
  whitePlayer: string;
  blackPlayer: string;
  winner: string;
  tournament: string | null;
  pgn: string;
}
