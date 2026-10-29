# Tic-Tac-Toe Ultra

A modern, responsive Tic-Tac-Toe game for the browser, with an unbeatable AI opponent and custom particle effects. It started as a Java Swing desktop game and is now a static web app deployed on Vercel.

**Play it live:** https://tic-tac-toe-ultra.vercel.app

## Features

- **Two game modes**
  - **2 Players:** Player 1 vs Player 2 on the same device.
  - **VS AI:** play against the computer.
- **AI opponent** built on the minimax algorithm with three difficulty levels: Easy, Medium and Hard. Hard never loses.
- **Choose your mark** (X or O) before every round.
- **Choose who goes first:** You / AI in VS AI mode, Player 1 / Player 2 in 2 Players mode. Turn order is independent of the mark you pick.
- **Scores follow the players, not the marks:** YOU vs AI, or Player 1 vs Player 2. Scores carry over between rounds, even when marks change, and reset when you switch modes.
- **Responsive layout** that works on phones, tablets and desktops.
- **Particle effects** and a dark neon look.

## Project Structure

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `styles.css` | Styling and responsive layout |
| `script.js` | Game logic, UI, scoring and turn handling |
| `ai.js` | AI engine (minimax with difficulty levels) |
| `build.js` | Copies the site files into `dist/` for deployment |
| `vercel.json` | Vercel build and output settings |
| `verify-ai.js` | Checks that the AI never loses on Hard |
| `verify-scoring.js` | Checks that scoring works correctly |
| `tic_tac_toe.java` | The original Java Swing desktop version |

## Run Locally

Open `index.html` in a browser.

To test the same build that gets deployed:

```bash
npm run build
npx serve dist
```

Then open the address it prints (usually `http://localhost:3000`).

## Run the Checks

```bash
node verify-ai.js
node verify-scoring.js
```

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Vercel reads `vercel.json`, runs `npm run build`, and serves the `dist/` folder.

> **Note:** `build.js` only copies the files listed in its `files` array. If you add a new file the site needs (for example another `.js` file or an image), add it to that list, or it won't appear on the deployed site.

## Original Java Version

The original desktop game, built with Java Swing, is kept in `tic_tac_toe.java`.
