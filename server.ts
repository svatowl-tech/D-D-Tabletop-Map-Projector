/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Express + Vite сервер приложения D&D Tabletop Map Projector
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import polzaRoutes from './src/server/routes/polzaRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Разбор JSON тел большого объема (для ассетов и Base64)
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Подключение API маршрутов Polza AI
  app.use('/api/polza', polzaRoutes);
  app.use('/api', polzaRoutes); // fallback для /api/assets/file/*

  // Здоровье сервера
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware для разработки или статический сервер для продакшна
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Polza AI Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
