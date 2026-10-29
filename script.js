const cells = Array.from(document.querySelectorAll(".cell"));
const statusLabel = document.querySelector("#status");
const scoreP1 = document.querySelector("#score-p1");
const scoreP2 = document.querySelector("#score-p2");
const overlay = document.querySelector("#overlay");
const resultSymbol = document.querySelector("#result-symbol");
const resultText = document.querySelector("#result-text");
const replayButton = document.querySelector("#replay");
const resetButton = document.querySelector("#reset");
const canvas = document.querySelector("#background");
const ctx = canvas.getContext("2d");
const modeButtons = document.querySelectorAll(".mode-button");
const playerButtons = document.querySelectorAll(".choice-button");
const firstPlayerButtons = document.querySelectorAll(".first-player-button");
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
let currentTurn = "X";
let gameOver = false;
const scores = { p1: 0, p2: 0, you: 0, ai: 0 };
let stickers = [];
let gameMode = "ai";
let difficulty = "hard";
let p1Symbol = "X";
let p2Symbol = "O";
let youSymbol = "X";
let aiSymbol = "O";
let firstPlayer = "p1";
let aiThinking = false;
let aiTimeout = null;
let gameGeneration = 0;

const AI_DELAY_MS = 520;
const DIFFICULTY_BEST_MOVE_CHANCE = { easy: 0.3, medium: 0.5, hard: 1 };

function isHumanTurn() {
  if (gameMode !== "ai") return true;
  return currentTurn === youSymbol;
}

function getCurrentParticipant() {
  if (gameMode === "ai") return currentTurn === youSymbol ? "you" : "ai";
  return currentTurn === p1Symbol ? "p1" : "p2";
}

function setTurnLabel() {
  if (gameOver) {
    statusLabel.textContent = "Game Over";
    statusLabel.style.color = "var(--text)";
    return;
  }

  if (gameMode === "ai") {
    if (aiThinking) {
      statusLabel.textContent = "AI THINKING...";
      statusLabel.style.color = aiSymbol === "X" ? "var(--x)" : "var(--o)";
      return;
    }
    if (isHumanTurn()) {
      statusLabel.textContent = "YOUR TURN";
      statusLabel.style.color = youSymbol === "X" ? "var(--x)" : "var(--o)";
    } else {
      statusLabel.textContent = "AI THINKING...";
      statusLabel.style.color = aiSymbol === "X" ? "var(--x)" : "var(--o)";
    }
    return;
  }

  statusLabel.textContent = getCurrentParticipant() === "p1" ? "PLAYER 1'S TURN" : "PLAYER 2'S TURN";
  statusLabel.style.color = currentTurn === "X" ? "var(--x)" : "var(--o)";
}

function updateScore() {
  const isAiMode = gameMode === "ai";
  scoreP1.textContent = `${isAiMode ? "YOU" : "PLAYER 1"}: ${isAiMode ? scores.you : scores.p1}`;
  scoreP2.textContent = `${isAiMode ? "AI" : "PLAYER 2"}: ${isAiMode ? scores.ai : scores.p2}`;
}

function updateModeOptions() {
  const isAiMode = gameMode === "ai";
  const firstLabels = isAiMode
    ? { p1: "You First", p2: "AI First" }
    : { p1: "Player 1 First", p2: "Player 2 First" };

  playerButtons.forEach((button) => {
    button.textContent = `${isAiMode ? "You" : "Player 1"}: ${button.dataset.player}`;
    button.classList.toggle("active", button.dataset.player === p1Symbol);
  });
  firstPlayerButtons.forEach((button) => {
    button.textContent = firstLabels[button.dataset.first];
    button.classList.toggle("active", button.dataset.first === firstPlayer);
  });
  document.querySelector(".difficulty-group").hidden = !isAiMode;
  document.querySelector(".choice-group").setAttribute("aria-label", isAiMode ? "Choose your symbol" : "Choose Player 1's symbol");
  document.querySelector(".first-player-group").setAttribute("aria-label", isAiMode ? "Who goes first" : "Which player goes first");
  updateScore();
}

function getWinnerFromBoard(gameBoard = board) {
  for (const [a, b, c] of wins) {
    if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
      return gameBoard[a];
    }
  }
  return "";
}

function makeMove(index, isAiMove = false) {
  if (board[index] || gameOver) return;

  if (gameMode === "ai") {
    if (isAiMove ? (!aiThinking || currentTurn !== aiSymbol) : (aiThinking || currentTurn !== youSymbol)) return;
  } else if (isAiMove) {
    return;
  }
  if (isAiMove) aiThinking = false;

  const symbol = currentTurn;
  board[index] = symbol;
  cells[index].textContent = symbol;
  cells[index].classList.add(symbol.toLowerCase());
  cells[index].setAttribute("aria-label", `Cell ${index + 1}, ${symbol}`);

  const winner = getWinnerFromBoard();
  if (winner) {
    finishRound(winner);
    return;
  }

  if (board.every(Boolean)) {
    finishRound(null);
    return;
  }

  currentTurn = currentTurn === "X" ? "O" : "X";
  setTurnLabel();

  if (gameMode === "ai" && currentTurn === aiSymbol && !gameOver) {
    queueAiTurn();
  }
}

