const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "dist");
const files = ["index.html", "styles.css", "script.js", "ai.js"];

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const file of files) {
  const source = path.join(__dirname, file);
  if (!fs.existsSync(source)) {
    console.error(`Build failed: missing file ${file}`);
    process.exit(1);
  }
  fs.copyFileSync(source, path.join(outputDir, file));
}

console.log("Static site built in dist/");
