(function (root) {
  "use strict";

  const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  function getWinner(board) {
    for (const [a, b, c] of WIN_LINES) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return null;
  }

  function minimax(board, depth, maximizing, aiSymbol, humanSymbol, alpha, beta) {
    const winner = getWinner(board);
    if (winner === aiSymbol) return 10 - depth;
    if (winner === humanSymbol) return depth - 10;
    if (board.every((cell) => cell !== null && cell !== "")) return 0;

    if (maximizing) {
      let best = -Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] !== null && board[i] !== "") continue;
        const previous = board[i];
        board[i] = aiSymbol;
        best = Math.max(best, minimax(board, depth + 1, false, aiSymbol, humanSymbol, alpha, beta));
        board[i] = previous;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }

    let best = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] !== null && board[i] !== "") continue;
      const previous = board[i];
      board[i] = humanSymbol;
      best = Math.min(best, minimax(board, depth + 1, true, aiSymbol, humanSymbol, alpha, beta));
      board[i] = previous;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  function getBestMove(board, aiSymbol, humanSymbol) {
    if (!Array.isArray(board) || board.length !== 9) throw new TypeError("Board must be a 9-element array");
    if (!aiSymbol || !humanSymbol || aiSymbol === humanSymbol) throw new TypeError("AI and human symbols must be different");
    let bestScore = -Infinity;
    let bestMove = null;

    // Center and corners first gives a strong opening while preserving minimax optimality.
    for (const i of [4, 0, 2, 6, 8, 1, 3, 5, 7]) {
      if (board[i] !== null && board[i] !== "") continue;
      const previous = board[i];
      board[i] = aiSymbol;
      const score = minimax(board, 0, false, aiSymbol, humanSymbol, -Infinity, Infinity);
      board[i] = previous;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
    return bestMove;
  }

  root.getBestMove = getBestMove;
  if (typeof module !== "undefined" && module.exports) module.exports = { getBestMove };
})(typeof globalThis !== "undefined" ? globalThis : window);
