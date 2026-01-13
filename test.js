const Stockfish = require("stockfish");

// The engine takes some time to initialize automatically when required.
// We need a way to communicate with it asynchronously.
// The stockfish module exposes a 'uci(command)' function for input and 
// expects you to reassign 'emit(response)' to handle output.

// In newer implementations, you might use a promise-based approach or 
// an event listener if the module is designed to run in a web worker context.
// The following code demonstrates a common way to use a modern stockfish module:

const engine = Stockfish(); // Initialize the engine

// Use an event listener to handle the engine's output
engine.addMessageListener((output) => {
    console.log(`Engine Output: ${output}`);

    // Check if the output contains the 'bestmove'
    if (output.includes("bestmove")) {
        const bestmove = output.split(/ +/)[1];
        console.log(`Best move found: ${bestmove}`);
        // You can now process the move or send the next command
    }
});

// Send UCI commands to the engine
engine.postMessage("uci"); // Initialize UCI mode
engine.postMessage("ucinewgame"); // Start a new game
engine.postMessage("position startpos"); // Set the position to the start
engine.postMessage("go depth 20");