function finishRound(winnerSymbol) {
  if (gameOver) return;
  gameOver = true;
  cancelAiTurn();

  let message = "DRAW";
  if (winnerSymbol) {
    const participant = gameMode === "ai"
      ? (winnerSymbol === youSymbol ? "you" : "ai")
      : (winnerSymbol === p1Symbol ? "p1" : "p2");
    scores[participant]++;
    message = gameMode === "ai"
      ? (participant === "you" ? "YOU WIN!" : "AI WINS!")
      : (participant === "p1" ? "PLAYER 1 WINS!" : "PLAYER 2 WINS!");
  }

  updateScore();
  setTurnLabel();
  showResult(winnerSymbol || "=", message);
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
  cancelAiTurn();
  board = Array(9).fill("");
  if (gameMode === "ai") {
    const firstMover = firstPlayer === "p1" ? "you" : "ai";
    currentTurn = firstMover === "you" ? youSymbol : aiSymbol;
  } else {
    const startingSymbol = firstPlayer === "p1" ? p1Symbol : p2Symbol;
    currentTurn = startingSymbol;
  }
  gameOver = false;

  cells.forEach((cell, index) => {
    cell.textContent = "";
    cell.classList.remove("x", "o");
    cell.setAttribute("aria-label", `Cell ${index + 1}`);
  });

  if (resetScores) {
    scores.p1 = 0;
    scores.p2 = 0;
    scores.you = 0;
    scores.ai = 0;
    updateScore();
  }

  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden", "true");
  setTurnLabel();

  if (gameMode === "ai" && currentTurn === aiSymbol && !gameOver) {
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
    .map((cell, index) => (!cell ? index : null))
    .filter((index) => index !== null);
}

function chooseAiMove() {
  const availableMoves = getAvailableMoves(board);

  if (availableMoves.length === 0) return null;
  const bestMove = window.getBestMove([...board], aiSymbol, youSymbol);
  const bestMoveChance = DIFFICULTY_BEST_MOVE_CHANCE[difficulty] ?? 1;
  return Math.random() < bestMoveChance
    ? bestMove
    : availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function queueAiTurn() {
  if (gameMode !== "ai" || gameOver || currentTurn !== aiSymbol || aiThinking || aiTimeout !== null) return;

  aiThinking = true;
  setTurnLabel();
  const scheduledGeneration = gameGeneration;

  const timeoutId = window.setTimeout(() => {
    if (aiTimeout === timeoutId) aiTimeout = null;
    if (scheduledGeneration !== gameGeneration || gameMode !== "ai" || gameOver || currentTurn !== aiSymbol) return;

    const move = chooseAiMove();

    if (move !== null) {
      makeMove(move, true);
    } else {
      setTurnLabel();
    }
  }, AI_DELAY_MS);
  aiTimeout = timeoutId;
}

function cancelAiTurn() {
  gameGeneration++;
  if (aiTimeout !== null) {
    window.clearTimeout(aiTimeout);
    aiTimeout = null;
  }
  aiThinking = false;
}

function setGameMode(mode) {
  if (gameMode === mode) return;
  cancelAiTurn();
  gameMode = mode;
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
  });

  updateModeOptions();
  resetGame(true);
}

function setP1Symbol(symbol) {
  if (p1Symbol === symbol) return;
  cancelAiTurn();
  p1Symbol = symbol;
  p2Symbol = symbol === "X" ? "O" : "X";
  youSymbol = p1Symbol;
  aiSymbol = p2Symbol;

  updateModeOptions();
  resetGame(false);
}

function setFirstPlayer(player) {
  if (firstPlayer === player) return;
  cancelAiTurn();
  firstPlayer = player;
  updateModeOptions();
  resetGame(false);
}

function setDifficulty(level) {
  if (difficulty === level) return;
  cancelAiTurn();
  difficulty = level;
  difficultyButtons.forEach((button) => {
    const isActive = button.dataset.difficulty === level;
    button.classList.toggle("active", isActive);
  });

  if (gameMode === "ai") {
    resetGame(false);
  }
}

cells.forEach((cell, index) => {
  cell.addEventListener("click", () => makeMove(index));
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setGameMode(button.dataset.mode));
});

playerButtons.forEach((button) => {
  button.addEventListener("click", () => setP1Symbol(button.dataset.player));
});

firstPlayerButtons.forEach((button) => {
  button.addEventListener("click", () => setFirstPlayer(button.dataset.first));
});

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => setDifficulty(button.dataset.difficulty));
});

replayButton.addEventListener("click", () => resetGame(false));
resetButton.addEventListener("click", () => resetGame(true));
window.addEventListener("resize", resizeCanvas);

setTurnLabel();
updateModeOptions();
resizeCanvas();
drawBackground();
