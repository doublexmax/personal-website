import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const outputDirectory = new URL('../dist/', import.meta.url);
const template = await readFile(new URL('index.html', outputDirectory), 'utf8');
const rootMarker = '<div id="root"></div>';

if (!template.includes(rootMarker)) {
  throw new Error('Cannot prerender /portfolio. Expected an empty #root marker in dist/index.html.');
}

const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)),
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
});

try {
  const { renderPortfolio } = await server.ssrLoadModule('/src/prerender.jsx');
  const html = template.replace(rootMarker, `<div id="root">${renderPortfolio()}</div>`);
  await mkdir(new URL('portfolio/', outputDirectory), { recursive: true });
  await writeFile(new URL('portfolio/index.html', outputDirectory), html);
  console.log('Prerendered /portfolio to dist/portfolio/index.html.');
} finally {
  await server.close();
}
