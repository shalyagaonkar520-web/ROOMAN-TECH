import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import apiRoutes from './server/routes';

const app = express();

// Middlewares
app.use((req, res, next) => {
  console.log(`[Firebase Function] Incoming request: ${req.method} ${req.url}`);
  next();
});
app.use(cors({ origin: true }));
app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// API Routes
app.use('/api', apiRoutes);

// Fallback handlers
app.use('/api', (req, res, next) => { 
  res.status(404).json({ error: 'API route not found' }); 
});

app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => { 
  console.error('API Error:', err); 
  res.status(err.status || 500).json({ success: false, step: 'Global Error Handler', message: err.message || 'Internal Server Error', stack: err.stack }); 
});

// Configure options and export function
export const api = onRequest({ maxInstances: 10, timeoutSeconds: 60 }, app);
