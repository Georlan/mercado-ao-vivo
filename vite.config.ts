import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { marketApiResponse } from './src/server/marketService';

export default defineConfig({
  plugins: [react(), {
    name: 'official-market-local-api',
    configureServer(server) {
      server.middlewares.use('/api/market', async (req, res, next) => {
        if (req.method !== 'GET') return next();
        try {
          const response = await marketApiResponse();
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        } catch {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ quotes: {}, stocks: [], errors: { USDBRL: 'Serviço indisponível', IBOV: 'Serviço indisponível' } }));
        }
      });
    },
  }],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
