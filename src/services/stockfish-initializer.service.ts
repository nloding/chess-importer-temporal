import { logger } from '../utils/logger.util';
import path from 'path';
import fs from 'fs';
import { StockfishInitializationError } from '../errors/stockfish.error';

type StockfishEngine = {
  locateFile: (filepath: string) => string,
  wasmBinary?: Buffer,
  _isReady?: () => boolean,
  sendCommand?: (cmd: string) => void,
  listener?: (line: string) => void,
  ccall?: (ident: string,
    returnType: string | null,
    argTypes: string[],
    args: any[],
    extra: any
  ) => any
}

const initializeStockfish = async (): Promise<StockfishEngine> => {
  try {
    logger.debug('Initializing Stockfish engine...');

    const pathToEngine = path.join(__dirname, "../../node_modules/stockfish/src/stockfish-17.1-8e4d048.js");
    const ext = path.extname(pathToEngine);
    const basepath = pathToEngine.slice(0, -ext.length);
    const wasmPath = basepath + ".wasm";
    const basename = path.basename(basepath);
    const engineDir = path.dirname(pathToEngine);
    const buffers: Buffer[] = [];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const stockfish = require(pathToEngine)();

    const engine: StockfishEngine = {
      locateFile: function (filepath: string): string {
        if (filepath.indexOf(".wasm") > -1) {
          if (filepath.indexOf(".wasm.map") > -1) {
            /// Set the path to the wasm map.
            return wasmPath + ".map"
          }
          /// Set the path to the wasm binary.
          return wasmPath;
        } else {
          return pathToEngine;
        }
      },
      sendCommand: (cmd: string): void => {
        /// Not sure why this needs to be async.
        setImmediate(() => {
          if (engine && engine.ccall) {
            engine.ccall("command", null, ["string"], [cmd], {async: /^go\b/.test(cmd)});
          }
        });
      }
    };
    
    /// We have to manually assemble the WASM parts, if the engine is split into parts.
    fs.readdirSync(engineDir).sort().forEach(function (filepath)
    {
      ///NOTE: These could be out of order without zero padding.
      if (filepath.startsWith(basename + "-part-") && filepath.endsWith(".wasm")) {
        buffers.push(fs.readFileSync(path.join(engineDir, filepath)));
      }
    });
    
    if (buffers.length) {
      engine.wasmBinary = Buffer.concat(buffers);
    }

    await stockfish(engine);

    const pauseFor10 = (): Promise<void> => new Promise<void>(resolve => setTimeout(resolve, 10));
    
    const waitForEngineReady = async (): Promise<void> => {
      if (engine && engine._isReady) {
        do {
          await pauseFor10();
        } while (!engine._isReady());

        delete engine._isReady;
      }
    }

    await waitForEngineReady();

    return engine;
  } catch (error) {
    console.log(error);
    throw new StockfishInitializationError();
  }
}

export {
  initializeStockfish,
  StockfishEngine
};