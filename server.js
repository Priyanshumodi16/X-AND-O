const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let games = {}; // Stores active games

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("chatMessage", (data) => {
        io.emit("chatMessage", data);
    });

    socket.on("disconnect", () => {
        console.log(`A player disconnected: ${socket.id}`);
});

    socket.on("createGame", () => {
        let gameCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        games[gameCode] = {
            players: [socket.id],
            board: Array(9).fill(""),
            turn: "X",
            restartRequest: null
        };
        socket.join(gameCode);
        socket.emit("gameCreated", gameCode);
    });

    socket.on("joinGame", (gameCode) => {
        if (games[gameCode] && games[gameCode].players.length === 1) {
            games[gameCode].players.push(socket.id);
            socket.join(gameCode);

            io.to(games[gameCode].players[0]).emit("gameStarted", { symbol: "X", gameCode });
            io.to(games[gameCode].players[1]).emit("gameStarted", { symbol: "O", gameCode });
        }
    });

    socket.on("makeMove", ({ gameCode, index, playerSymbol }) => {
        let game = games[gameCode];

        if (game && game.turn === playerSymbol && !game.board[index]) {
            game.board[index] = playerSymbol;
            game.turn = game.turn === "X" ? "O" : "X";
            io.to(gameCode).emit("updateBoard", { board: game.board, turn: game.turn });

            let winner = checkWinner(game.board);
            if (winner) {
                io.to(gameCode).emit("gameOver", { winner });
            }
        }
    });

    socket.on("restartGame", (gameCode) => {
        let game = games[gameCode];
        if (game && !game.restartRequest) {
            let opponentId = game.players.find((id) => id !== socket.id);
            game.restartRequest = socket.id;
            io.to(opponentId).emit("challengeRestart");
        }
    });

    socket.on("acceptRestart", (gameCode) => {
        let game = games[gameCode];
        if (game && game.restartRequest) {
            game.board = Array(9).fill("");
            game.turn = "X";
            game.restartRequest = null;
            io.to(gameCode).emit("gameRestarted");
        }
    });

    function checkWinner(board) {
        const winningCombos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let [a, b, c] of winningCombos) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a]; // Return winner symbol "X" or "O"
            }
        }
    
        // ✅ If board is full and no winner, return "Tie"
        if (!board.includes("")) {
            return "Game is Tie No-One";
        }
    
        return null;
    }
    
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
