import express from 'express';
import dotenv from 'dotenv';
import apiRoutes from '../src/server/routes';
import cors from 'cors';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Fallback handlers
app.use('/api', (req, res, next) => { 
  res.status(404).json({ error: 'API route not found' }); 
});

app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => { 
  console.error('API Error:', err); 
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' }); 
});

// IMPORTANT: Do NOT call app.listen() here. Vercel Serverless Functions expect the raw Express app instance.
export default app;

// Disable Vercel's default body parser so Multer and Express can parse the raw stream
export const config = {
  api: {
    bodyParser: false,
  },
};

// Increase Vercel timeout to 60 seconds for slow LLM operations (Hobby Tier max)
export const maxDuration = 60;
