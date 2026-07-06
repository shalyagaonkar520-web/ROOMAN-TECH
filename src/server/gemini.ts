import { EXTRACT_RESUME_PROMPT } from './extract_resume';
import Groq from 'groq-sdk';
import {
  QUESTION_GENERATION_PROMPT,
  ANSWER_EVALUATION_PROMPT,
  FINAL_REPORT_PROMPT,
  F2F_PLAN_GENERATION_PROMPT,
  F2F_EVALUATION_PROMPT,
  F2F_NEXT_QUESTION_PROMPT,
} from './prompts';

let groq: Groq | null = null;

async function chatCompletion(messages: any[], jsonMode = false, temperature = 0.5) {
  const groqKey = process.env.GROK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (groqKey && groqKey !== "your-groq-api-key-here" && groqKey.trim() !== "") {
    if (groqKey.startsWith('xai-')) {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'grok-2-latest',
          messages,
          response_format: jsonMode ? { type: 'json_object' } : undefined,
          temperature,
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Grok (xAI) API error: ${response.status} - ${errText}`);
      }
      const data = await response.json();
      return data.choices[0]?.message?.content;
    } else {
      if (!groq) {
        groq = new Groq({ apiKey: groqKey });
      }
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
        temperature,
      });
      return response.choices[0]?.message?.content;
    }
  } else if (openaiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
        temperature,
      })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content;
  } else {
    throw new Error('No valid AI API key found. Please set GROK_API_KEY or ensure OPENAI_API_KEY is configured.');
  }
}

const MODEL = 'llama-3.3-70b-versatile';

export async function generateQuestions(context: any) {
  const systemPrompt = `${QUESTION_GENERATION_PROMPT}\n\nYou MUST return a JSON object with a "questions" key containing an array of objects. Each object must match this schema exactly: { "question_text": string, "topic": string, "difficulty": string, "expected_answer": string }`;

  const text = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify(context, null, 2) }
  ], true, 0.7);

  if (!text) {
    throw new Error('Failed to generate questions');
  }

  const parsed = JSON.parse(text);
  return parsed.questions || parsed;
}

export async function evaluateAnswer(context: any, questionText: string, answerText: string) {
  const systemPrompt = `${ANSWER_EVALUATION_PROMPT}\n\nYou MUST return a JSON object matching this schema exactly: { "score": number, "reasoning": string, "strengths": string[], "weaknesses": string[], "confidence": number, "ideal_answer": string, "knowledge_gaps": string[], "learning_suggestions": string[] }`;

  const text = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Context:\n${JSON.stringify(context, null, 2)}\n\nQuestion:\n${questionText}\n\nCandidate Answer:\n${answerText}` }
  ], true, 0.2);

  if (!text) {
    throw new Error('Failed to evaluate answer');
  }

  return JSON.parse(text);
}

export async function generateFinalReport(context: any, transcript: any) {
  const systemPrompt = `${FINAL_REPORT_PROMPT}\n\nYou MUST return a JSON object matching this schema exactly: { "overall_score": number, "percentage": number, "hiring_probability": number, "recommendation": string, "skill_level": string, "strengths": string[], "weaknesses": string[], "learning_roadmap": string, "topics_to_improve": string[], "performance_heatmap": { [key: string]: number }, "resume_match_percentage": number, "ats_missing_keywords": string[], "resume_vs_jd_analysis": string }`;

  const text = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Context:\n${JSON.stringify(context, null, 2)}\n\nTranscript:\n${JSON.stringify(transcript, null, 2)}` }
  ], true, 0.2);

  if (!text) {
    throw new Error('Failed to generate final report');
  }

  return JSON.parse(text);
}

export async function extractResumeDetails(resumeText: string) {
  const responseText = await chatCompletion([
    { role: 'system', content: EXTRACT_RESUME_PROMPT },
    { role: 'user', content: resumeText }
  ], true, 0.5);

  const content = responseText || '{}';
  return JSON.parse(content);
}

export async function generateF2FPlanAndFirstQuestion(context: any, company: string) {
  const systemPrompt = `${F2F_PLAN_GENERATION_PROMPT}\n\nYou are interviewing for the target company: ${company}.`;

  const text = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify(context, null, 2) }
  ], true, 0.7);

  if (!text) throw new Error('Failed to generate interview plan');
  return JSON.parse(text);
}

export async function evaluateF2FAnswer(context: any, questionText: string, answerText: string, company: string) {
  const systemPrompt = `${F2F_EVALUATION_PROMPT}\n\nYou are evaluating as an interviewer representing ${company}.`;

  const text = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Context:\n${JSON.stringify(context, null, 2)}\n\nQuestion:\n${questionText}\n\nCandidate Answer:\n${answerText}` }
  ], true, 0.2);

  if (!text) throw new Error('Failed to evaluate answer');
  return JSON.parse(text);
}

export async function generateF2FNextQuestion(context: any, company: string, plan: string, history: any) {
  const systemPrompt = `${F2F_NEXT_QUESTION_PROMPT}\n\nYou are a hiring manager at ${company}. Use the following Interview Plan:\n${plan}`;

  const text = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Context:\n${JSON.stringify(context, null, 2)}\n\nTranscript History:\n${JSON.stringify(history, null, 2)}` }
  ], true, 0.5);

  if (!text) throw new Error('Failed to generate next question');
  return JSON.parse(text);
}

