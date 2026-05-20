const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "dist");
const files = ["index.html", "styles.css", "script.js"];

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(__dirname, file), path.join(outputDir, file));
}

console.log("Static site built in dist/");
