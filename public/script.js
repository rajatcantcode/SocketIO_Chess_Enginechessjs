const socket = io();
const chess = new Chess();

const chessboard = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null; // From where the piece is dragged
let playerRole = null;

const renderboard = () => {
  // We will get an 8 array where 1 array is representing 1 row with pieces also
  // We will loop through the array and render the pieces
  chessboard.innerHTML = "";
  const board = chess.board();
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareDiv = document.createElement("div");
      squareDiv.classList.add(
        "square",
        // Forming the square color
        rowIndex % 2 === squareIndex % 2 ? "light" : "dark"
      );
      squareDiv.dataset.row = rowIndex;
      squareDiv.dataset.column = squareIndex;

      if (square !== null) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerHTML = getPieceUnicode(square);
        pieceElement.draggable = square.color === playerRole; // Will give boolean value
        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, column: squareIndex };
            // Sometimes there is a bug where the piece is not dragged
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        // We attached the piece element to the square div
        squareDiv.appendChild(pieceElement);
      }

      squareDiv.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareDiv.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareDiv.dataset.row),
            column: parseInt(squareDiv.dataset.column),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      chessboard.appendChild(squareDiv);
    });
  });

  if (playerRole === "b") {
    chessboard.classList.add("flipped");
  } else {
    chessboard.classList.remove("flipped");
  }
};

const handleMove = (sourceSquare, targetSquare) => {
  const move = {
    from: `${String.fromCharCode(97 + sourceSquare.column)}${
      8 - sourceSquare.row
    }`,
    to: `${String.fromCharCode(97 + targetSquare.column)}${
      8 - targetSquare.row
    }`,
    promotion: "q", // By default, we are promoting to queen
  };
  socket.emit("move", move);
};

socket.on("playerRole", (role) => {
  playerRole = role;
  renderboard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderboard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderboard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderboard();
});

// This is just to bring to organize the assets of the chess pieces
const getPieceUnicode = (piece) => {
  const unicodePieces = {
    k: "\u2654", // ♔
    q: "\u2655", // ♕
    r: "\u2656", // ♖
    b: "\u2657", // ♗
    n: "\u2658", // ♘
    p: "\u2659", // ♙
    K: "\u265A", // ♚
    Q: "\u265B", // ♛
    R: "\u265C", // ♜
    B: "\u265D", // ♝
    N: "\u265E", // ♞
    P: "\u265F", // ♟
  };
  return unicodePieces[piece.type] || "";
};

// Initial rendering of the board
renderboard();
