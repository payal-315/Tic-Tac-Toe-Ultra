const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { getBestMove } = require("./ai.js");

class Element {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.textContent = "";
    this.style = {};
    this.attributes = {};
    this.hidden = false;
    this.listeners = {};
    this.classes = new Set();
    this.classList = {
      add: (...names) => names.forEach((name) => this.classes.add(name)),
      remove: (...names) => names.forEach((name) => this.classes.delete(name)),
      toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name),
      contains: (name) => this.classes.has(name),
    };
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  setAttribute(name, value) { this.attributes[name] = value; }
  focus() {}
  click() { this.listeners.click?.(); }
}

const cells = Array.from({ length: 9 }, (_, i) => new Element());
const modeButtons = [new Element({ mode: "human" }), new Element({ mode: "ai" })];
const playerButtons = [new Element({ player: "X" }), new Element({ player: "O" })];
const firstButtons = [new Element({ first: "p1" }), new Element({ first: "p2" })];
const difficultyButtons = ["easy", "medium", "hard"].map((difficulty) => new Element({ difficulty }));
const elements = {
  "#status": new Element(), "#score-p1": new Element(), "#score-p2": new Element(),
  "#overlay": new Element(), "#result-symbol": new Element(), "#result-text": new Element(),
  "#replay": new Element(), "#reset": new Element(), "#background": new Element(),
  ".choice-group": new Element(), ".first-player-group": new Element(), ".difficulty-group": new Element(),
};
const canvasContext = {
  setTransform() {}, clearRect() {}, save() {}, translate() {}, rotate() {}, fillText() {}, restore() {},
};
elements["#background"].getContext = () => canvasContext;

const timers = new Map();
let nextTimer = 1;
const window = {
  innerWidth: 320, innerHeight: 640, devicePixelRatio: 1, getBestMove,
  setTimeout(callback) { const id = nextTimer++; timers.set(id, callback); return id; },
  clearTimeout(id) { timers.delete(id); },
  addEventListener() {},
};
const document = {
  querySelector(selector) { return elements[selector]; },
  querySelectorAll(selector) {
    return selector === ".cell" ? cells
      : selector === ".mode-button" ? modeButtons
      : selector === ".choice-button" ? playerButtons
      : selector === ".first-player-button" ? firstButtons
      : selector === ".difficulty-button" ? difficultyButtons : [];
  },
};
const context = vm.createContext({
  document, window, Math, Array, Set, Infinity, requestAnimationFrame() {}, console,
});
vm.runInContext(fs.readFileSync("./script.js", "utf8"), context);

function setState({ mode, p1, first = "p1", board, xTurn, aiThinking = false }) {
  const p2 = p1 === "X" ? "O" : "X";
  vm.runInContext(`gameMode=${JSON.stringify(mode)}; p1Symbol=${JSON.stringify(p1)}; p2Symbol=${JSON.stringify(p2)}; youSymbol=${JSON.stringify(p1)}; aiSymbol=${JSON.stringify(p2)}; firstPlayer=${JSON.stringify(first)}; board=${JSON.stringify(board)}; currentTurn=${JSON.stringify(xTurn ? "X" : "O")}; aiThinking=${aiThinking}; gameOver=false;`, context);
}
function read(expression) { return vm.runInContext(expression, context); }
function firePendingTimer() {
  const [id, callback] = timers.entries().next().value ?? [];
  assert.ok(callback, "expected a scheduled AI move");
  timers.delete(id);
  callback();
}

// Opening mover follows the participant selector alone, regardless of symbol.
context.setP1Symbol("X");
context.setFirstPlayer("p1");
assert.equal(read("currentTurn"), "X");
assert.equal(timers.size, 0);
context.setP1Symbol("O");
assert.equal(read("currentTurn"), "O", "You First must allow O to open");
assert.equal(timers.size, 0, "AI must wait for your O move");
cells[0].click();
assert.equal(read("board[0]"), "O");
assert.equal(read("currentTurn"), "X");
assert.equal(timers.size, 1);
assert.equal(read("aiThinking"), true);
const staleCallback = timers.values().next().value;
context.setP1Symbol("X");
assert.equal(timers.size, 0, "symbol change cancels the pending AI move");
staleCallback();
assert.equal(read("board.every((cell) => !cell)"), true, "cancelled AI callback cannot move in the new round");

