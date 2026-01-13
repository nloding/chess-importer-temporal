export interface Position {
  gameId: number;
  move: number;
  turn: 'white' | 'black';
  fen: string;
  evaluation: number | string | null;
  bestMove: string | null;
  continuations: string | null;
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
}

export type Square =
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'A5'
  | 'A6'
  | 'A7'
  | 'A8'
  | 'B1'
  | 'B2'
  | 'B3'
  | 'B4'
  | 'B5'
  | 'B6'
  | 'B7'
  | 'B8'
  | 'C1'
  | 'C2'
  | 'C3'
  | 'C4'
  | 'C5'
  | 'C6'
  | 'C7'
  | 'C8'
  | 'D1'
  | 'D2'
  | 'D3'
  | 'D4'
  | 'D5'
  | 'D6'
  | 'D7'
  | 'D8'
  | 'E1'
  | 'E2'
  | 'E3'
  | 'E4'
  | 'E5'
  | 'E6'
  | 'E7'
  | 'E8'
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'G1'
  | 'G2'
  | 'G3'
  | 'G4'
  | 'G5'
  | 'G6'
  | 'G7'
  | 'G8'
  | 'H1'
  | 'H2'
  | 'H3'
  | 'H4'
  | 'H5'
  | 'H6'
  | 'H7'
  | 'H8';
