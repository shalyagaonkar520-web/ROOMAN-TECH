var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/vercel.ts
var vercel_exports = {};
__export(vercel_exports, {
  default: () => vercel_default,
  maxDuration: () => maxDuration
});
module.exports = __toCommonJS(vercel_exports);
var import_express2 = __toESM(require("express"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);

// src/server/routes.ts
var import_express = __toESM(require("express"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_pdf_parse = __toESM(require("pdf-parse"), 1);
var import_mammoth = __toESM(require("mammoth"), 1);

// src/server/db.ts
var import_firestore = require("firebase/firestore");

// src/lib/firebase.ts
var import_app = require("firebase/app");
var import_auth = require("firebase/auth");
var firebaseConfig = {
  apiKey: "AIzaSyC36aeunmITCUP-qFBE0OqoKIi0iYTTvf4",
  authDomain: "rooman-eb7dd.firebaseapp.com",
  projectId: "rooman-eb7dd",
  storageBucket: "rooman-eb7dd.firebasestorage.app",
  messagingSenderId: "1056229436313",
  appId: "1:1056229436313:web:76e95b726980f4e4eec108",
  measurementId: "G-33ZTX3Q38H"
};
var app = (0, import_app.initializeApp)(firebaseConfig);
var auth = (0, import_auth.getAuth)(app);

// src/server/db.ts
var db = (0, import_firestore.getFirestore)(app);
var db_default = db;

// src/server/routes.ts
var import_firestore2 = require("firebase/firestore");

// src/server/extract_resume.ts
var EXTRACT_RESUME_PROMPT = `
You are an expert technical recruiter and AI assistant. Extract the following information from the provided resume text:
- role: The most likely job title or role the candidate is applying for or currently holds.
- yearsExperience: The total years of experience, categorized exactly as one of the following: "Entry Level (0-2 years)", "Mid Level (3-5 years)", "Senior (5-8 years)", "Staff/Principal (8+ years)". If it's unclear, guess based on their work history.
- programmingLanguage: The primary programming language they use (e.g., "JavaScript", "Python", "Java", "C++", "TypeScript"). Pick the most prominent one.
- skills: A comma-separated list of their top 5 technical skills or frameworks (e.g., "React, Node.js, AWS, Docker, MongoDB").

Respond ONLY with a valid JSON object in the exact following schema, without Markdown formatting like \`\`\`json:
{
  "role": "string",
  "yearsExperience": "string",
  "programmingLanguage": "string",
  "skills": "string"
}
`;

// src/server/gemini.ts
var import_groq_sdk = __toESM(require("groq-sdk"), 1);

// src/server/prompts.ts
var QUESTION_GENERATION_PROMPT = `
You are a Principal Technical Interviewer at a top-tier tech company (e.g., Stripe, Apple).
Generate a list of highly technical, nuanced interview questions for a given role, difficulty, experience level, programming language, skills, and interview type.

IMPORTANT INSTRUCTION FOR TAILORING:
If a Resume Text and/or Job Description (JD) Text is provided in the Context:
1. Base the questions directly on the REQUIRED and PREFERRED skills listed in the JD.
2. If the JD mentions specific tools (e.g. Docker, React, Node, Kubernetes), you MUST generate questions about those specific tools.
3. Use the Resume to calibrate the depth. If the candidate claims 5 years of experience in React, ask a deeply technical React question. If they don't have experience in a required JD skill, ask a foundational question about it to check their adaptability.
4. The difficulty should increase gradually across the generated questions.

Return the questions as a JSON array of objects. Each object should have:
- question_text: The interview question string.
- topic: The primary topic being tested.
- difficulty: The difficulty level of this specific question.
- expected_answer: A brief summary of what a great answer would include.

`;
var ANSWER_EVALUATION_PROMPT = `
You are an elite Senior Engineer evaluating a candidate's answer during a technical interview.
Given the job context (including JD and Resume), the question asked, and the candidate's exact answer, provide a ruthless but fair evaluation.

Return a JSON object with the following fields:
- score: An integer from 0 to 10 (10 being an absolutely perfect, senior-level response).
- reasoning: A paragraph detailing exactly why this score was given, focusing on technical accuracy and depth.
- strengths: A JSON array of strings describing what was technically excellent about the answer.
- weaknesses: A JSON array of strings describing what was missing, technically flawed, or naive.
- confidence: An integer (0-100) indicating your confidence in the candidate's knowledge based on this single answer.
- ideal_answer: A complete, senior-level, production-ready answer to the question.
- knowledge_gaps: A JSON array of strings identifying specific technical concepts the candidate clearly lacks.
- learning_suggestions: A JSON array of strings providing actionable, highly technical advice to improve.
`;
var FINAL_REPORT_PROMPT = `
You are a Staff Engineering Manager reviewing a candidate's full interview packet.
You will receive the job context (including JD and Resume) and a full transcript of the questions and evaluated answers.

Provide a comprehensive, data-driven final hiring assessment.
Evaluate the candidate's performance against the provided Job Description requirements.
Analyze the Resume against the JD.

Return a JSON object with the following fields:
- overall_score: An integer score based on overall performance (0-100).
- percentage: An integer representing the percentage score (0-100).
- hiring_probability: An integer (0-100) indicating the probability of this candidate passing a real FAANG interview.
- recommendation: "Strong Hire", "Hire", "Leaning Hire", "Leaning No Hire", or "Strong No Hire".
- skill_level: A string summarizing their assessed skill level.
- strengths: A JSON array of strings highlighting their top systemic strengths.
- weaknesses: A JSON array of strings highlighting their most critical systemic flaws.
- learning_roadmap: A comprehensive, multi-paragraph markdown string outlining a detailed technical growth plan.
- topics_to_improve: A JSON array of strings listing specific technologies or concepts to study.
- performance_heatmap: A JSON object where keys are topics (e.g., "System Design", "React") and values are integers (0-100) representing proficiency.
- resume_match_percentage: An integer (0-100) estimating how well their Resume matches the JD.
- ats_missing_keywords: A JSON array of strings listing important keywords from the JD missing in their Resume.
- resume_vs_jd_analysis: A short paragraph analyzing the experience gap and match.
`;
var F2F_PLAN_GENERATION_PROMPT = `
You are a Principal Engineering Manager at the specified hiring company (e.g., Google, Microsoft, NVIDIA, Amazon, OpenAI, or Netflix).
Your goal is to deeply analyze the candidate's Resume (PDF text) and the Job Description (JD text) to build an interview plan and generate the first question.

CRITICAL FIRST QUESTION DIRECTIVE (RESUME PROJECT TAILORING):
If the candidate has uploaded a Resume (resumeText is present in the Context):
1. You MUST generate the first question ("question_text") specifically about a real project, technical implementation, or experience detailed in the candidate's resume (e.g., "I noticed on your resume you worked on the project [Project Name] where you [Project Details]. Could you explain the technical architecture and your specific role in it?").
2. DO NOT ask generic introductory questions or questions from the Job Description first. Focus the first question strictly on validating a specific resume claim or project.

Before asking, extract and analyze:
1. Candidate's Skills, Projects, Technologies, Certifications, Experience, Education, and apparent Keywords.
2. Required and Preferred skills from the JD.
3. Match details: Missing skills in candidate's resume, Strongest skills matching the JD, and potential Weak areas.

Based on this analysis, construct an Interview Plan that defines the core skills, difficulty scaling, and topics to verify.
Then, generate a warm, professional welcome message where you introduce yourself, welcome the candidate (using the name provided in candidateName), briefly explain the interview format, and state that we will start with a resume project deep dive before presenting the first question.

Return a JSON object matching this schema exactly:
{
  "plan": "Detailed markdown analyzing Resume vs JD, listing missing/strong/weak skills and the sequence of topics to cover.",
  "welcome_message": "A warm and realistic introduction (e.g. 'Hello [CandidateName], I'm Sarah, a Staff Engineer at Google... Welcome to your interview today. Let's start with a deep dive into your resume...')",
  "question_text": "The first interview question string (tailored to their specific resume project).",
  "topic": "The topic of the first question.",
  "difficulty": "Easy",
  "expected_answer": "Summary of what a great answer would contain."
}
`;
var F2F_EVALUATION_PROMPT = `
You are an experienced hiring manager from the specified company.
Given the candidate's Resume, the Job Description (JD), the question, and the candidate's exact answer, evaluate the answer in real-time.

META-INTENT DETECTION (NATURAL CONVERSATION):
Before evaluating technical accuracy, check if the candidate is giving a conversational command instead of answering the question.
- If they ask to repeat the question -> is_meta_command: true, meta_action: "REPEAT", meta_response: "Of course. I will repeat the question."
- If they didn't understand the question -> is_meta_command: true, meta_action: "REPHRASE", meta_response: "No problem. Let me explain it differently."
- If they ask for a minute -> is_meta_command: true, meta_action: "WAIT", meta_response: "Certainly. Take your time. I'll wait."
- If they ask you to speak slowly -> is_meta_command: true, meta_action: "SLOW_DOWN", meta_response: "Absolutely. I'll speak a little slower from now on."
- If they need to restart microphone/lost internet -> is_meta_command: true, meta_action: "PAUSE", meta_response: "Sure. I'll pause the interview until you're ready."
If is_meta_command is true, you MUST provide these fields. The rest of the technical scoring fields can be omitted or set to 0/empty.
If it is a technical answer, set is_meta_command: false and meta_action: "NONE".

Evaluate the response on:
- Technical Accuracy (Is the answer correct and architecturally sound?)
- Communication & Confidence (How clear and assertive is the explanation?)
- Depth of Knowledge & Logical Thinking (Does it detail internals, or is it high-level/vague?)
- Problem Solving & Relevance (Does it directly address the question?)
- Grammar, Vocabulary & Fluency (Is it articulate?)

Score the answer from 1 to 10 (10 being an absolutely perfect response).

CORRECTION MODE:
If the answer is incorrect or fundamentally flawed:
1. Explain exactly why it is incorrect.
2. Explain the correct industry-standard concept.
3. Provide a practical code or conceptual example.
4. Set "needs_retry": true.

BLUFF DETECTION (RESUME VALIDATION):
If the candidate mentions technologies, frameworks, or concepts in their answer that are NOT in their resume (e.g., claiming production experience in Kubernetes when the resume doesn't show it), flag this discrepancy. You should note this in the weaknesses/knowledge gaps.

Return a JSON object matching this schema exactly:
{
  "is_meta_command": boolean,
  "meta_action": "REPEAT" | "REPHRASE" | "WAIT" | "SLOW_DOWN" | "PAUSE" | "NONE",
  "meta_response": "The conversational response to the candidate if it is a meta command.",
  "score": number,
  "reasoning": "Detailed paragraph evaluating the response across accuracy, communication, confidence, depth, logical thinking, and relevance.",
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "confidence": number, // 0-100 indicating confidence in their depth
  "ideal_answer": "Standard perfect answer with code/architectural description",
  "knowledge_gaps": ["string"],
  "learning_suggestions": ["string"],
  "needs_retry": boolean,
  "correction_explanation": "Explanation of why it was incorrect and what is correct (or empty string)",
  "correction_example": "Code snippet or architectural example demonstrating the correct way (or empty string)"
}
`;
var F2F_NEXT_QUESTION_PROMPT = `
You are a hiring manager from the specified company conducting a dynamic face-to-face technical interview.
You have the interview plan, the resume, the job description, and the transcript of all previous questions, answers, and evaluations.

Generate the NEXT question dynamically. Follow these strict rules:
1. Ask only ONE question at a time.
2. Generating the next question should be based on the candidate's previous answers:
   - If they answered correctly (score >= 7), increase difficulty or drill deeper.
   - If they struggled (score < 7), ask a simpler follow-up question or offer a gentle hint.
   - Dig deeper! Do not change topics immediately. If they mention a tool (e.g. Java), ask about JVM, Garbage Collection, then Stack vs Heap before moving to a new topic.
3. BLUFF DETECTION: If they mentioned a technology in their answers not present in their resume, generate a deep validation question to test if they actually know it.
4. Keep the question strictly relevant to both the resume and the JD.

Return a JSON object matching this schema exactly:
{
  "transition_phrase": "A short conversational sentence acknowledging the candidate's previous response with EXPLICIT FEEDBACK. If their keywords matched and the answer was right, start with 'Perfect.' or 'That is correct.' and briefly state why. If they were wrong, partially wrong, or missed key points, explicitly say 'Okay, but the answer should be framed like this:' and briefly explain the ideal answer before transitioning to the next question.",
  "question_text": "The next question to ask the candidate.",
  "topic": "The topic of this question.",
  "difficulty": "Easy | Medium | Hard | Expert",
  "expected_answer": "Summary of what a great answer would contain.",
  "is_complete": boolean // Set to true if we have asked enough questions (compare transcript length to target num_questions) or if the interview is ready to conclude.
}
`;

// src/server/gemini.ts
var groq = null;
var MODEL = "llama-3.3-70b-versatile";
async function chatCompletion(messages, jsonMode = false, temperature = 0.5) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your-groq-api-key-here" || apiKey.trim() === "") {
    throw new Error("GROQ_API_KEY is missing.");
  }
  if (!groq) {
    groq = new import_groq_sdk.default({ apiKey });
  }
  console.log("Step 7: Calling Groq API.");
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      response_format: jsonMode ? { type: "json_object" } : void 0,
      temperature
    });
    console.log("Step 8: Received Groq response.");
    let content = response.choices[0]?.message?.content || "";
    if (jsonMode && content) {
      content = content.trim();
      if (content.startsWith("```json")) {
        content = content.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (content.startsWith("```")) {
        content = content.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }
    }
    return content;
  } catch (err) {
    console.error("Groq API execution failed:", err);
    throw new Error(`[Groq API Error] ${err.message}`);
  }
}
async function generateQuestions(context) {
  const systemPrompt = `${QUESTION_GENERATION_PROMPT}

You MUST return a JSON object with a "questions" key containing an array of objects. Each object must match this schema exactly: { "question_text": string, "topic": string, "difficulty": string, "expected_answer": string }`;
  const text = await chatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(context, null, 2) }
  ], true, 0.7);
  if (!text) {
    throw new Error("Failed to generate questions");
  }
  const parsed = JSON.parse(text);
  return parsed.questions || parsed;
}
async function evaluateAnswer(context, questionText, answerText) {
  const systemPrompt = `${ANSWER_EVALUATION_PROMPT}

You MUST return a JSON object matching this schema exactly: { "score": number, "reasoning": string, "strengths": string[], "weaknesses": string[], "confidence": number, "ideal_answer": string, "knowledge_gaps": string[], "learning_suggestions": string[] }`;
  const text = await chatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: `Context:
${JSON.stringify(context, null, 2)}

Question:
${questionText}

Candidate Answer:
${answerText}` }
  ], true, 0.2);
  if (!text) {
    throw new Error("Failed to evaluate answer");
  }
  return JSON.parse(text);
}
async function generateFinalReport(context, transcript) {
  const systemPrompt = `${FINAL_REPORT_PROMPT}

You MUST return a JSON object matching this schema exactly: { "overall_score": number, "percentage": number, "hiring_probability": number, "recommendation": string, "skill_level": string, "strengths": string[], "weaknesses": string[], "learning_roadmap": string, "topics_to_improve": string[], "performance_heatmap": { [key: string]: number }, "resume_match_percentage": number, "ats_missing_keywords": string[], "resume_vs_jd_analysis": string }`;
  const text = await chatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: `Context:
${JSON.stringify(context, null, 2)}

Transcript:
${JSON.stringify(transcript, null, 2)}` }
  ], true, 0.2);
  if (!text) {
    throw new Error("Failed to generate final report");
  }
  return JSON.parse(text);
}
async function extractResumeDetails(resumeText) {
  const responseText = await chatCompletion([
    { role: "system", content: EXTRACT_RESUME_PROMPT },
    { role: "user", content: resumeText }
  ], true, 0.5);
  const content = responseText || "{}";
  return JSON.parse(content);
}
async function generateF2FPlanAndFirstQuestion(context, company) {
  const systemPrompt = `${F2F_PLAN_GENERATION_PROMPT}

You are interviewing for the target company: ${company}.`;
  const text = await chatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(context, null, 2) }
  ], true, 0.7);
  if (!text) throw new Error("Failed to generate interview plan");
  return JSON.parse(text);
}
async function evaluateF2FAnswer(context, questionText, answerText, company) {
  const systemPrompt = `${F2F_EVALUATION_PROMPT}

You are evaluating as an interviewer representing ${company}.`;
  const text = await chatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: `Context:
${JSON.stringify(context, null, 2)}

Question:
${questionText}

Candidate Answer:
${answerText}` }
  ], true, 0.2);
  if (!text) throw new Error("Failed to evaluate answer");
  return JSON.parse(text);
}
async function generateF2FNextQuestion(context, company, plan, history) {
  const systemPrompt = `${F2F_NEXT_QUESTION_PROMPT}

You are a hiring manager at ${company}. Use the following Interview Plan:
${plan}`;
  const text = await chatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: `Context:
${JSON.stringify(context, null, 2)}

Transcript History:
${JSON.stringify(history, null, 2)}` }
  ], true, 0.5);
  if (!text) throw new Error("Failed to generate next question");
  return JSON.parse(text);
}

