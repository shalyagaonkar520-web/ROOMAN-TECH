"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const db_1 = __importDefault(require("./db"));
const firestore_1 = require("firebase/firestore");
const gemini_1 = require("./gemini");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post('/upload', upload.single('resume'), async (req, res) => {
    let step = 'Step 1: Resume upload started.';
    console.log(step);
    try {
        step = 'Step 2: Checking req.file.';
        console.log(step);
        if (!req.file) {
            console.error('req.file is undefined');
            console.error('req.headers:', req.headers);
            console.error('req.body:', req.body);
            return res.status(400).json({ success: false, step, message: 'No file uploaded', stack: null });
        }
        step = 'Step 4: Checking buffer.';
        console.log(step);
        if (!req.file.buffer) {
            console.error('req.file.buffer is undefined');
            return res.status(400).json({ success: false, step, message: 'File buffer is missing', stack: null });
        }
        if (req.file.buffer.length === 0) {
            console.error('Buffer length is 0');
            return res.status(400).json({ success: false, step, message: 'File buffer is empty', stack: null });
        }
        step = 'Step 3: Checking file type.';
        console.log(step);
        const mimeType = req.file.mimetype;
        const originalName = req.file.originalname;
        const bufferSize = req.file.buffer.length;
        console.log(`[Upload] File Name: ${originalName}`);
        console.log(`[Upload] File Size: ${req.file.size}`);
        console.log(`[Upload] Mime Type: ${mimeType}`);
        console.log(`[Upload] Buffer Size: ${bufferSize}`);
        const validMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validMimes.includes(mimeType) && !originalName.endsWith('.docx') && !originalName.endsWith('.pdf') && !originalName.endsWith('.doc')) {
            console.error('Unsupported MIME type:', mimeType);
            return res.status(400).json({ success: false, step, message: `Unsupported file type: ${mimeType}`, stack: null });
        }
        let text = '';
        const buffer = req.file.buffer;
        if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
            step = 'Step 5: Starting pdf-parse.';
            console.log(step);
            try {
                const pdfData = await (0, pdf_parse_1.default)(buffer);
                text = pdfData.text;
            }
            catch (parseErr) {
                console.error('PDFParse failed internally:', parseErr);
                throw parseErr;
            }
        }
        else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimeType === 'application/msword' ||
            originalName.endsWith('.docx') ||
            originalName.endsWith('.doc')) {
            step = 'Step 5: Starting mammoth (DOCX parse).';
            console.log(step);
            const docxData = await mammoth_1.default.extractRawText({ buffer });
            text = docxData.value;
        }
        else {
            return res.status(400).json({ success: false, step, message: `Unsupported file type: ${mimeType}`, stack: null });
        }
        step = 'Step 6: PDF parsed successfully.';
        console.log(step);
        console.log(`[Upload] Extracted text length: ${text?.length}`);
        if (!text || text.trim().length === 0) {
            console.error('Extracted text is empty');
            return res.status(400).json({ success: false, step, message: 'No text could be extracted.', stack: null });
        }
        step = 'Step 7: Calling Groq API.';
        let extractedData = {};
        if (req.body.type === 'resume') {
            try {
                extractedData = await (0, gemini_1.extractResumeDetails)(text);
                console.log('Step 8: Received Groq response.');
            }
            catch (e) {
                console.error('Error extracting resume data:', e);
                return res.status(500).json({ success: false, step: 'Groq API Error', message: e.message, stack: e.stack });
            }
        }
        step = 'Step 10: Returning response.';
        console.log(step);
        res.json({ success: true, text, ...extractedData });
    }
    catch (error) {
        console.error(error);
        console.error('req.file:', req.file);
        console.error('req.headers:', req.headers);
        console.error('req.body:', req.body);
        res.status(500).json({ success: false, step, message: error.message, stack: error.stack });
    }
});
// Get all interviews (History)
router.get('/interviews', async (req, res) => {
    try {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(db_1.default, 'interviews'), (0, firestore_1.orderBy)('created_at', 'desc'));
        const snapshot = await (0, firestore_1.getDocs)(q);
        const interviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        res.json(interviews);
    }
    catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
// Start new interview
router.post('/interviews', async (req, res) => {
    const { role, difficulty, numQuestions, yearsExperience, programmingLanguage, skills, interviewType, resumeText, jdText, mode = 'premium', company, candidateName } = req.body;
    if (!role || !difficulty || !numQuestions || !yearsExperience || !programmingLanguage || !skills || !interviewType) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    try {
        const context = { role, difficulty, yearsExperience, programmingLanguage, skills, interviewType, numQuestions, resumeText, jdText, candidateName };
        let questions = [];
        let welcomeMessage = '';
        let plan = '';
        if (mode === 'face_to_face') {
            const f2fPlan = await (0, gemini_1.generateF2FPlanAndFirstQuestion)(context, company || 'Google');
            plan = f2fPlan.plan;
            welcomeMessage = f2fPlan.welcome_message;
            questions = [{
                    question_text: f2fPlan.question_text,
                    topic: f2fPlan.topic,
                    difficulty: f2fPlan.difficulty,
                    expected_answer: f2fPlan.expected_answer
                }];
        }
        else {
            questions = await (0, gemini_1.generateQuestions)(context);
        }
        // Create Interview Document
        const interviewData = {
            role, difficulty, num_questions: numQuestions, years_experience: yearsExperience,
            programming_language: programmingLanguage, skills, interview_type: interviewType,
            status: 'in-progress', resume_text: resumeText || null, jd_text: jdText || null,
            mode, company: company || null, interview_plan: plan || null,
            candidate_name: candidateName || 'Candidate', created_at: (0, firestore_1.serverTimestamp)()
        };
        const interviewRef = await (0, firestore_1.addDoc)((0, firestore_1.collection)(db_1.default, 'interviews'), interviewData);
        const interviewId = interviewRef.id;
        // Create Question Documents
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
            const qRef = await (0, firestore_1.addDoc)((0, firestore_1.collection)(db_1.default, 'questions'), qData);
            formattedQuestions.push({ id: qRef.id, ...qData });
        }
        res.json({ id: interviewId, questions: formattedQuestions, welcome_message: welcomeMessage });
    }
    catch (error) {
        console.error('Error starting interview:', error);
        res.status(500).json({ error: String(error) });
    }
});
// Get interview by ID
router.get('/interviews/:id', async (req, res) => {
    const interviewId = req.params.id;
    try {
        const interviewDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(db_1.default, 'interviews', interviewId));
        if (!interviewDoc.exists()) {
            res.status(404).json({ error: 'Interview not found' });
            return;
        }
        const interview = { id: interviewDoc.id, ...interviewDoc.data() };
        // Get questions
        const qSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(db_1.default, 'questions'), (0, firestore_1.where)('interview_id', '==', interviewId), (0, firestore_1.orderBy)('order_idx', 'asc')));
        const questions = qSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Get answers (fetch all answers matching the question IDs)
        const answers = [];
        if (questions.length > 0) {
            const questionIds = questions.map(q => q.id);
            // Firestore 'in' query supports up to 10 items. Assuming < 10 questions for MVP, otherwise we iterate.
            for (const qId of questionIds) {
                const aSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(db_1.default, 'answers'), (0, firestore_1.where)('question_id', '==', qId)));
                aSnapshot.docs.forEach(d => answers.push({ id: d.id, ...d.data() }));
            }
        }
        // Get report
        const rSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(db_1.default, 'reports'), (0, firestore_1.where)('interview_id', '==', interviewId)));
        const report = rSnapshot.empty ? null : { id: rSnapshot.docs[0].id, ...rSnapshot.docs[0].data() };
        res.json({ interview, questions, answers, report });
    }
    catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
