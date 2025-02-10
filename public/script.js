const socket = io();
let gameCode = "";
let playerSymbol = "";

const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

// Generate a unique player ID (to differentiate users)
const playerId = `Player-${Math.floor(Math.random() * 1000)}`;

// ✅ FIX: Ensure only one event listener is added
if (!socket.hasListeners("chatMessage")) {
    socket.on("chatMessage", (data) => {
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("message");

        // Different styling for self and others
        if (data.playerId === playerId) {
            msgDiv.classList.add("self-message");
            msgDiv.innerHTML = `<strong>You:</strong> ${data.message}`;
        } else {
            msgDiv.classList.add("other-message");
            msgDiv.innerHTML = `<strong>${data.playerId}:</strong> ${data.message}`;
        }

        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to latest message
    });
}

// Function to send message
function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        socket.emit("chatMessage", { playerId, message });
        chatInput.value = ""; // Clear input
    }
}

// Click button to send message
sendBtn.addEventListener("click", sendMessage);

// Press Enter key to send message
chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

document.getElementById("createGame").addEventListener("click", () => {
    socket.emit("createGame");
});

document.getElementById("joinGame").addEventListener("click", () => {
    const code = document.getElementById("gameCode").value.trim();
    if (code) {
        socket.emit("joinGame", code);
    }
});

socket.on("gameCreated", (code) => {
    gameCode = code;
    document.getElementById("gameCodeDisplay").innerText = `Game Code: ${code}`;
});

socket.on("gameStarted", ({ symbol, gameCode: code }) => {
    playerSymbol = symbol;
    gameCode = code;
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "block";
    document.getElementById("status").innerText = `You are ${playerSymbol}`;
});

document.querySelectorAll(".cell").forEach((cell, index) => {
    cell.addEventListener("click", () => {
        socket.emit("makeMove", { gameCode, index, playerSymbol });
    });
});

socket.on("updateBoard", ({ board, turn }) => {
    document.querySelectorAll(".cell").forEach((cell, index) => {
        cell.innerText = board[index] || "";
    });
    document.getElementById("status").innerText = `Turn: ${turn}`;
});

socket.on("gameOver", ({ winner }) => {
    document.getElementById("status").innerText = `${winner} Wins!`;
    document.getElementById("restartBtn").style.display = "block"; // Show restart button
});

document.getElementById("restartBtn").addEventListener("click", () => {
    socket.emit("restartGame", gameCode);
    document.getElementById("restartBtn").style.display = "none"; // Hide button until confirmed
});

socket.on("challengeRestart", () => {
    const confirmRestart = confirm("Opponent wants to restart the game. Accept?");
    if (confirmRestart) {
        socket.emit("acceptRestart", gameCode);
    }
});

socket.on("gameRestarted", () => {
    document.querySelectorAll(".cell").forEach((cell) => (cell.innerText = ""));
    document.getElementById("status").innerText = "Game restarted! X starts first.";
    document.getElementById("restartBtn").style.display = "none"; // Hide button after restart
});

socket.on("gameOver", (data) => {
    let messageArea = document.getElementById("gameMessage"); // Assuming this element exists

    if (data.winner === "Game is tie") {
        messageArea.innerText = "Game is Tied!";  // ✅ Shows only "Game is Tied!"
    } else {
        messageArea.innerText = `Player ${data.winner} !`;
    }

    document.getElementById("restartBtn").style.display = "block"; // ✅ Restart button appears
});