// src/server/routes.ts
var router = import_express.default.Router();
var upload = (0, import_multer.default)({ storage: import_multer.default.memoryStorage() });
router.post("/upload", upload.single("resume"), async (req, res) => {
  let step = "Step 1: Resume upload started.";
  console.log(step);
  try {
    step = "Step 2: Checking req.file.";
    console.log(step);
    if (!req.file) {
      console.error("req.file is undefined");
      console.error("req.headers:", req.headers);
      console.error("req.body:", req.body);
      return res.status(400).json({ success: false, step, message: "No file uploaded", stack: null });
    }
    step = "Step 4: Checking buffer.";
    console.log(step);
    if (!req.file.buffer) {
      console.error("req.file.buffer is undefined");
      return res.status(400).json({ success: false, step, message: "File buffer is missing", stack: null });
    }
    if (req.file.buffer.length === 0) {
      console.error("Buffer length is 0");
      return res.status(400).json({ success: false, step, message: "File buffer is empty", stack: null });
    }
    step = "Step 3: Checking file type.";
    console.log(step);
    const mimeType = req.file.mimetype;
    const originalName = req.file.originalname;
    const bufferSize = req.file.buffer.length;
    console.log(`[Upload] File Name: ${originalName}`);
    console.log(`[Upload] File Size: ${req.file.size}`);
    console.log(`[Upload] Mime Type: ${mimeType}`);
    console.log(`[Upload] Buffer Size: ${bufferSize}`);
    const validMimes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validMimes.includes(mimeType) && !originalName.endsWith(".docx") && !originalName.endsWith(".pdf") && !originalName.endsWith(".doc")) {
      console.error("Unsupported MIME type:", mimeType);
      return res.status(400).json({ success: false, step, message: `Unsupported file type: ${mimeType}`, stack: null });
    }
    let text = "";
    const buffer = req.file.buffer;
    if (mimeType === "application/pdf" || originalName.endsWith(".pdf")) {
      step = "Step 5: Starting pdf-parse.";
      console.log(step);
      try {
        const pdfData = await (0, import_pdf_parse.default)(buffer);
        text = pdfData.text;
      } catch (parseErr) {
        console.error("PDFParse failed internally:", parseErr);
        throw parseErr;
      }
    } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mimeType === "application/msword" || originalName.endsWith(".docx") || originalName.endsWith(".doc")) {
      step = "Step 5: Starting mammoth (DOCX parse).";
      console.log(step);
      const docxData = await import_mammoth.default.extractRawText({ buffer });
      text = docxData.value;
    } else {
      return res.status(400).json({ success: false, step, message: `Unsupported file type: ${mimeType}`, stack: null });
    }
    step = "Step 6: PDF parsed successfully.";
    console.log(step);
    console.log(`[Upload] Extracted text length: ${text?.length}`);
    if (!text || text.trim().length === 0) {
      console.error("Extracted text is empty");
      return res.status(400).json({ success: false, step, message: "No text could be extracted.", stack: null });
    }
    step = "Step 7: Calling Groq API.";
    let extractedData = {};
    if (req.body.type === "resume") {
      try {
        extractedData = await extractResumeDetails(text);
        console.log("Step 8: Received Groq response.");
      } catch (e) {
        console.error("Error extracting resume data:", e);
        return res.status(500).json({ success: false, step: "Groq API Error", message: e.message, stack: e.stack });
      }
    }
    step = "Step 10: Returning response.";
    console.log(step);
    res.json({ success: true, text, ...extractedData });
  } catch (error) {
    console.error(error);
    console.error("req.file:", req.file);
    console.error("req.headers:", req.headers);
    console.error("req.body:", req.body);
    res.status(500).json({ success: false, step, message: error.message, stack: error.stack });
  }
});
router.get("/interviews", async (req, res) => {
  try {
    const q = (0, import_firestore2.query)((0, import_firestore2.collection)(db_default, "interviews"), (0, import_firestore2.orderBy)("created_at", "desc"));
    const snapshot = await (0, import_firestore2.getDocs)(q);
    const interviews = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});
router.post("/interviews", async (req, res) => {
  const { role, difficulty, numQuestions, yearsExperience, programmingLanguage, skills, interviewType, resumeText, jdText, mode = "premium", company, candidateName } = req.body;
  if (!role || !difficulty || !numQuestions || !yearsExperience || !programmingLanguage || !skills || !interviewType) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const context = { role, difficulty, yearsExperience, programmingLanguage, skills, interviewType, numQuestions, resumeText, jdText, candidateName };
    let questions = [];
    let welcomeMessage = "";
    let plan = "";
    if (mode === "face_to_face") {
      const f2fPlan = await generateF2FPlanAndFirstQuestion(context, company || "Google");
      plan = f2fPlan.plan;
      welcomeMessage = f2fPlan.welcome_message;
      questions = [{
        question_text: f2fPlan.question_text,
        topic: f2fPlan.topic,
        difficulty: f2fPlan.difficulty,
        expected_answer: f2fPlan.expected_answer
      }];
    } else {
      questions = await generateQuestions(context);
    }
    const interviewData = {
      role,
      difficulty,
      num_questions: numQuestions,
      years_experience: yearsExperience,
      programming_language: programmingLanguage,
      skills,
      interview_type: interviewType,
      status: "in-progress",
      resume_text: resumeText || null,
      jd_text: jdText || null,
      mode,
      company: company || null,
      interview_plan: plan || null,
      candidate_name: candidateName || "Candidate",
      created_at: (0, import_firestore2.serverTimestamp)()
    };
    const interviewRef = await (0, import_firestore2.addDoc)((0, import_firestore2.collection)(db_default, "interviews"), interviewData);
    const interviewId = interviewRef.id;
    const formattedQuestions = [];
    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const qData = {
        interview_id: interviewId,
        question_text: q.question_text,
        topic: q.topic,
        difficulty: q.difficulty,
        expected_answer: q.expected_answer,
        hints: JSON.stringify([]),
        order_idx: idx + 1
      };
      const qRef = await (0, import_firestore2.addDoc)((0, import_firestore2.collection)(db_default, "questions"), qData);
      formattedQuestions.push({ id: qRef.id, ...qData });
    }
    res.json({ id: interviewId, questions: formattedQuestions, welcome_message: welcomeMessage });
  } catch (error) {
    console.error("Error starting interview:", error);
    res.status(500).json({ error: String(error) });
  }
});
router.get("/interviews/:id", async (req, res) => {
  const interviewId = req.params.id;
  try {
    const interviewDoc = await (0, import_firestore2.getDoc)((0, import_firestore2.doc)(db_default, "interviews", interviewId));
    if (!interviewDoc.exists()) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }
    const interview = { id: interviewDoc.id, ...interviewDoc.data() };
    const qSnapshot = await (0, import_firestore2.getDocs)((0, import_firestore2.query)((0, import_firestore2.collection)(db_default, "questions"), (0, import_firestore2.where)("interview_id", "==", interviewId), (0, import_firestore2.orderBy)("order_idx", "asc")));
    const questions = qSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const answers = [];
    if (questions.length > 0) {
      const questionIds = questions.map((q) => q.id);
      for (const qId of questionIds) {
        const aSnapshot = await (0, import_firestore2.getDocs)((0, import_firestore2.query)((0, import_firestore2.collection)(db_default, "answers"), (0, import_firestore2.where)("question_id", "==", qId)));
        aSnapshot.docs.forEach((d) => answers.push({ id: d.id, ...d.data() }));
      }
    }
    const rSnapshot = await (0, import_firestore2.getDocs)((0, import_firestore2.query)((0, import_firestore2.collection)(db_default, "reports"), (0, import_firestore2.where)("interview_id", "==", interviewId)));
    const report = rSnapshot.empty ? null : { id: rSnapshot.docs[0].id, ...rSnapshot.docs[0].data() };
    res.json({ interview, questions, answers, report });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});
