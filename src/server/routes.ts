import express from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import db from './db';
import { 
  generateQuestions, 
  evaluateAnswer, 
  generateFinalReport, 
  extractResumeDetails,
  generateF2FPlanAndFirstQuestion,
  evaluateF2FAnswer,
  generateF2FNextQuestion
} from './gemini';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    
    let text = '';
    const buffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    
    if (mimeType === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();
      await parser.destroy();
      text = pdfData.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      req.file.originalname.endsWith('.docx')
    ) {
      const docxData = await mammoth.extractRawText({ buffer });
      text = docxData.value;
    } else {
      text = buffer.toString('utf-8');
    }
    
        let extractedData = {};
    if (req.body.type === 'resume') {
      try {
         extractedData = await extractResumeDetails(text);
      } catch (e) {
         console.error('Error extracting resume data:', e);
      }
    }
    res.json({ text, ...extractedData });
  } catch (error) {
    console.error('File parsing error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Get all interviews (History)
router.get('/interviews', (req, res) => {
  try {
    const interviews = db.prepare('SELECT * FROM interviews ORDER BY created_at DESC').all();
    res.json(interviews);
  } catch (error) {
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
    
    // Begin transaction
    const insertInterview = db.prepare('INSERT INTO interviews (role, difficulty, num_questions, years_experience, programming_language, skills, interview_type, status, resume_text, jd_text, mode, company, interview_plan, candidate_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertQuestion = db.prepare('INSERT INTO questions (interview_id, question_text, topic, difficulty, expected_answer, hints, order_idx) VALUES (?, ?, ?, ?, ?, ?, ?)');
    
    const transaction = db.transaction(() => {
      let interviewId;
      try {
          const interviewResult = insertInterview.run(
            role, difficulty, numQuestions, yearsExperience, programmingLanguage, skills, interviewType, 'in-progress', 
            resumeText || null, jdText || null, mode, company || null, plan || null, candidateName || 'Candidate'
          );
          interviewId = interviewResult.lastInsertRowid;
      } catch(err: any) {
          if (err.message.includes('has no column named candidate_name') || err.message.includes('table interviews has no column named candidate_name')) {
              try { db.prepare('ALTER TABLE interviews ADD COLUMN candidate_name TEXT DEFAULT "Candidate"').run(); } catch(e) {}
              const interviewResult = insertInterview.run(
                role, difficulty, numQuestions, yearsExperience, programmingLanguage, skills, interviewType, 'in-progress', 
                resumeText || null, jdText || null, mode, company || null, plan || null, candidateName || 'Candidate'
              );
              interviewId = interviewResult.lastInsertRowid;
          } else {
              throw err;
          }
      }

      questions.forEach((q: any, idx: number) => {
        insertQuestion.run(
          interviewId, 
          q.question_text, 
          q.topic, 
          q.difficulty,
          q.expected_answer,
          JSON.stringify([]),
          idx + 1
        );
      });
      return interviewId;
    });

    const interviewId = transaction();
    res.json({ id: interviewId, questions, welcome_message: welcomeMessage });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Get interview by ID
router.get('/interviews/:id', (req, res) => {
  const interviewId = req.params.id;
  try {
    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(interviewId);
    if (!interview) {
      res.status(404).json({ error: 'Interview not found' });
      return;
    }
    const questions = db.prepare('SELECT * FROM questions WHERE interview_id = ? ORDER BY order_idx ASC').all(interviewId);
    const answers = db.prepare(`
      SELECT a.* FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE q.interview_id = ?
    `).all(interviewId);
    const report = db.prepare('SELECT * FROM reports WHERE interview_id = ?').get(interviewId);
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
    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(interviewId) as any;
    const question = db.prepare('SELECT * FROM questions WHERE id = ? AND interview_id = ?').get(questionId, interviewId) as any;

    if (!interview || !question) {
      res.status(404).json({ error: 'Interview or question not found' });
      return;
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

    const evaluation = await evaluateAnswer(context, question.question_text, answer_text);
    
    const insertAnswer = db.prepare(`
      INSERT INTO answers (
        question_id, answer_text, score, reasoning, strengths, weaknesses, 
        confidence, ideal_answer, knowledge_gaps, learning_suggestions, time_taken_seconds
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertAnswer.run(
      questionId,
      answer_text,
      evaluation.score,
      evaluation.reasoning,
      JSON.stringify(evaluation.strengths),
      JSON.stringify(evaluation.weaknesses),
      evaluation.confidence,
      evaluation.ideal_answer,
      JSON.stringify(evaluation.knowledge_gaps),
      JSON.stringify(evaluation.learning_suggestions),
      time_taken_seconds || null
    );

    res.json({ id: result.lastInsertRowid, evaluation });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Submit answer for Face-to-Face Interview (Dynamic Question Generation & Correction retry)
router.post('/interviews/:id/questions/:qId/f2f-answer', async (req, res) => {
  const interviewId = req.params.id;
  const questionId = req.params.qId;
  const { answer_text, time_taken_seconds, force_next = false } = req.body;

  if (!answer_text && !force_next) {
    res.status(400).json({ error: 'Answer text is required' });
    return;
  }

  try {
    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(interviewId) as any;
    const question = db.prepare('SELECT * FROM questions WHERE id = ? AND interview_id = ?').get(questionId, interviewId) as any;

    if (!interview || !question) {
      res.status(404).json({ error: 'Interview or question not found' });
      return;
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

    let evaluation: any = null;
    let existingAnswer = db.prepare('SELECT * FROM answers WHERE question_id = ?').get(questionId) as any;

    if (!force_next) {
      evaluation = await evaluateF2FAnswer(context, question.question_text, answer_text, interview.company || 'Google');

      if (evaluation.is_meta_command) {
        res.json({
          is_meta_command: true,
          meta_action: evaluation.meta_action,
          meta_response: evaluation.meta_response
        });
        return;
      }

      if (existingAnswer) {
        db.prepare(`
          UPDATE answers SET 
            answer_text = ?, score = ?, reasoning = ?, strengths = ?, weaknesses = ?, 
            confidence = ?, ideal_answer = ?, knowledge_gaps = ?, learning_suggestions = ?, time_taken_seconds = ?
          WHERE question_id = ?
        `).run(
          answer_text,
          evaluation.score,
          evaluation.reasoning,
          JSON.stringify(evaluation.strengths),
          JSON.stringify(evaluation.weaknesses),
          evaluation.confidence,
          evaluation.ideal_answer,
          JSON.stringify(evaluation.knowledge_gaps),
          JSON.stringify(evaluation.learning_suggestions),
          time_taken_seconds || null,
          questionId
        );
      } else {
        db.prepare(`
          INSERT INTO answers (
            question_id, answer_text, score, reasoning, strengths, weaknesses, 
            confidence, ideal_answer, knowledge_gaps, learning_suggestions, time_taken_seconds
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          questionId,
          answer_text,
          evaluation.score,
          evaluation.reasoning,
          JSON.stringify(evaluation.strengths),
          JSON.stringify(evaluation.weaknesses),
          evaluation.confidence,
          evaluation.ideal_answer,
          JSON.stringify(evaluation.knowledge_gaps),
          JSON.stringify(evaluation.learning_suggestions),
          time_taken_seconds || null
        );
      }

      if (evaluation.needs_retry) {
        res.json({
          retry_allowed: true,
          evaluation,
          correction_explanation: evaluation.correction_explanation,
          correction_example: evaluation.correction_example
        });
        return;
      }
    }

    const questionsAndAnswers = db.prepare(`
      SELECT q.question_text, q.topic, q.difficulty, q.expected_answer,
             a.answer_text, a.score, a.reasoning
      FROM questions q
      LEFT JOIN answers a ON q.id = a.question_id
      WHERE q.interview_id = ?
      ORDER BY q.order_idx ASC
    `).all(interviewId);

    const isLastQuestion = questionsAndAnswers.length >= interview.num_questions;

    if (isLastQuestion) {
      res.json({ is_complete: true, evaluation });
      return;
    }

    const nextQuestionData = await generateF2FNextQuestion(
      context, 
      interview.company || 'Google', 
      interview.interview_plan || '', 
      questionsAndAnswers
    );

    if (nextQuestionData.is_complete) {
      res.json({ is_complete: true, evaluation });
      return;
    }

    const insertQuestion = db.prepare('INSERT INTO questions (interview_id, question_text, topic, difficulty, expected_answer, hints, order_idx) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const qResult = insertQuestion.run(
      interviewId,
      nextQuestionData.question_text,
      nextQuestionData.topic,
      nextQuestionData.difficulty,
      nextQuestionData.expected_answer,
      JSON.stringify([]),
      questionsAndAnswers.length + 1
    );

    res.json({
      is_complete: false,
      evaluation,
      next_question: {
        id: qResult.lastInsertRowid,
        question_text: nextQuestionData.question_text,
        topic: nextQuestionData.topic,
        difficulty: nextQuestionData.difficulty,
        expected_answer: nextQuestionData.expected_answer,
        order_idx: questionsAndAnswers.length + 1,
        transition_phrase: nextQuestionData.transition_phrase || ''
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
    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(interviewId) as any;
    if (!interview) {
      res.status(404).json({ error: 'Interview not found' });
      return;
    }

    // Check if report already exists
    const existingReport = db.prepare('SELECT * FROM reports WHERE interview_id = ?').get(interviewId);
    if (existingReport) {
      res.json(existingReport);
      return;
    }

    const questionsAndAnswers = db.prepare(`
      SELECT 
        q.question_text, q.topic, q.difficulty, q.expected_answer,
        a.answer_text, a.score, a.reasoning, a.strengths, a.weaknesses, a.knowledge_gaps
      FROM questions q
      LEFT JOIN answers a ON q.id = a.question_id
      WHERE q.interview_id = ?
      ORDER BY q.order_idx ASC
    `).all(interviewId);

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
    
    const insertReport = db.prepare(`
      INSERT INTO reports (
        resume_match_percentage, ats_missing_keywords, resume_vs_jd_analysis,
        interview_id, overall_score, percentage, hiring_probability, recommendation, skill_level,
        strengths, weaknesses, learning_roadmap, topics_to_improve, performance_heatmap
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      const result = insertReport.run(
        reportData.resume_match_percentage || 0,
        JSON.stringify(reportData.ats_missing_keywords || []),
        reportData.resume_vs_jd_analysis || '',
        interviewId,
        reportData.overall_score,
        reportData.percentage,
        reportData.hiring_probability,
        reportData.recommendation,
        reportData.skill_level,
        JSON.stringify(reportData.strengths),
        JSON.stringify(reportData.weaknesses),
        reportData.learning_roadmap,
        JSON.stringify(reportData.topics_to_improve),
        JSON.stringify(reportData.performance_heatmap)
      );
      
      try {
        db.prepare('UPDATE interviews SET status = ?, integrity_logs = ? WHERE id = ?').run('completed', JSON.stringify(integrityLogs || []), interviewId);
      } catch(err) {
        if (err.message.includes('has no column named integrity_logs')) {
          db.prepare('ALTER TABLE interviews ADD COLUMN integrity_logs TEXT').run();
          db.prepare('UPDATE interviews SET status = ?, integrity_logs = ? WHERE id = ?').run('completed', JSON.stringify(integrityLogs || []), interviewId);
        } else {
          throw err;
        }
      }
      
      return result.lastInsertRowid;
    });

    const reportId = transaction();
    const finalReport = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId);
    
    res.json(finalReport);
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Delete interview
router.delete('/interviews/:id', (req, res) => {
  const interviewId = req.params.id;
  try {
    db.prepare('DELETE FROM interviews WHERE id = ?').run(interviewId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ error: String(error) });
  }
});

export default router;
