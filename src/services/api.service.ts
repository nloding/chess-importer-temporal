import * as https from 'https';
import { FetchGamesError } from '../errors/api.error';
import { logger } from '../utils/logger.util';

export interface ApiClient {
  fetchGames(username: string, startDate: Date, endDate: Date): Promise<string>;
}

export class ChessComApiClient implements ApiClient {
  private readonly baseUrl = 'https://api.chess.com/pub/player';

  async fetchGames(username: string, startDate: Date, endDate: Date): Promise<string> {
    try {
      const archivesUrl = `${this.baseUrl}/${username}/games/archives`;
      console.log(`download archives from ${archivesUrl}`);
      const archivesResponse = await this.httpGet(archivesUrl);
      console.log('archives response', archivesResponse);
      const { archives } = JSON.parse(archivesResponse) as { archives: string[] };

      const filteredArchives = this.filterArchivesByDate(archives, startDate, endDate);

      if (filteredArchives.length === 0) {
        logger.warning(`No archives found for ${username} in the specified date range`);
        return '';
      }

      logger.info(`Found ${filteredArchives.length} archive(s) for ${username}`);

      const pgns: string[] = [];
      for (const archiveUrl of filteredArchives) {
        logger.debug(`Fetching archive: ${archiveUrl}`);
        const pgnUrl = `${archiveUrl}/pgn`;
        const pgnText = await this.httpGet(pgnUrl);
        pgns.push(pgnText);
      }

      return pgns.join('\n\n');
    } catch (error) {
      if (error instanceof FetchGamesError) {
        throw error;
      }
      console.error(error);
      throw new FetchGamesError(username);
    }
  }

  private filterArchivesByDate(archives: string[], start: Date, end: Date): string[] {
    return archives.filter((url) => {
      const match = url.match(/games\/(\d{4})\/(\d{2})$/);
      if (!match) return false;

      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const archiveDate = new Date(year, month - 1, 1);

      return archiveDate >= start && archiveDate <= end;
    });
  }

  private httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode === 429) {
              setTimeout(() => {
                this.httpGet(url).then(resolve).catch(reject);
              }, 1000);
            } else if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            } else {
              resolve(data);
            }
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}

export class LichessApiClient implements ApiClient {
  private readonly baseUrl = 'https://lichess.org/api/games/user';

  async fetchGames(username: string, startDate: Date, endDate: Date): Promise<string> {
    try {
      const params = new URLSearchParams({
        since: startDate.getTime().toString(),
        until: endDate.getTime().toString(),
        clocks: 'false',
        evals: 'false',
        opening: 'false',
      });

      const url = `${this.baseUrl}/${username}?${params.toString()}`;

      logger.info(`Fetching games from Lichess for user: ${username}`);

      const pgn = await this.httpGet(url);
      return pgn;
    } catch (error) {
      if (error instanceof FetchGamesError) {
        throw error;
      }
      throw new FetchGamesError(username);
    }
  }

  private httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode === 429) {
              setTimeout(() => {
                this.httpGet(url).then(resolve).catch(reject);
              }, 1000);
            } else if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            } else {
              resolve(data);
            }
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}