router.post("/interviews/:id/questions/:qId/answer", async (req, res) => {
  const interviewId = req.params.id;
  const questionId = req.params.qId;
  const { answer_text, time_taken_seconds } = req.body;
  if (!answer_text) {
    res.status(400).json({ error: "Answer text is required" });
    return;
  }
  try {
    const interviewDoc = await (0, import_firestore2.getDoc)((0, import_firestore2.doc)(db_default, "interviews", interviewId));
    const questionDoc = await (0, import_firestore2.getDoc)((0, import_firestore2.doc)(db_default, "questions", questionId));
    if (!interviewDoc.exists() || !questionDoc.exists()) {
      res.status(404).json({ error: "Interview or question not found" });
      return;
    }
    const interview = interviewDoc.data();
    const question = questionDoc.data();
    const context = {
      role: interview.role,
      difficulty: interview.difficulty,
      yearsExperience: interview.years_experience,
      programmingLanguage: interview.programming_language,
      skills: interview.skills,
      interviewType: interview.interview_type,
      resumeText: interview.resume_text,
      jdText: interview.jd_text
    };
    const evaluation = await evaluateAnswer(context, question.question_text, answer_text);
    const answerData = {
      question_id: questionId,
      answer_text,
      score: evaluation.score,
      reasoning: evaluation.reasoning,
      strengths: JSON.stringify(evaluation.strengths),
      weaknesses: JSON.stringify(evaluation.weaknesses),
      confidence: evaluation.confidence,
      ideal_answer: evaluation.ideal_answer,
      knowledge_gaps: JSON.stringify(evaluation.knowledge_gaps),
      learning_suggestions: JSON.stringify(evaluation.learning_suggestions),
      time_taken_seconds: time_taken_seconds || null,
      created_at: (0, import_firestore2.serverTimestamp)()
    };
    const answerRef = await (0, import_firestore2.addDoc)((0, import_firestore2.collection)(db_default, "answers"), answerData);
    res.json({ id: answerRef.id, evaluation });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ error: String(error) });
  }
});
router.post("/interviews/:id/questions/:qId/f2f-answer", async (req, res) => {
  const interviewId = req.params.id;
  const questionId = req.params.qId;
  const { answer_text, time_taken_seconds, force_next = false } = req.body;
  if (!answer_text && !force_next) {
    res.status(400).json({ error: "Answer text is required" });
    return;
  }
  try {
    const interviewDoc = await (0, import_firestore2.getDoc)((0, import_firestore2.doc)(db_default, "interviews", interviewId));
    const questionDoc = await (0, import_firestore2.getDoc)((0, import_firestore2.doc)(db_default, "questions", questionId));
    if (!interviewDoc.exists() || !questionDoc.exists()) {
      res.status(404).json({ error: "Interview or question not found" });
      return;
    }
    const interview = interviewDoc.data();
    const question = questionDoc.data();
    const context = {
      role: interview.role,
      difficulty: interview.difficulty,
      yearsExperience: interview.years_experience,
      programmingLanguage: interview.programming_language,
      skills: interview.skills,
      interviewType: interview.interview_type,
      resumeText: interview.resume_text,
      jdText: interview.jd_text
    };
    let evaluation = null;
    const aSnapshot = await (0, import_firestore2.getDocs)((0, import_firestore2.query)((0, import_firestore2.collection)(db_default, "answers"), (0, import_firestore2.where)("question_id", "==", questionId)));
    const existingAnswerDoc = aSnapshot.empty ? null : aSnapshot.docs[0];
    if (!force_next) {
      evaluation = await evaluateF2FAnswer(context, question.question_text, answer_text, interview.company || "Google");
      if (evaluation.is_meta_command) {
        res.json({ is_meta_command: true, meta_action: evaluation.meta_action, meta_response: evaluation.meta_response });
        return;
      }
      const answerData = {
        question_id: questionId,
        answer_text,
        score: evaluation.score,
        reasoning: evaluation.reasoning,
        strengths: JSON.stringify(evaluation.strengths),
        weaknesses: JSON.stringify(evaluation.weaknesses),
        confidence: evaluation.confidence,
        ideal_answer: evaluation.ideal_answer,
        knowledge_gaps: JSON.stringify(evaluation.knowledge_gaps),
        learning_suggestions: JSON.stringify(evaluation.learning_suggestions),
        time_taken_seconds: time_taken_seconds || null,
        created_at: (0, import_firestore2.serverTimestamp)()
      };
      if (existingAnswerDoc) {
        await (0, import_firestore2.updateDoc)((0, import_firestore2.doc)(db_default, "answers", existingAnswerDoc.id), answerData);
      } else {
        await (0, import_firestore2.addDoc)((0, import_firestore2.collection)(db_default, "answers"), answerData);
      }
      if (evaluation.needs_retry) {
        res.json({ retry_allowed: true, evaluation, correction_explanation: evaluation.correction_explanation, correction_example: evaluation.correction_example });
        return;
      }
    }
    const qSnapshot = await (0, import_firestore2.getDocs)((0, import_firestore2.query)((0, import_firestore2.collection)(db_default, "questions"), (0, import_firestore2.where)("interview_id", "==", interviewId), (0, import_firestore2.orderBy)("order_idx", "asc")));
    const questions = qSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const questionsAndAnswers = [];
    for (const q of questions) {
      const aSnap = await (0, import_firestore2.getDocs)((0, import_firestore2.query)((0, import_firestore2.collection)(db_default, "answers"), (0, import_firestore2.where)("question_id", "==", q.id)));
      if (!aSnap.empty) {
        const a = aSnap.docs[0].data();
        questionsAndAnswers.push({
          question_text: q.question_text,
          topic: q.topic,
          difficulty: q.difficulty,
          expected_answer: q.expected_answer,
          answer_text: a.answer_text,
          score: a.score,
          reasoning: a.reasoning
        });
      } else {
        questionsAndAnswers.push({
          question_text: q.question_text,
          topic: q.topic,
          difficulty: q.difficulty,
          expected_answer: q.expected_answer
        });
      }
    }
    const isLastQuestion = questionsAndAnswers.length >= interview.num_questions;
    if (isLastQuestion) {
      res.json({ is_complete: true, evaluation });
      return;
    }
    const nextQuestionData = await generateF2FNextQuestion(context, interview.company || "Google", interview.interview_plan || "", questionsAndAnswers);
    if (nextQuestionData.is_complete) {
      res.json({ is_complete: true, evaluation });
      return;
    }
    const newQData = {
      interview_id: interviewId,
      question_text: nextQuestionData.question_text,
      topic: nextQuestionData.topic,
      difficulty: nextQuestionData.difficulty,
      expected_answer: nextQuestionData.expected_answer,
      hints: JSON.stringify([]),
      order_idx: questionsAndAnswers.length + 1
    };
    const qRef = await (0, import_firestore2.addDoc)((0, import_firestore2.collection)(db_default, "questions"), newQData);
    res.json({
      is_complete: false,
      evaluation,
      next_question: {
        id: qRef.id,
        question_text: nextQuestionData.question_text,
        topic: nextQuestionData.topic,
        difficulty: nextQuestionData.difficulty,
        expected_answer: nextQuestionData.expected_answer,
        order_idx: questionsAndAnswers.length + 1,
        transition_phrase: nextQuestionData.transition_phrase || ""
      }
    });
  } catch (error) {
    console.error("Error submitting F2F answer:", error);
    res.status(500).json({ error: String(error) });
  }
});
router.post("/interviews/:id/complete", async (req, res) => {
  const { integrityLogs } = req.body || {};
  const interviewId = req.params.id;
  try {
    const interviewDoc = await (0, import_firestore2.getDoc)((0, import_firestore2.doc)(db_default, "interviews", interviewId));
    if (!interviewDoc.exists()) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }
    const rSnapshot = await (0, import_firestore2.getDocs)((0, import_firestore2.query)((0, import_firestore2.collection)(db_default, "reports"), (0, import_firestore2.where)("interview_id", "==", interviewId)));
    if (!rSnapshot.empty) {
      res.json({ id: rSnapshot.docs[0].id, ...rSnapshot.docs[0].data() });
      return;
    }
    const interview = interviewDoc.data();
    const qSnapshot = await (0, import_firestore2.getDocs)((0, import_firestore2.query)((0, import_firestore2.collection)(db_default, "questions"), (0, import_firestore2.where)("interview_id", "==", interviewId), (0, import_firestore2.orderBy)("order_idx", "asc")));
    const questions = qSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const questionsAndAnswers = [];
    for (const q of questions) {
      const aSnap = await (0, import_firestore2.getDocs)((0, import_firestore2.query)((0, import_firestore2.collection)(db_default, "answers"), (0, import_firestore2.where)("question_id", "==", q.id)));
      if (!aSnap.empty) {
        const a = aSnap.docs[0].data();
        questionsAndAnswers.push({
          question_text: q.question_text,
          topic: q.topic,
          difficulty: q.difficulty,
          expected_answer: q.expected_answer,
          answer_text: a.answer_text,
          score: a.score,
          reasoning: a.reasoning,
          strengths: a.strengths,
          weaknesses: a.weaknesses,
          knowledge_gaps: a.knowledge_gaps
        });
      }
    }
    const context = {
      role: interview.role,
      difficulty: interview.difficulty,
      yearsExperience: interview.years_experience,
      programmingLanguage: interview.programming_language,
      skills: interview.skills,
      interviewType: interview.interview_type,
      resumeText: interview.resume_text,
      jdText: interview.jd_text
    };
    const reportData = await generateFinalReport(context, questionsAndAnswers);
    const newReportData = {
      resume_match_percentage: reportData.resume_match_percentage || 0,
      ats_missing_keywords: JSON.stringify(reportData.ats_missing_keywords || []),
      resume_vs_jd_analysis: reportData.resume_vs_jd_analysis || "",
      interview_id: interviewId,
      overall_score: reportData.overall_score,
      percentage: reportData.percentage,
      hiring_probability: reportData.hiring_probability,
      recommendation: reportData.recommendation,
      skill_level: reportData.skill_level,
      strengths: JSON.stringify(reportData.strengths),
      weaknesses: JSON.stringify(reportData.weaknesses),
      learning_roadmap: reportData.learning_roadmap,
      topics_to_improve: JSON.stringify(reportData.topics_to_improve),
      performance_heatmap: JSON.stringify(reportData.performance_heatmap),
      created_at: (0, import_firestore2.serverTimestamp)()
    };
    const reportRef = await (0, import_firestore2.addDoc)((0, import_firestore2.collection)(db_default, "reports"), newReportData);
    await (0, import_firestore2.updateDoc)((0, import_firestore2.doc)(db_default, "interviews", interviewId), { status: "completed", integrity_logs: JSON.stringify(integrityLogs || []) });
    res.json({ id: reportRef.id, ...newReportData });
  } catch (error) {
    console.error("Error completing interview:", error);
    res.status(500).json({ error: String(error) });
  }
});
router.delete("/interviews/:id", async (req, res) => {
  const interviewId = req.params.id;
  try {
    await (0, import_firestore2.deleteDoc)((0, import_firestore2.doc)(db_default, "interviews", interviewId));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting interview:", error);
    res.status(500).json({ error: String(error) });
  }
});
var routes_default = router;

// server/vercel.ts
var import_cors = __toESM(require("cors"), 1);
import_dotenv.default.config();
console.log("[Vercel] Serverless Function boot sequence initiated.");
var app2 = (0, import_express2.default)();
app2.use((req, res, next) => {
  console.log(`[Vercel] Incoming request: ${req.method} ${req.url}`);
  next();
});
app2.use((0, import_cors.default)());
app2.use((req, res, next) => {
  if (req.path === "/api/upload") {
    next();
  } else {
    import_express2.default.json()(req, res, next);
  }
});
app2.use("/api", routes_default);
app2.use("/api", (req, res, next) => {
  res.status(404).json({ error: "API route not found" });
});
app2.use("/api", (err, req, res, next) => {
  console.error("API Error:", err);
  res.status(err.status || 500).json({ success: false, step: "Global Error Handler", message: err.message || "Internal Server Error", stack: err.stack });
});
var maxDuration = 60;
var vercel_default = app2;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  maxDuration
});
//# sourceMappingURL=index.js.map
