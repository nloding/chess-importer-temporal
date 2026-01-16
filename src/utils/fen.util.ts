export class FenUtil {
  static extractBoard(fen: string): string {
    const [placement] = fen.split(' ');
    return placement;
  }

  static isValid(fen: string): boolean {
    const parts = fen.split(' ');
    return parts.length === 6 && /^[rnbqkpnRNBQKPN1-8/]+$/.test(parts[0]);
  }

  static fenToBoard(fen: string): string[] {
    const placement = this.extractBoard(fen);
    const rows = placement.split('/');
    return rows.map((row) => row.replace(/\d/g, (match) => ' '.repeat(parseInt(match, 10))));
  }
}