// Submit answer
router.post('/interviews/:id/questions/:qId/answer', async (req, res) => {
    const interviewId = req.params.id;
    const questionId = req.params.qId;
    const { answer_text, time_taken_seconds } = req.body;
    if (!answer_text) {
        res.status(400).json({ error: 'Answer text is required' });
        return;
    }
    try {
        const interviewDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(db_1.default, 'interviews', interviewId));
        const questionDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(db_1.default, 'questions', questionId));
        if (!interviewDoc.exists() || !questionDoc.exists()) {
            res.status(404).json({ error: 'Interview or question not found' });
            return;
        }
        const interview = interviewDoc.data();
        const question = questionDoc.data();
        const context = {
            role: interview.role, difficulty: interview.difficulty, yearsExperience: interview.years_experience,
            programmingLanguage: interview.programming_language, skills: interview.skills, interviewType: interview.interview_type,
            resumeText: interview.resume_text, jdText: interview.jd_text
        };
        const evaluation = await (0, gemini_1.evaluateAnswer)(context, question.question_text, answer_text);
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
            created_at: (0, firestore_1.serverTimestamp)()
        };
        const answerRef = await (0, firestore_1.addDoc)((0, firestore_1.collection)(db_1.default, 'answers'), answerData);
        res.json({ id: answerRef.id, evaluation });
    }
    catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({ error: String(error) });
    }
});
// Submit answer for Face-to-Face Interview
router.post('/interviews/:id/questions/:qId/f2f-answer', async (req, res) => {
    const interviewId = req.params.id;
    const questionId = req.params.qId;
    const { answer_text, time_taken_seconds, force_next = false } = req.body;
    if (!answer_text && !force_next) {
        res.status(400).json({ error: 'Answer text is required' });
        return;
    }
    try {
        const interviewDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(db_1.default, 'interviews', interviewId));
        const questionDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(db_1.default, 'questions', questionId));
        if (!interviewDoc.exists() || !questionDoc.exists()) {
            res.status(404).json({ error: 'Interview or question not found' });
            return;
        }
        const interview = interviewDoc.data();
        const question = questionDoc.data();
        const context = {
            role: interview.role, difficulty: interview.difficulty, yearsExperience: interview.years_experience,
            programmingLanguage: interview.programming_language, skills: interview.skills, interviewType: interview.interview_type,
            resumeText: interview.resume_text, jdText: interview.jd_text
        };
        let evaluation = null;
        const aSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(db_1.default, 'answers'), (0, firestore_1.where)('question_id', '==', questionId)));
        const existingAnswerDoc = aSnapshot.empty ? null : aSnapshot.docs[0];
        if (!force_next) {
            evaluation = await (0, gemini_1.evaluateF2FAnswer)(context, question.question_text, answer_text, interview.company || 'Google');
            if (evaluation.is_meta_command) {
                res.json({ is_meta_command: true, meta_action: evaluation.meta_action, meta_response: evaluation.meta_response });
                return;
            }
            const answerData = {
                question_id: questionId, answer_text, score: evaluation.score, reasoning: evaluation.reasoning,
                strengths: JSON.stringify(evaluation.strengths), weaknesses: JSON.stringify(evaluation.weaknesses),
                confidence: evaluation.confidence, ideal_answer: evaluation.ideal_answer,
                knowledge_gaps: JSON.stringify(evaluation.knowledge_gaps), learning_suggestions: JSON.stringify(evaluation.learning_suggestions),
                time_taken_seconds: time_taken_seconds || null, created_at: (0, firestore_1.serverTimestamp)()
            };
            if (existingAnswerDoc) {
                await (0, firestore_1.updateDoc)((0, firestore_1.doc)(db_1.default, 'answers', existingAnswerDoc.id), answerData);
            }
            else {
                await (0, firestore_1.addDoc)((0, firestore_1.collection)(db_1.default, 'answers'), answerData);
            }
            if (evaluation.needs_retry) {
                res.json({ retry_allowed: true, evaluation, correction_explanation: evaluation.correction_explanation, correction_example: evaluation.correction_example });
                return;
            }
        }
        // Get all questions and answers for next question generation
        const qSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(db_1.default, 'questions'), (0, firestore_1.where)('interview_id', '==', interviewId), (0, firestore_1.orderBy)('order_idx', 'asc')));
        const questions = qSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const questionsAndAnswers = [];
        for (const q of questions) {
            const aSnap = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(db_1.default, 'answers'), (0, firestore_1.where)('question_id', '==', q.id)));
            if (!aSnap.empty) {
                const a = aSnap.docs[0].data();
                questionsAndAnswers.push({
                    question_text: q.question_text, topic: q.topic, difficulty: q.difficulty, expected_answer: q.expected_answer,
                    answer_text: a.answer_text, score: a.score, reasoning: a.reasoning
                });
            }
            else {
                questionsAndAnswers.push({
                    question_text: q.question_text, topic: q.topic, difficulty: q.difficulty, expected_answer: q.expected_answer
                });
            }
        }
        const isLastQuestion = questionsAndAnswers.length >= interview.num_questions;
        if (isLastQuestion) {
            res.json({ is_complete: true, evaluation });
            return;
        }
        const nextQuestionData = await (0, gemini_1.generateF2FNextQuestion)(context, interview.company || 'Google', interview.interview_plan || '', questionsAndAnswers);
        if (nextQuestionData.is_complete) {
            res.json({ is_complete: true, evaluation });
            return;
        }
        const newQData = {
            interview_id: interviewId, question_text: nextQuestionData.question_text, topic: nextQuestionData.topic,
            difficulty: nextQuestionData.difficulty, expected_answer: nextQuestionData.expected_answer,
            hints: JSON.stringify([]), order_idx: questionsAndAnswers.length + 1
        };
        const qRef = await (0, firestore_1.addDoc)((0, firestore_1.collection)(db_1.default, 'questions'), newQData);
        res.json({
            is_complete: false, evaluation,
            next_question: {
                id: qRef.id, question_text: nextQuestionData.question_text, topic: nextQuestionData.topic,
                difficulty: nextQuestionData.difficulty, expected_answer: nextQuestionData.expected_answer,
                order_idx: questionsAndAnswers.length + 1, transition_phrase: nextQuestionData.transition_phrase || ''
            }
        });
    }
    catch (error) {
        console.error('Error submitting F2F answer:', error);
        res.status(500).json({ error: String(error) });
    }
});
// Complete interview and generate report
router.post('/interviews/:id/complete', async (req, res) => {
    const { integrityLogs } = req.body || {};
    const interviewId = req.params.id;
    try {
        const interviewDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(db_1.default, 'interviews', interviewId));
        if (!interviewDoc.exists()) {
            res.status(404).json({ error: 'Interview not found' });
            return;
        }
        // Check if report already exists
        const rSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(db_1.default, 'reports'), (0, firestore_1.where)('interview_id', '==', interviewId)));
        if (!rSnapshot.empty) {
            res.json({ id: rSnapshot.docs[0].id, ...rSnapshot.docs[0].data() });
            return;
        }
        const interview = interviewDoc.data();
        const qSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(db_1.default, 'questions'), (0, firestore_1.where)('interview_id', '==', interviewId), (0, firestore_1.orderBy)('order_idx', 'asc')));
        const questions = qSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const questionsAndAnswers = [];
        for (const q of questions) {
            const aSnap = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(db_1.default, 'answers'), (0, firestore_1.where)('question_id', '==', q.id)));
            if (!aSnap.empty) {
                const a = aSnap.docs[0].data();
                questionsAndAnswers.push({
                    question_text: q.question_text, topic: q.topic, difficulty: q.difficulty, expected_answer: q.expected_answer,
                    answer_text: a.answer_text, score: a.score, reasoning: a.reasoning, strengths: a.strengths, weaknesses: a.weaknesses, knowledge_gaps: a.knowledge_gaps
                });
            }
        }
        const context = {
            role: interview.role, difficulty: interview.difficulty, yearsExperience: interview.years_experience,
            programmingLanguage: interview.programming_language, skills: interview.skills, interviewType: interview.interview_type,
            resumeText: interview.resume_text, jdText: interview.jd_text
        };
        const reportData = await (0, gemini_1.generateFinalReport)(context, questionsAndAnswers);
        const newReportData = {
            resume_match_percentage: reportData.resume_match_percentage || 0,
            ats_missing_keywords: JSON.stringify(reportData.ats_missing_keywords || []),
            resume_vs_jd_analysis: reportData.resume_vs_jd_analysis || '',
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
            created_at: (0, firestore_1.serverTimestamp)()
        };
        const reportRef = await (0, firestore_1.addDoc)((0, firestore_1.collection)(db_1.default, 'reports'), newReportData);
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(db_1.default, 'interviews', interviewId), { status: 'completed', integrity_logs: JSON.stringify(integrityLogs || []) });
        res.json({ id: reportRef.id, ...newReportData });
    }
    catch (error) {
        console.error('Error completing interview:', error);
        res.status(500).json({ error: String(error) });
    }
});
// Delete interview
router.delete('/interviews/:id', async (req, res) => {
    const interviewId = req.params.id;
    try {
        await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(db_1.default, 'interviews', interviewId));
        // Note: To mimic ON DELETE CASCADE, we should delete questions, answers, and reports here in a real production environment.
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting interview:', error);
        res.status(500).json({ error: String(error) });
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map