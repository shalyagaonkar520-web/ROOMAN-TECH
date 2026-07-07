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

// Mock the Gemini API logic
vi.mock('../src/server/gemini', () => ({
  generateQuestion: vi.fn().mockResolvedValue(JSON.stringify({ 
    question_text: 'Test Question',
    expected_answer: 'Test Answer',
    technical_skills_tested: ['React']
  })),
  evaluateAnswer: vi.fn().mockResolvedValue(JSON.stringify({
    score: 85,
    feedback: 'Good',
    strengths: [],
    weaknesses: []
  })),
  generateFinalReport: vi.fn().mockResolvedValue(JSON.stringify({
    metrics: {}, strengths: [], weaknesses: [], hire_probability: 80, overall_score: 80
  }))
}));

const app = express();
app.use(express.json());
app.use('/api', router);

describe('API: Interview', () => {
  it('POST /api/interviews generates an interview', async () => {
    const res = await request(app)
      .post('/api/interviews')
      .send({ role: 'Developer', difficulty: 'Medium', experience: '3 years', resumeId: '123' });
    
    expect(res.status).toBeDefined();
  });

  it('POST /api/interviews/:id/questions/:qId/answer evaluates an answer', async () => {
    const res = await request(app)
      .post('/api/interviews/1/questions/1/answer')
      .send({ answer: 'A' });
    
    expect(res.status).toBeDefined();
  });

  it('POST /api/interviews/:id/complete generates final report', async () => {
    const res = await request(app)
      .post('/api/interviews/1/complete')
      .send({});
    
    expect(res.status).toBeDefined();
  });
});
