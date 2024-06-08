const express = require("express");
const app = express();
const socketio = require("socket.io");
const port = 3000;
const path = require("path");
const { Chess } = require("chess.js");

//Initialization
const expressServer = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
const io = socketio(expressServer);
const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index", { title: "Socket Chess Game" });
});

io.on("connection", (socket) => {
  // Checking socket connection
  console.log(socket.id + "has connected");
  socket.emit("mssgFromServer", "Hi From Server");
  socket.on("mssgFromClient", (data) => {
    console.log(data);
  });

  // - Server assigns role based on availability:
  //     - If slots empty:
  //         - Assign role (white/black)
  //         - Inform player
  //     - If slots full:
  //         - Designate as spectator

  // - Client connection:
  //     - Assign role based on game state:
  //         - If no white player, assign white role
  //         - If no black player, assign black role
  //         - Emit "playerRole" event with assigned role
  //         - If both slots filled, designate as spectator
  //         - Emit "spectatorRole" event

  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("spectatorRole", "You are a spectator");
  }

  // - Client disconnection:
  // - Remove assigned role from players object
  socket.on("disconnect", () => {
    if (players.white === socket.id) {
      players.white = null;
    } else if (players.black === socket.id) {
      players.black = null;
    }
    // No changes if a spectator disconnects
  });

  // - Listen for "move" events:
  //   - Validate correct player's turn
  //   - If valid:
  //       - Update game state
  //       - Broadcast move via "move" event
  //       - Send updated board state via "boardState" event
  //   - If invalid:
  //       - Log error message
  // - Send initial board state using FEN notation

  // We will send move event from client side
  socket.on("move", (move) => {
    // console.log(move);
    try {
      if (chess.turn() === "w" && socket.id !== players.white) {
        return;
      } else if (chess.turn() === "b" && socket.id !== players.black) {
        return;
      }
      // Object of Chess class
      // In the chess game, we move our piece and we get a result indicating whether the move is valid or not.
      // For example: Wrong move - pawn moving 4 squares ahead 🥹 - false
      const result = chess.move(move);

      // We will then send this result to the client side
      if (result) {
        currentPlayer = chess.turn(); // which ever player turn it is will be stored in the current player
        //We will send the currentPlayer move to the server - players and spectators both
        io.emit("move", move);
        // We will send the updated board state or current state to the client side to all the players and spectators
        // We will use the FEN notation to send the board state
        // https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRW2NnuicnXtGkJWQbgZsT_UD3VMTDb7iNguA&s
        io.emit("boardState", chess.fen());
      } else {
        socket.emit("moveError", move);
      }
    } catch (err) {
      // If the game engine fails
      console.log(err);
    }
  });
});