context.setFirstPlayer("p2");
assert.equal(read("currentTurn"), "O", "AI First with You=X starts with AI's O");
assert.equal(timers.size, 1);
firePendingTimer();
assert.equal(read("board.filter(Boolean).length"), 1, "AI opening callback makes exactly one move");
assert.equal(read("board.find(Boolean)"), "O");
assert.equal(read("currentTurn"), "X", "turn returns to you after the AI opens");
assert.equal(timers.size, 0, "AI does not schedule a second move");
context.setP1Symbol("O");
assert.equal(read("currentTurn"), "X", "AI First with You=O starts with AI's X");
assert.equal(timers.size, 1);
firePendingTimer();
assert.equal(read("board.filter(Boolean).length"), 1);
assert.equal(read("board.find(Boolean)"), "X");
assert.equal(read("currentTurn"), "O", "turn returns to you after the AI opens");
assert.equal(timers.size, 0);
context.setFirstPlayer("p1");
assert.equal(read("currentTurn"), "O", "You First with You=O starts with your O");
assert.equal(timers.size, 0);

// (a) YOU, as X, win against the AI.
setState({ mode: "ai", p1: "X", board: ["X", "X", "", "O", "O", "", "", "", ""], xTurn: true });
context.makeMove(2);
assert.equal(read("scores.you"), 1);
assert.equal(elements["#score-p1"].textContent, "YOU: 1");
assert.equal(elements["#result-text"].textContent, "YOU WIN!");

// (b) The AI, as X, completes its winning line when the player chose O.
setState({ mode: "ai", p1: "O", board: ["X", "X", "", "O", "", "O", "", "", ""], xTurn: true, aiThinking: true });
context.makeMove(2, true);
assert.equal(read("scores.ai"), 1);
assert.equal(elements["#score-p2"].textContent, "AI: 1");
assert.equal(elements["#result-text"].textContent, "AI WINS!");

// A queued move cannot run after the round ends, even if its callback fires late.
setState({ mode: "ai", p1: "O", board: Array(9).fill(""), xTurn: true });
context.queueAiTurn();
const callbackAfterEnd = timers.values().next().value;
context.finishRound(null);
callbackAfterEnd();
assert.equal(read("board.every((cell) => !cell)"), true, "AI must not move after a draw/end state");
assert.equal(timers.size, 0);

// (c) Switching symbols in a new round keeps scores with the same participants.
context.resetGame(false);
setState({ mode: "ai", p1: "O", board: ["O", "O", "", "X", "X", "", "", "", ""], xTurn: false });
context.makeMove(2);
assert.equal(read("scores.you"), 2);
assert.equal(read("scores.ai"), 1);

// (d) Player 1 wins as O, then Player 2 wins after Player 1 switches to X.
context.setGameMode("human");
context.setP1Symbol("O");
setState({ mode: "human", p1: "O", board: ["O", "O", "", "X", "X", "", "", "", ""], xTurn: false });
context.makeMove(2);
assert.equal(read("scores.p1"), 1);
assert.equal(elements["#result-text"].textContent, "PLAYER 1 WINS!");
context.setP1Symbol("X");
setState({ mode: "human", p1: "X", board: ["O", "O", "", "X", "X", "", "", "", ""], xTurn: false });
context.makeMove(2);
assert.equal(read("scores.p2"), 1);
assert.equal(elements["#result-text"].textContent, "PLAYER 2 WINS!");

// (e) A draw changes neither participant's score.
const p1BeforeDraw = read("scores.p1");
const p2BeforeDraw = read("scores.p2");
setState({ mode: "human", p1: "X", board: ["X", "O", "X", "X", "O", "O", "O", "X", ""], xTurn: true });
context.makeMove(8);
assert.equal(elements["#result-text"].textContent, "DRAW");
assert.equal(read("scores.p1"), p1BeforeDraw);
assert.equal(read("scores.p2"), p2BeforeDraw);

// (f) Mode changes refresh labels/options and reset scores; AI-only status is removed.
context.setGameMode("ai");
assert.equal(elements[".difficulty-group"].hidden, false);
assert.equal(playerButtons[0].textContent, "You: X");
assert.equal(firstButtons[0].textContent, "You First");
assert.equal(elements["#score-p1"].textContent, "YOU: 0");
assert.equal(elements["#score-p2"].textContent, "AI: 0");
context.setGameMode("human");
assert.equal(elements[".difficulty-group"].hidden, true);
assert.equal(playerButtons[0].textContent, "Player 1: X");
assert.equal(firstButtons[0].textContent, "Player 1 First");
assert.equal(elements["#score-p1"].textContent, "PLAYER 1: 0");
assert.equal(elements["#score-p2"].textContent, "PLAYER 2: 0");
assert.equal(elements["#status"].textContent, "PLAYER 1'S TURN");
assert.equal(timers.size, 0);

console.log("Participant scoring checks passed for wins, symbol changes, draws, mode labels, option visibility, and stale AI timers.");
