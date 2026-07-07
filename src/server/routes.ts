import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import db from './db';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { 
  generateQuestions, 
  evaluateAnswer, 
  generateFinalReport, 
  extractResumeDetails,
  generateF2FPlanAndFirstQuestion,
  evaluateF2FAnswer,
  generateF2FNextQuestion,
  extractFullResume,
  evaluateAts,
  optimizeResume,
  generateCoverLetter,
  compareJd
} from './gemini';
import { sendWelcomeEmail, sendInterviewReportEmail, sendWeeklyProgressEmail } from './emailService';


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('resume') as any, async (req: any, res: any) => {
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
        const pdfData = await pdf(buffer);
        text = pdfData.text;
      } catch (parseErr: any) {
         console.error('PDFParse failed internally:', parseErr);
         throw parseErr;
      }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mimeType === 'application/msword' ||
      originalName.endsWith('.docx') ||
      originalName.endsWith('.doc')
    ) {
      step = 'Step 5: Starting mammoth (DOCX parse).';
      console.log(step);
      const docxData = await mammoth.extractRawText({ buffer });
      text = docxData.value;
    } else {
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
         extractedData = await extractResumeDetails(text);
         console.log('Step 8: Received Groq response:', JSON.stringify(extractedData));
      } catch (e: any) {
         console.error('Error extracting resume data:', e);
         return res.status(500).json({ success: false, step: 'Groq API Error', message: e.message, stack: e.stack });
      }
    }
    
    step = 'Step 10: Returning response.';
    console.log(step);
    res.json({ success: true, text, ...extractedData });
  } catch (error: any) {
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
    const { userId } = req.query;
    let q;
    if (userId) {
      q = query(collection(db, 'interviews'), where('userId', '==', userId), orderBy('created_at', 'desc'));
    } else {
      q = query(collection(db, 'interviews'), orderBy('created_at', 'desc'));
    }
    const snapshot = await getDocs(q);
    const interviews = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Start new interview
router.post('/interviews', async (req, res) => {
  let { role, difficulty, numQuestions, yearsExperience, programmingLanguage, skills, interviewType, resumeText, jdText, mode = 'premium', company, candidateName, userId, email } = req.body;
  if (mode === 'premium') {
    numQuestions = 10;
  }
  if (!role || !difficulty || !numQuestions || !yearsExperience || !programmingLanguage || !skills || !interviewType) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const context = { role, difficulty, yearsExperience, programmingLanguage, skills, interviewType, numQuestions, resumeText, jdText, candidateName };
    
    let questions: any[] = [];
    let welcomeMessage = '';
    let plan = '';

    if (mode === 'face_to_face') {
      const f2fPlan = await generateF2FPlanAndFirstQuestion(context, company || 'Google');
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
    
    // Create Interview Document
    const interviewData = {
      role, difficulty, num_questions: numQuestions, years_experience: yearsExperience, 
      programming_language: programmingLanguage, skills, interview_type: interviewType, 
      status: 'in-progress', resume_text: resumeText || null, jd_text: jdText || null, 
      mode, company: company || null, interview_plan: plan || null, 
      candidate_name: candidateName || 'Candidate', created_at: serverTimestamp(),
      userId: userId || null, email: email || null
    };
    
    const interviewRef = await addDoc(collection(db, 'interviews'), interviewData);
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
        question_type: q.question_type || (idx < 20 ? 'mcq' : 'coding'),
        options: JSON.stringify(q.options || []),
        hints: JSON.stringify([]),
        order_idx: idx + 1
      };
      const qRef = await addDoc(collection(db, 'questions'), qData);
      formattedQuestions.push({ id: qRef.id, ...qData });
    }

    res.json({ id: interviewId, questions: formattedQuestions, welcome_message: welcomeMessage });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Get interview by ID
router.get('/interviews/:id', async (req, res) => {
  const interviewId = req.params.id;
  try {
    const interviewDoc = await getDoc(doc(db, 'interviews', interviewId));
    if (!interviewDoc.exists()) {
      res.status(404).json({ error: 'Interview not found' });
      return;
    }
    const interview = { id: interviewDoc.id, ...(interviewDoc.data() as any) };

    // Get questions
    const qSnapshot = await getDocs(query(collection(db, 'questions'), where('interview_id', '==', interviewId), orderBy('order_idx', 'asc')));
    const questions = qSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

    // Get answers (fetch all answers matching the question IDs)
    const answers: any[] = [];
    if (questions.length > 0) {
      const questionIds = questions.map(q => q.id);
      // Firestore 'in' query supports up to 10 items. Assuming < 10 questions for MVP, otherwise we iterate.
      for (const qId of questionIds) {
        const aSnapshot = await getDocs(query(collection(db, 'answers'), where('question_id', '==', qId)));
        aSnapshot.docs.forEach(d => answers.push({ id: d.id, ...(d.data() as any) }));
      }
    }

    // Get report
    const rSnapshot = await getDocs(query(collection(db, 'reports'), where('interview_id', '==', interviewId)));
    const report = rSnapshot.empty ? null : { id: rSnapshot.docs[0].id, ...(rSnapshot.docs[0].data() as any) };

    res.json({ interview, questions, answers, report });
  } catch (error) {
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
    const interviewDoc = await getDoc(doc(db, 'interviews', interviewId));
    const questionDoc = await getDoc(doc(db, 'questions', questionId));

    if (!interviewDoc.exists() || !questionDoc.exists()) {
      res.status(404).json({ error: 'Interview or question not found' });
      return;
    }

    const interview = interviewDoc.data() as any;
    const question = questionDoc.data() as any;

    const context = {
      role: interview.role, difficulty: interview.difficulty, yearsExperience: interview.years_experience,
      programmingLanguage: interview.programming_language, skills: interview.skills, interviewType: interview.interview_type,
      resumeText: interview.resume_text, jdText: interview.jd_text
    };

    let evaluation;
    if (question.question_type === 'mcq') {
      const selectedOption = answer_text.trim().toUpperCase().charAt(0);
      const isCorrect = selectedOption === question.expected_answer.trim().toUpperCase().charAt(0);
      evaluation = {
        score: isCorrect ? 10 : 0,
        reasoning: isCorrect 
          ? `Correct option selected: ${question.expected_answer}` 
          : `Incorrect selection. The correct option is ${question.expected_answer}.`,
        strengths: isCorrect ? ["Accurate knowledge"] : [],
        weaknesses: isCorrect ? [] : ["Incorrect selection"],
        confidence: isCorrect ? 100 : 0,
        ideal_answer: `The correct option is: ${question.expected_answer}`,
        knowledge_gaps: isCorrect ? [] : ["Concept misunderstanding"],
        learning_suggestions: isCorrect ? ["Good job! Maintain this level."] : ["Read carefully about this concept to improve."]
      };
    } else {
      evaluation = await evaluateAnswer(context, question.question_text, answer_text);
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
      created_at: serverTimestamp()
    };

    const answerRef = await addDoc(collection(db, 'answers'), answerData);

    res.json({ id: answerRef.id, evaluation });
  } catch (error) {
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
    const interviewDoc = await getDoc(doc(db, 'interviews', interviewId));
    const questionDoc = await getDoc(doc(db, 'questions', questionId));

    if (!interviewDoc.exists() || !questionDoc.exists()) {
      res.status(404).json({ error: 'Interview or question not found' });
      return;
    }

    const interview = interviewDoc.data() as any;
    const question = questionDoc.data() as any;

    const context = {
      role: interview.role, difficulty: interview.difficulty, yearsExperience: interview.years_experience,
      programmingLanguage: interview.programming_language, skills: interview.skills, interviewType: interview.interview_type,
      resumeText: interview.resume_text, jdText: interview.jd_text
    };

    let evaluation: any = null;
    const aSnapshot = await getDocs(query(collection(db, 'answers'), where('question_id', '==', questionId)));
    const existingAnswerDoc = aSnapshot.empty ? null : aSnapshot.docs[0];

    if (!force_next) {
      evaluation = await evaluateF2FAnswer(context, question.question_text, answer_text, interview.company || 'Google');

      if (evaluation.is_meta_command) {
        res.json({ is_meta_command: true, meta_action: evaluation.meta_action, meta_response: evaluation.meta_response });
        return;
      }

      const answerData = {
        question_id: questionId, answer_text, score: evaluation.score, reasoning: evaluation.reasoning,
        strengths: JSON.stringify(evaluation.strengths), weaknesses: JSON.stringify(evaluation.weaknesses),
        confidence: evaluation.confidence, ideal_answer: evaluation.ideal_answer,
        knowledge_gaps: JSON.stringify(evaluation.knowledge_gaps), learning_suggestions: JSON.stringify(evaluation.learning_suggestions),
        time_taken_seconds: time_taken_seconds || null, created_at: serverTimestamp()
      };

      if (existingAnswerDoc) {
        await updateDoc(doc(db, 'answers', existingAnswerDoc.id), answerData);
      } else {
        await addDoc(collection(db, 'answers'), answerData);
      }

      if (evaluation.needs_retry) {
        res.json({ retry_allowed: true, evaluation, correction_explanation: evaluation.correction_explanation, correction_example: evaluation.correction_example });
        return;
      }
    }

    // Get all questions and answers for next question generation
    const qSnapshot = await getDocs(query(collection(db, 'questions'), where('interview_id', '==', interviewId), orderBy('order_idx', 'asc')));
    const questions = qSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any[];
    
    const questionsAndAnswers = [];
    for (const q of questions) {
      const aSnap = await getDocs(query(collection(db, 'answers'), where('question_id', '==', q.id)));
      if (!aSnap.empty) {
        const a = aSnap.docs[0].data();
        questionsAndAnswers.push({
          question_text: q.question_text, topic: q.topic, difficulty: q.difficulty, expected_answer: q.expected_answer,
          answer_text: a.answer_text, score: a.score, reasoning: a.reasoning
        });
      } else {
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

    const nextQuestionData = await generateF2FNextQuestion(context, interview.company || 'Google', interview.interview_plan || '', questionsAndAnswers);

    if (nextQuestionData.is_complete) {
      res.json({ is_complete: true, evaluation });
      return;
    }

    const newQData = {
      interview_id: interviewId, question_text: nextQuestionData.question_text, topic: nextQuestionData.topic,
      difficulty: nextQuestionData.difficulty, expected_answer: nextQuestionData.expected_answer,
      hints: JSON.stringify([]), order_idx: questionsAndAnswers.length + 1
    };
    const qRef = await addDoc(collection(db, 'questions'), newQData);

    res.json({
      is_complete: false, evaluation,
      next_question: {
        id: qRef.id, question_text: nextQuestionData.question_text, topic: nextQuestionData.topic,
        difficulty: nextQuestionData.difficulty, expected_answer: nextQuestionData.expected_answer,
        order_idx: questionsAndAnswers.length + 1, transition_phrase: nextQuestionData.transition_phrase || ''
      }
    });
  } catch (error) {
    console.error('Error submitting F2F answer:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Complete interview and generate report
router.post('/interviews/:id/complete', async (req, res) => {
  const { integrityLogs } = req.body || {};
  const interviewId = req.params.id;
  try {
    const interviewDoc = await getDoc(doc(db, 'interviews', interviewId));
    if (!interviewDoc.exists()) {
      res.status(404).json({ error: 'Interview not found' });
      return;
    }

    // Check if report already exists
    const rSnapshot = await getDocs(query(collection(db, 'reports'), where('interview_id', '==', interviewId)));
    if (!rSnapshot.empty) {
      res.json({ id: rSnapshot.docs[0].id, ...(rSnapshot.docs[0].data() as any) });
      return;
    }

    const interview = interviewDoc.data() as any;

    const qSnapshot = await getDocs(query(collection(db, 'questions'), where('interview_id', '==', interviewId), orderBy('order_idx', 'asc')));
    const questions = qSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any[];
    
    const questionsAndAnswers = [];
    for (const q of questions) {
      const aSnap = await getDocs(query(collection(db, 'answers'), where('question_id', '==', q.id)));
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

    const reportData = await generateFinalReport(context, questionsAndAnswers);
    
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
      created_at: serverTimestamp()
    };

    const reportRef = await addDoc(collection(db, 'reports'), newReportData);
    await updateDoc(doc(db, 'interviews', interviewId), { status: 'completed', integrity_logs: JSON.stringify(integrityLogs || []) });

    // Asynchronously trigger Resend report email without blocking HTTP completion
    sendInterviewReportEmail(interviewId).catch((err) => {
      console.error(`[Background Email Worker Error] Failed to send report email for interview ${interviewId}:`, err);
    });

    res.json({ id: reportRef.id, ...newReportData });
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Delete interview
router.delete('/interviews/:id', async (req, res) => {
  const interviewId = req.params.id;
  try {
    await deleteDoc(doc(db, 'interviews', interviewId));
    // Note: To mimic ON DELETE CASCADE, we should delete questions, answers, and reports here in a real production environment.
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Trigger Welcome Email manually / after successful auth
router.post('/auth/welcome-email', async (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    // Check if user already got a welcome email by scanning firestore users collection
    const uSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
    let isNewUser = true;
    let userDocId = '';
    let alreadySent = false;

    if (!uSnapshot.empty) {
      isNewUser = false;
      userDocId = uSnapshot.docs[0].id;
      const userData = uSnapshot.docs[0].data() as any;
      if (userData.welcomeEmailSent === true) {
        alreadySent = true;
      }
    }

    if (isNewUser) {
      // Add user to database with requested fields
      const userRef = await addDoc(collection(db, 'users'), {
        email,
        name: name || 'Candidate',
        createdAt: serverTimestamp(),
        created_at: serverTimestamp(),
        welcomeEmailSent: true,
        last_weekly_report_sent_at: null
      });
      userDocId = userRef.id;

      // Trigger Welcome Email
      const success = await sendWelcomeEmail(email, name || 'Candidate');
      res.json({ success, message: 'Welcome email triggered for new user.', userDocId });
    } else {
      if (alreadySent) {
        res.json({ success: true, message: 'Welcome email already sent previously. Skipping.', userDocId });
      } else {
        // Update existing user doc
        await updateDoc(doc(db, 'users', userDocId), {
          welcomeEmailSent: true
        });
        const success = await sendWelcomeEmail(email, name || 'Candidate');
        res.json({ success, message: 'Welcome email triggered for existing user.', userDocId });
      }
    }
  } catch (error) {
    console.error('Error triggering welcome email:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/analytics - aggregate dashboard data for a given user
router.get('/analytics', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  try {
    // Fetch completed interviews for the user
    const q = query(
      collection(db, 'interviews'),
      where('userId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('created_at', 'asc')
    );
    const snapshot = await getDocs(q);
    const interviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    if (interviews.length === 0) {
      res.json({
        interviewCount: 0,
        averageScore: 0,
        highestScore: 0,
        trends: [],
        heatmap: {}
      });
      return;
    }

    let totalScore = 0;
    let highestScore = 0;
    const trends: any[] = [];
    const heatmap: Record<string, { total: number; count: number }> = {};

    for (const interview of interviews) {
      // Get report
      const rSnapshot = await getDocs(query(collection(db, 'reports'), where('interview_id', '==', interview.id)));
      if (!rSnapshot.empty) {
        const report = rSnapshot.docs[0].data();
        const score = report.overall_score || 0;
        totalScore += score;
        if (score > highestScore) highestScore = score;

        const date = interview.created_at?.toDate 
          ? interview.created_at.toDate() 
          : new Date(interview.created_at || Date.now());

        trends.push({
          id: interview.id,
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score,
          hiringProbability: report.hiring_probability || 0,
          resumeMatch: report.resume_match_percentage || 0,
          atsMatch: 100 - JSON.parse(report.ats_missing_keywords || '[]').length * 5 // simulated
        });

        // Heatmap aggregation
        const heat = JSON.parse(report.performance_heatmap || '{}');
        Object.keys(heat).forEach(topic => {
          if (!heatmap[topic]) heatmap[topic] = { total: 0, count: 0 };
          heatmap[topic].total += heat[topic];
          heatmap[topic].count += 1;
        });
      }
    }

    const finalHeatmap: Record<string, number> = {};
    Object.keys(heatmap).forEach(topic => {
      finalHeatmap[topic] = Math.round(heatmap[topic].total / heatmap[topic].count);
    });

    res.json({
      interviewCount: interviews.length,
      averageScore: interviews.length > 0 ? Math.round(totalScore / interviews.length) : 0,
      highestScore,
      trends,
      heatmap: finalHeatmap
    });
  } catch (error) {
    console.error('Error generating analytics dashboard aggregate:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Webhook / Cron trigger endpoint to process weekly progress updates
router.get('/cron/weekly-progress', async (req, res) => {
  console.log('[Cron Job] Commencing automated weekly progress processing...');
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let emailsSent = 0;

    for (const uDoc of usersSnapshot.docs) {
      const user = uDoc.data();
      const lastSent = user.last_weekly_report_sent_at?.toDate 
        ? user.last_weekly_report_sent_at.toDate() 
        : user.last_weekly_report_sent_at 
          ? new Date(user.last_weekly_report_sent_at) 
          : null;
      
      const email = user.email;
      const name = user.name || 'Candidate';
      
      // Check if it has been 7 days
      const shouldSend = !lastSent || (Date.now() - lastSent.getTime() >= 7 * 24 * 60 * 60 * 1000);
      
      if (shouldSend && email) {
        // Query to find user's interviews (interviews are created with userId)
        // Wait, to do that we need to find their userId. We can assume the userId can be matched by query
        // Or we can find interviews matching the email address!
        // Searching interviews matching user email is extremely reliable!
        const iSnapshot = await getDocs(query(collection(db, 'interviews'), where('email', '==', email)));
        if (!iSnapshot.empty) {
          const userId = iSnapshot.docs[0].data().userId;
          if (userId) {
            console.log(`Triggering weekly report for ${email}...`);
            await sendWeeklyProgressEmail(email, userId, name);
            
            // Update last sent date
            await updateDoc(doc(db, 'users', uDoc.id), {
              last_weekly_report_sent_at: serverTimestamp()
            });
            emailsSent++;
          }
        }
      }
    }

    res.json({ success: true, message: `Completed weekly cron. Sent ${emailsSent} reports.` });
  } catch (error) {
    console.error('[Cron Job Error] Failed to process weekly progress report:', error);
    res.status(500).json({ error: String(error) });
  }
});

export default router;

// Career Assistant Routes

router.post('/career/extract', async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'resumeText is required' });
    const data = await extractFullResume(resumeText);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/career/evaluate-ats', async (req, res) => {
  try {
    const { parsedResume, targetRole } = req.body;
    const data = await evaluateAts(parsedResume, targetRole);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/career/optimize', async (req, res) => {
  try {
    const { parsedResume, additionalDetails, userId } = req.body;
    const data = await optimizeResume(parsedResume, additionalDetails);
    
    if (userId) {
      await addDoc(collection(db, 'resumes'), {
        userId,
        originalData: parsedResume,
        optimizedData: data.optimizedResume,
        oldAtsScore: data.oldAtsScore,
        newAtsScore: data.newAtsScore,
        created_at: serverTimestamp()
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/career/cover-letter', async (req, res) => {
  try {
    const { optimizedResume, targetRole, targetCompany, userId } = req.body;
    const data = await generateCoverLetter(optimizedResume, targetRole, targetCompany);
    
    if (userId) {
      await addDoc(collection(db, 'cover_letters'), {
        userId,
        targetRole,
        targetCompany,
        content: data.coverLetterText,
        created_at: serverTimestamp()
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/career/match-jd', async (req, res) => {
  try {
    const { parsedResume, jdText } = req.body;
    const data = await compareJd(parsedResume, jdText);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/career/history', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const resumesQuery = query(collection(db, 'resumes'), where('userId', '==', userId), orderBy('created_at', 'desc'));
    const resumesSnap = await getDocs(resumesQuery);
    const resumes = resumesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const clQuery = query(collection(db, 'cover_letters'), where('userId', '==', userId), orderBy('created_at', 'desc'));
    const clSnap = await getDocs(clQuery);
    const coverLetters = clSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({ resumes, coverLetters });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


