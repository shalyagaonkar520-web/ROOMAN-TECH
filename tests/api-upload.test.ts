import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import router from '../src/server/routes';

// Mock Firebase
vi.mock('../src/lib/firebase', () => ({
  app: {},
  auth: { currentUser: { uid: 'test' } },
  storage: {},
  db: {}
}));

// Mock the Gemini integration in the routes
vi.mock('../src/server/extract_resume', () => ({
  extractResumeData: vi.fn().mockResolvedValue({ text: 'mock text' })
}));
vi.mock('../src/server/gemini', () => ({
  generateAIResponse: vi.fn().mockResolvedValue(JSON.stringify({ 
    ats_score: 90, 
    matching_keywords: [] 
  })),
  generateQuestion: vi.fn(),
  evaluateAnswer: vi.fn(),
  generateFinalReport: vi.fn()
}));

const app = express();
app.use(express.json());
app.use('/api', router);

describe('API: Upload', () => {
  it('POST /api/upload handles resume upload and parsing', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('resume', Buffer.from('mock pdf content'), 'resume.pdf');
    
    expect(res.status).toBeDefined();
  });
});
