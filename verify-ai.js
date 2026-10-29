const assert = require("node:assert/strict");
const { getBestMove } = require("./ai.js");

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function humanCanForceWin(board, turn, ai, human) {
  const result = winner(board);
  if (result) return result === human;
  if (board.every((cell) => cell !== null)) return false;

  if (turn === ai) {
    const move = getBestMove(board, ai, human);
    board[move] = ai;
    const humanWins = humanCanForceWin(board, human, ai, human);
    board[move] = null;
    return humanWins;
  }

  for (let i = 0; i < board.length; i++) {
    if (board[i] !== null) continue;
    board[i] = human;
    const humanWins = humanCanForceWin(board, ai, ai, human);
    board[i] = null;
    if (humanWins) return true;
  }
  return false;
}

for (const ai of ["X", "O"]) {
  const human = ai === "X" ? "O" : "X";
  for (const first of [ai, human]) {
    const board = Array(9).fill(null);
    if (first === ai) {
      const move = getBestMove(board, ai, human);
      board[move] = ai;
      assert.equal(humanCanForceWin(board, human, ai, human), false, `AI ${ai}, AI first`);
    } else {
      assert.equal(humanCanForceWin(board, human, ai, human), false, `AI ${ai}, human first`);
    }
  }
}

console.log("Hard AI verification passed: no human win is possible for AI-as-X or AI-as-O, with either side starting.");
