import express, { type NextFunction, type Request, type Response } from 'express';

import type { Container } from '../../container';
import { authenticate } from './middlewares/authenticate';
import { errorHandler } from './middlewares/errorHandler';
import { campaignsRoutes } from './routes/campaigns.routes';
import { usersRoutes } from './routes/users.routes';

// CORS mínimo: la app móvil nativa no lo necesita, pero Expo web sí.
function cors(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.header('origin');
    if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  };
}

export function createApp(container: Container) {
  const app = express();
  const origins = container.env.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.disable('x-powered-by');
  app.use(cors(origins));
  app.use(express.json({ limit: '100kb' }));

  // Pública: la usan los monitores para saber si el servidor está vivo.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Todo lo que sigue requiere sesión de Supabase.
  app.use(authenticate(container.auth, container.repositories.users));
  app.use(campaignsRoutes(container));
  app.use(usersRoutes(container));

  app.use((_req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Ruta no encontrada.' });
  });
  app.use(errorHandler);

  return app;
}
