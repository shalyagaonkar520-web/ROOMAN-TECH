"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuestions = generateQuestions;
exports.evaluateAnswer = evaluateAnswer;
exports.generateFinalReport = generateFinalReport;
exports.extractResumeDetails = extractResumeDetails;
exports.generateF2FPlanAndFirstQuestion = generateF2FPlanAndFirstQuestion;
exports.evaluateF2FAnswer = evaluateF2FAnswer;
exports.generateF2FNextQuestion = generateF2FNextQuestion;
const extract_resume_1 = require("./extract_resume");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const prompts_1 = require("./prompts");
let groq = null;
const MODEL = 'llama-3.3-70b-versatile';
async function chatCompletion(messages, jsonMode = false, temperature = 0.5) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your-groq-api-key-here" || apiKey.trim() === "") {
        throw new Error('GROQ_API_KEY is missing.');
    }
    if (!groq) {
        groq = new groq_sdk_1.default({ apiKey });
    }
    console.log('Step 7: Calling Groq API.');
    try {
        const response = await groq.chat.completions.create({
            model: MODEL,
            messages,
            response_format: jsonMode ? { type: 'json_object' } : undefined,
            temperature,
        });
        console.log('Step 8: Received Groq response.');
        let content = response.choices[0]?.message?.content || '';
        // Safely parse JSON by stripping markdown code block wrappers if the model hallucinated them
        if (jsonMode && content) {
            content = content.trim();
            if (content.startsWith('```json')) {
                content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            }
            else if (content.startsWith('```')) {
                content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }
        }
        return content;
    }
    catch (err) {
        console.error('Groq API execution failed:', err);
        throw new Error(`[Groq API Error] ${err.message}`);
    }
}
async function generateQuestions(context) {
    const systemPrompt = `${prompts_1.QUESTION_GENERATION_PROMPT}\n\nYou MUST return a JSON object with a "questions" key containing an array of objects. Each object must match this schema exactly: { "question_text": string, "topic": string, "difficulty": string, "expected_answer": string }`;
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
async function evaluateAnswer(context, questionText, answerText) {
    const systemPrompt = `${prompts_1.ANSWER_EVALUATION_PROMPT}\n\nYou MUST return a JSON object matching this schema exactly: { "score": number, "reasoning": string, "strengths": string[], "weaknesses": string[], "confidence": number, "ideal_answer": string, "knowledge_gaps": string[], "learning_suggestions": string[] }`;
    const text = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${JSON.stringify(context, null, 2)}\n\nQuestion:\n${questionText}\n\nCandidate Answer:\n${answerText}` }
    ], true, 0.2);
    if (!text) {
        throw new Error('Failed to evaluate answer');
    }
    return JSON.parse(text);
}
async function generateFinalReport(context, transcript) {
    const systemPrompt = `${prompts_1.FINAL_REPORT_PROMPT}\n\nYou MUST return a JSON object matching this schema exactly: { "overall_score": number, "percentage": number, "hiring_probability": number, "recommendation": string, "skill_level": string, "strengths": string[], "weaknesses": string[], "learning_roadmap": string, "topics_to_improve": string[], "performance_heatmap": { [key: string]: number }, "resume_match_percentage": number, "ats_missing_keywords": string[], "resume_vs_jd_analysis": string }`;
    const text = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${JSON.stringify(context, null, 2)}\n\nTranscript:\n${JSON.stringify(transcript, null, 2)}` }
    ], true, 0.2);
    if (!text) {
        throw new Error('Failed to generate final report');
    }
    return JSON.parse(text);
}
async function extractResumeDetails(resumeText) {
    const responseText = await chatCompletion([
        { role: 'system', content: extract_resume_1.EXTRACT_RESUME_PROMPT },
        { role: 'user', content: resumeText }
    ], true, 0.5);
    const content = responseText || '{}';
    return JSON.parse(content);
}
async function generateF2FPlanAndFirstQuestion(context, company) {
    const systemPrompt = `${prompts_1.F2F_PLAN_GENERATION_PROMPT}\n\nYou are interviewing for the target company: ${company}.`;
    const text = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(context, null, 2) }
    ], true, 0.7);
    if (!text)
        throw new Error('Failed to generate interview plan');
    return JSON.parse(text);
}
async function evaluateF2FAnswer(context, questionText, answerText, company) {
    const systemPrompt = `${prompts_1.F2F_EVALUATION_PROMPT}\n\nYou are evaluating as an interviewer representing ${company}.`;
    const text = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${JSON.stringify(context, null, 2)}\n\nQuestion:\n${questionText}\n\nCandidate Answer:\n${answerText}` }
    ], true, 0.2);
    if (!text)
        throw new Error('Failed to evaluate answer');
    return JSON.parse(text);
}
async function generateF2FNextQuestion(context, company, plan, history) {
    const systemPrompt = `${prompts_1.F2F_NEXT_QUESTION_PROMPT}\n\nYou are a hiring manager at ${company}. Use the following Interview Plan:\n${plan}`;
    const text = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${JSON.stringify(context, null, 2)}\n\nTranscript History:\n${JSON.stringify(history, null, 2)}` }
    ], true, 0.5);
    if (!text)
        throw new Error('Failed to generate next question');
    return JSON.parse(text);
}
//# sourceMappingURL=gemini.js.map