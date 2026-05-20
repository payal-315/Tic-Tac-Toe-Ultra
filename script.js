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

function setTurnLabel() {
  statusLabel.textContent = xTurn ? "Player X" : "Player O";
  statusLabel.style.color = xTurn ? "var(--x)" : "var(--o)";
}

function updateScore() {
  scoreX.textContent = `X: ${xScore}`;
  scoreO.textContent = `O: ${oScore}`;
}

function makeMove(index) {
  if (board[index] || gameOver) return;

  const symbol = xTurn ? "X" : "O";
  board[index] = symbol;
  cells[index].textContent = symbol;
  cells[index].classList.add(symbol.toLowerCase());
  cells[index].setAttribute("aria-label", `Cell ${index + 1}, ${symbol}`);

  const winner = getWinner();
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
}

function getWinner() {
  for (const [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return "";
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

cells.forEach((cell, index) => {
  cell.addEventListener("click", () => makeMove(index));
});

replayButton.addEventListener("click", () => resetGame(false));
resetButton.addEventListener("click", () => resetGame(true));
window.addEventListener("resize", resizeCanvas);

setTurnLabel();
updateScore();
resizeCanvas();
drawBackground();
