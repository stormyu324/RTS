import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(process.argv[2] || path.join(root, 'dist/iron-front-demo.html'));
const [index, css, engine, game] = await Promise.all(['index.html', 'style.css', 'engine.js', 'game.js'].map(name => readFile(path.join(root, name), 'utf8')));
// Keep engine internals scoped so the portable version shares the exact sources.
const script = `const { Game, WORLD, SPECS, distance } = (() => {\n${engine.replace(/^export /gm, '')}\nreturn { Game, WORLD, SPECS, distance };\n})();\n${game.replace(/^import .*from '\.\/engine\.js';\n/, '')}`;
const html = index.replace('<link rel="stylesheet" href="style.css">', () => `<style>${css}</style>`)
  .replace('<script type="module" src="game.js"></script>', () => `<script type="module">${script}</script>`);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`Portable game saved: ${output}`);
