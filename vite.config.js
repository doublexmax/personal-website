import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import deployment from './vercel.json' with { type: 'json' };

const legacyImages = new Map(deployment.redirects.map(({ source, destination }) => [source, destination]));

function configureLegacyImages(server) {
  server.middlewares.use((request, response, next) => {
    const url = new URL(request.url, 'http://localhost');
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
      name: 'legacy-image-urls',
      configureServer: configureLegacyImages,
      configurePreviewServer: configureLegacyImages,
    },
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
