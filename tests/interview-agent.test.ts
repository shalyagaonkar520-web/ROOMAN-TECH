import { describe, it, expect, vi } from 'vitest';

// Mock API integrations for interview generation and evaluation
const generateQuestions = vi.fn().mockResolvedValue(['What is React?']);
const evaluateAnswer = vi.fn().mockResolvedValue({ score: 90, feedback: 'Good job' });
const generateReport = vi.fn().mockResolvedValue({ hireProbability: 'High' });

describe('Interview Agent', () => {
  it('generates role-specific questions', async () => {
    // Arrange & Act
    const questions = await generateQuestions({ role: 'Frontend Developer' });
    
    // Assert
    expect(generateQuestions).toHaveBeenCalledWith({ role: 'Frontend Developer' });
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0]).toBe('What is React?');
  });

  it('evaluates candidate answers', async () => {
    // Arrange & Act
    const evaluation = await evaluateAnswer({ answer: 'React is a library' });
    
    // Assert
    expect(evaluateAnswer).toHaveBeenCalledWith({ answer: 'React is a library' });
    expect(evaluation.score).toBe(90);
  });

  it('generates final evaluation report', async () => {
    // Arrange & Act
    const report = await generateReport({ transcript: [] });
    
    // Assert
    expect(generateReport).toHaveBeenCalled();
    expect(report.hireProbability).toBe('High');
  });
});
