const cells = Array.from(document.querySelectorAll(".cell"));
const statusLabel = document.querySelector("#status");
const scoreX = document.querySelector("#score-x");
const scoreO = document.querySelector("#score-o");
const overlay = document.querySelector("#overlay");
const resultSymbol = document.querySelector("#result-symbol");
const resultText = document.querySelector("#result-text");
const replayButton = document.querySelector("#replay");
const resetButton = document.querySelector("#reset");
const canvas = document.querySelector("#background");
const ctx = canvas.getContext("2d");
const modeButtons = document.querySelectorAll(".mode-button");
const playerButtons = document.querySelectorAll(".choice-button");
const difficultyButtons = document.querySelectorAll(".difficulty-button");

const wins = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

let board = Array(9).fill("");
let xTurn = true;
let gameOver = false;
let xScore = 0;
let oScore = 0;
let stickers = [];
let gameMode = "ai";
let difficulty = "hard";
let humanSymbol = "X";
let aiThinking = false;

function isHumanTurn() {
  if (gameMode !== "ai") return true;
  return (xTurn && humanSymbol === "X") || (!xTurn && humanSymbol === "O");
}

function setTurnLabel() {
  if (gameOver) {
    statusLabel.textContent = "Game Over";
    statusLabel.style.color = "var(--text)";
    return;
  }

  if (gameMode === "ai") {
    if (isHumanTurn()) {
      statusLabel.textContent = humanSymbol === "X" ? "Your turn" : "Your turn";
      statusLabel.style.color = humanSymbol === "X" ? "var(--x)" : "var(--o)";
    } else {
      statusLabel.textContent = "AI turn";
      statusLabel.style.color = xTurn ? "var(--x)" : "var(--o)";
    }
    return;
  }

  statusLabel.textContent = xTurn ? "Player X" : "Player O";
  statusLabel.style.color = xTurn ? "var(--x)" : "var(--o)";
}

function updateScore() {
  scoreX.textContent = `X: ${xScore}`;
  scoreO.textContent = `O: ${oScore}`;
}

function getWinnerFromBoard(gameBoard = board) {
  for (const [a, b, c] of wins) {
    if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
      return gameBoard[a];
    }
  }
  return "";
}

function makeMove(index) {
  if (board[index] || gameOver || aiThinking) return;

  if (gameMode === "ai" && !isHumanTurn()) {
    return;
  }

  const symbol = xTurn ? "X" : "O";
  board[index] = symbol;
  cells[index].textContent = symbol;
  cells[index].classList.add(symbol.toLowerCase());
  cells[index].setAttribute("aria-label", `Cell ${index + 1}, ${symbol}`);

  const winner = getWinnerFromBoard();
  if (winner) {
    gameOver = true;
    winner === "X" ? xScore++ : oScore++;
    updateScore();
    showResult(winner, "Victorious!");
    return;
  }

  if (board.every(Boolean)) {
    gameOver = true;
    showResult("=", "Draw Game");
    return;
  }

  xTurn = !xTurn;
  setTurnLabel();

  if (gameMode === "ai" && !isHumanTurn() && !gameOver) {
    queueAiTurn();
  }
}

function showResult(symbol, message) {
  resultSymbol.textContent = symbol;
  resultSymbol.style.color =
    symbol === "X" ? "var(--x)" : symbol === "O" ? "var(--o)" : "var(--muted)";
  resultText.textContent = message;
  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
  replayButton.focus();
}

