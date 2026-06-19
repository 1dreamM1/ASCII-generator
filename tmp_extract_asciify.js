const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'node_modules', 'asciify-engine', 'dist', 'index.js');
const text = fs.readFileSync(file, 'utf8');
const re = /async function Rt\(|function Rt\(/g;
const match = re.exec(text);
if (!match) {
  console.error('not found');
  process.exit(1);
}
const start = match.index;
let depth = 0;
let inString = false;
let escape = false;
let quoteChar = '';
let end = start;
for (let i = start; i < text.length; i++) {
  const ch = text[i];
  if (inString) {
    if (escape) {
      escape = false;
    } else if (ch === '\\') {
      escape = true;
    } else if (ch === quoteChar) {
      inString = false;
    }
    continue;
  }
  if (ch === '"' || ch === "'" || ch === '`') {
    inString = true;
    quoteChar = ch;
    continue;
  }
  if (ch === '{') {
    depth++;
    if (depth === 1) start;
  } else if (ch === '}') {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}
const result = text.slice(start, end);
fs.writeFileSync(path.join(__dirname, 'tmp_asciify_video.txt'), result, 'utf8');
console.log('written tmp_asciify_video.txt, length', result.length);
