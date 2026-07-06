import express from 'express';
import dotenv from 'dotenv';
import apiRoutes from '../src/server/routes';
import cors from 'cors';

dotenv.config();

console.log('[Vercel] Serverless Function boot sequence initiated.');

const app = express();

// Middlewares
app.use((req, res, next) => {
  console.log(`[Vercel] Incoming request: ${req.method} ${req.url}`);
  next();
});
app.use(cors());
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

// Increase Vercel timeout to 60 seconds for slow LLM operations (Hobby Tier max)
export const maxDuration = 60;

// IMPORTANT: Do NOT call app.listen() here. Vercel expects the raw Express app instance.
export default app;