function resetGame(resetScores = false) {
  board = Array(9).fill("");
  xTurn = true;
  gameOver = false;
  aiThinking = false;

  if (gameMode === "ai" && humanSymbol === "O") {
    xTurn = false;
  }

  cells.forEach((cell, index) => {
    cell.textContent = "";
    cell.classList.remove("x", "o");
    cell.setAttribute("aria-label", `Cell ${index + 1}`);
  });

  if (resetScores) {
    xScore = 0;
    oScore = 0;
    updateScore();
  }

  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden", "true");
  setTurnLabel();

  if (gameMode === "ai" && !isHumanTurn() && !gameOver) {
    queueAiTurn();
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  stickers = Array.from({ length: 30 }, () => createSticker(true));
}

function createSticker(firstTime = false) {
  const symbol = Math.random() > 0.5 ? "X" : "O";
  return {
    x: Math.random() * window.innerWidth,
    y: firstTime ? Math.random() * window.innerHeight : -80,
    speed: Math.random() * 1.5 + 0.5,
    angle: ((Math.random() * 20 + 80) * Math.PI) / 180,
    rotation: Math.random() * 360,
    rotationSpeed: Math.random() * 2 - 1,
    size: Math.random() * 20 + 18,
    symbol,
    color: symbol === "X" ? "rgba(0, 255, 200, 0.16)" : "rgba(255, 40, 100, 0.16)",
  };
}

function drawBackground() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  stickers.forEach((sticker, index) => {
    sticker.x += Math.cos(sticker.angle) * sticker.speed;
    sticker.y += Math.sin(sticker.angle) * sticker.speed;
    sticker.rotation += sticker.rotationSpeed;

    if (sticker.y > window.innerHeight + 80) {
      stickers[index] = createSticker(false);
      return;
    }

    ctx.save();
    ctx.translate(sticker.x, sticker.y);
    ctx.rotate((sticker.rotation * Math.PI) / 180);
    ctx.font = `900 ${sticker.size}px Arial`;
    ctx.fillStyle = sticker.color;
    ctx.fillText(sticker.symbol, 0, 0);
    ctx.restore();
  });

  requestAnimationFrame(drawBackground);
}

function getAvailableMoves(gameBoard) {
  return gameBoard
    .map((cell, index) => (cell === "" ? index : null))
    .filter((index) => index !== null);
}

function minimax(gameBoard, depth, isMaximizing, aiSymbol, humanSymbol) {
  const winner = getWinnerFromBoard(gameBoard);

  if (winner === aiSymbol) return 10 - depth;
  if (winner === humanSymbol) return depth - 10;
  if (gameBoard.every(Boolean)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;

    for (const move of getAvailableMoves(gameBoard)) {
      const nextBoard = [...gameBoard];
      nextBoard[move] = aiSymbol;
      const score = minimax(nextBoard, depth + 1, false, aiSymbol, humanSymbol);
      bestScore = Math.max(bestScore, score);
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (const move of getAvailableMoves(gameBoard)) {
    const nextBoard = [...gameBoard];
    nextBoard[move] = humanSymbol;
    const score = minimax(nextBoard, depth + 1, true, aiSymbol, humanSymbol);
    bestScore = Math.min(bestScore, score);
  }

  return bestScore;
}

function findBestMove() {
  const aiSymbol = humanSymbol === "X" ? "O" : "X";
  const humanMark = humanSymbol;

  let bestScore = -Infinity;
  let bestMove = null;

  for (const move of getAvailableMoves(board)) {
    const nextBoard = [...board];
    nextBoard[move] = aiSymbol;

    const score = minimax(nextBoard, 0, false, aiSymbol, humanMark);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function chooseAiMove() {
  const availableMoves = getAvailableMoves(board);

  if (availableMoves.length === 0) return null;

  if (difficulty === "easy") {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  return findBestMove();
}

function queueAiTurn() {
  if (gameMode !== "ai" || gameOver || isHumanTurn()) return;

  aiThinking = true;
  setTurnLabel();

  window.setTimeout(() => {
    if (gameOver) return;

    const move = chooseAiMove();

    aiThinking = false;

    if (move !== null) {
      makeMove(move);
    } else {
      setTurnLabel();
    }
  }, 420);
}

function setGameMode(mode) {
  gameMode = mode;
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
  });

  resetGame(true);
}

function setHumanSymbol(symbol) {
  humanSymbol = symbol;
  playerButtons.forEach((button) => {
    const isActive = button.dataset.player === symbol;
    button.classList.toggle("active", isActive);
  });

  resetGame(true);
}

function setDifficulty(level) {
  difficulty = level;
  difficultyButtons.forEach((button) => {
    const isActive = button.dataset.difficulty === level;
    button.classList.toggle("active", isActive);
  });

  if (gameMode === "ai") {
    resetGame(true);
  }
}

cells.forEach((cell, index) => {
  cell.addEventListener("click", () => makeMove(index));
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setGameMode(button.dataset.mode));
});

playerButtons.forEach((button) => {
  button.addEventListener("click", () => setHumanSymbol(button.dataset.player));
});

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => setDifficulty(button.dataset.difficulty));
});

replayButton.addEventListener("click", () => resetGame(false));
resetButton.addEventListener("click", () => resetGame(true));
window.addEventListener("resize", resizeCanvas);

setTurnLabel();
updateScore();
resizeCanvas();
drawBackground();
