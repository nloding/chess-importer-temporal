import { Square } from '../models/position.model';

export const SQUARES = [
  'A1',
  'A2',
  'A3',
  'A4',
  'A5',
  'A6',
  'A7',
  'A8',
  'B1',
  'B2',
  'B3',
  'B4',
  'B5',
  'B6',
  'B7',
  'B8',
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'C6',
  'C7',
  'C8',
  'D1',
  'D2',
  'D3',
  'D4',
  'D5',
  'D6',
  'D7',
  'D8',
  'E1',
  'E2',
  'E3',
  'E4',
  'E5',
  'E6',
  'E7',
  'E8',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'G1',
  'G2',
  'G3',
  'G4',
  'G5',
  'G6',
  'G7',
  'G8',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'H7',
  'H8',
] as const;

export type SquareType = (typeof SQUARES)[number];

export function parseFenToBoardState(fen: string): Partial<Record<Square, string>> {
  const board: Partial<Record<Square, string>> = {};
  const placement = fen.split(' ')[0];
  const rows = placement.split('/');

  rows.forEach((row, rowIndex) => {
    const rank = 8 - rowIndex;
    let fileIndex = 0;

    for (const char of row) {
      if (/[1-8]/.test(char)) {
        fileIndex += parseInt(char, 10);
      } else {
        const file = String.fromCharCode(97 + fileIndex);
        const square = `${file.toUpperCase()}${rank}` as Square;
        board[square] = char;
        fileIndex++;
      }
    }
  });

  return board;
}
