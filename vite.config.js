import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import deployment from './vercel.json' with { type: 'json' };
import { readFileSync } from 'node:fs';

const legacyImages = new Map(deployment.redirects.map(({ source, destination }) => [source, destination]));
const chartSource = readFileSync(new URL('./src/features/poker/default-ranges.json', import.meta.url), 'utf8');

function configurePublicAssets(server) {
  server.middlewares.use((request, response, next) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/charts.json') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(chartSource);
      return;
    }
    const destination = legacyImages.get(url.pathname);
    if (destination) {
      response.writeHead(307, { Location: destination + url.search });
      response.end();
      return;
    }
    next();
  });
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'public-compatibility',
      configureServer: configurePublicAssets,
      configurePreviewServer: configurePublicAssets,
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'charts.json', source: chartSource });
      },
    },
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
