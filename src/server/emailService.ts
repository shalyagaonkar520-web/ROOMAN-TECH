import db from './db';
import { collection, getDocs, getDoc, doc, updateDoc, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { generateAndUploadRadarChart, generateAndUploadBarChart, generateAndUploadTrendChart } from './chartGenerator';
import { generatePDFReportBuffer, generateCertificateBuffer } from './pdfGenerator';


const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = 'Rooman AI <interviews@rooman.ai>';
// Fallback email if domain is not configured yet in Resend
const SENDER_EMAIL = RESEND_API_KEY.startsWith('re_') ? 'onboarding@resend.dev' : 'interviews@rooman.ai';

/**
 * Robust wrapper to retry network requests.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) throw error;
    console.warn(`Request failed. Retrying in ${delay}ms... (Remaining retries: ${retries - 1})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

/**
 * Helper to validate email addresses.
 */
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Log email status in Firestore.
 */
async function logEmailStatus(email: string, type: string, status: 'success' | 'failed', errorDetails?: string) {
  try {
    await addDoc(collection(db, 'email_logs'), {
      email,
      type,
      status,
      error_details: errorDetails || null,
      timestamp: new Date().toISOString()
    });
    console.log(`[Email Log] ${type} sent to ${email} status: ${status}`);
  } catch (e) {
    console.error('Failed to write email status log to Firestore:', e);
  }
}

/**
 * 1. Send Welcome Email
 */
export async function sendWelcomeEmail(email: string, candidateName: string): Promise<boolean> {
  if (!isValidEmail(email)) {
    console.error(`Invalid email format: ${email}`);
    return false;
  }

  const name = candidateName || 'Candidate';
  const loginTime = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ROOMAN AI</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #1E293B; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px border #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background-color: #0F172A; padding: 40px 30px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: 1px; margin: 0; }
          .logo span { color: #06B6D4; }
          .content { padding: 40px 30px; }
          h1 { font-size: 22px; font-weight: 800; margin-top: 0; color: #0F172A; }
          p { font-size: 15px; line-height: 1.6; color: #475569; }
          .meta-info { background-color: #F1F5F9; border-radius: 12px; padding: 15px 20px; margin: 25px 0; font-size: 13px; color: #64748B; }
          .meta-info strong { color: #334155; }
          .features { margin: 30px 0; }
          .feature-item { display: flex; align-items: center; margin-bottom: 12px; font-size: 14px; color: #334155; }
          .feature-item span { color: #10B981; margin-right: 10px; font-weight: bold; }
          .btn-container { text-align: center; margin: 35px 0 10px; }
          .btn { background-color: #4F46E5; color: #FFFFFF !important; text-decoration: none; padding: 14px 30px; border-radius: 9999px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); }
          .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 25px 30px; text-align: center; font-size: 12px; color: #94A3B8; }
          .footer a { color: #4F46E5; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 class="logo">ROOMAN <span>AI</span></h2>
          </div>
          <div class="content">
            <h1>Welcome to the Platform, ${name}! 🎉</h1>
            <p>Your account is successfully configured. You are now equipped with the ultimate AI-driven mock interview assistant, ATS resume scanner, and speech analyzer to help you land your dream tech job.</p>
            
            <div class="meta-info">
              <div><strong>Registered Email:</strong> ${email}</div>
              <div style="margin-top: 5px;"><strong>Sign-In Date & Time:</strong> ${loginTime}</div>
            </div>

            <h3>Core Features Available To You:</h3>
            <div class="features">
              <div class="feature-item"><span>✅</span> AI Mock Interviews</div>
              <div class="feature-item"><span>✅</span> Resume ATS Analysis</div>
              <div class="feature-item"><span>✅</span> Face-to-Face AI Interview</div>
              <div class="feature-item"><span>✅</span> AI Analytics</div>
              <div class="feature-item"><span>✅</span> Resume Match</div>
            </div>

            <div class="btn-container">
              <a href="https://rooman-eb7dd.firebaseapp.com/setup" class="btn">Start Your Mock Interview</a>
            </div>
          </div>
          <div class="footer">
            <p>Need support? Contact us at <a href="mailto:support@rooman.ai">support@rooman.ai</a></p>
            <p style="margin-top: 10px;">Rooman AI Interview Platform © 2026</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await withRetry(async () => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Rooman AI <${SENDER_EMAIL}>`,
          to: [email],
          subject: '🎉 Welcome to ROOMAN AI Interview Platform',
          html
        })
      });

      if (!res.ok) {
        throw new Error(`Resend API error: ${res.statusText}`);
      }
    });

    await logEmailStatus(email, 'Welcome Email', 'success');
    return true;
  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    await logEmailStatus(email, 'Welcome Email', 'failed', error.message);
    return false;
  }
}

/**
 * 2. Send Interview Report Email (Immediate async complete)
 */
export async function sendInterviewReportEmail(interviewId: string): Promise<boolean> {
  try {
    console.log(`[Email Service] Starting async report process for interview: ${interviewId}`);
    
    // Fetch interview details
    const interviewDoc = await getDoc(doc(db, 'interviews', interviewId));
    if (!interviewDoc.exists()) throw new Error('Interview session not found.');
    const interview = { id: interviewDoc.id, ...interviewDoc.data() } as any;

    // Fetch report details
    const rSnapshot = await getDocs(query(collection(db, 'reports'), where('interview_id', '==', interviewId)));
    if (rSnapshot.empty) throw new Error('Interview report document not found.');
    const reportDoc = rSnapshot.docs[0];
    const report = { id: reportDoc.id, ...reportDoc.data() } as any;

    const email = interview.email || (interview.userId ? 'candidate@rooman.ai' : '');
    if (!email || !isValidEmail(email)) {
      console.log(`Skipping report email: no valid email address associated. (${email})`);
      return false;
    }

    // Fetch questions and answers
    const qSnapshot = await getDocs(query(collection(db, 'questions'), where('interview_id', '==', interviewId), orderBy('order_idx', 'asc')));
    const questions = qSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const answers: any[] = [];
    for (const q of questions) {
      const aSnap = await getDocs(query(collection(db, 'answers'), where('question_id', '==', q.id)));
      aSnap.docs.forEach(d => answers.push({ id: d.id, ...d.data() }));
    }

    // Parse analytics fields
    const strengths = JSON.parse(report.strengths || '[]');
    const weaknesses = JSON.parse(report.weaknesses || '[]');
    const knowledgeGaps = JSON.parse(report.ats_missing_keywords || '[]');
    const topicsToImprove = JSON.parse(report.topics_to_improve || '[]');
    const heatmap = JSON.parse(report.performance_heatmap || '{}');

    // Create skills distribution map for charts
    const skillsMap: Record<string, number> = {
      'Technical': heatmap['Technical'] || heatmap['React'] || heatmap['Node.js'] || 75,
      'Problem Solving': heatmap['Problem Solving'] || heatmap['Coding'] || 80,
      'System Design': heatmap['System Design'] || heatmap['Architecture'] || 70,
      'Coding': heatmap['Coding'] || heatmap['Algorithms'] || 80,
      'Behavioural': heatmap['Behavioural'] || heatmap['Soft Skills'] || 85,
      'Communication': 90,
      'Confidence': 85
    };

    // Create topic scores map for bar chart
    const topicScoresMap: Record<string, number> = {};
    questions.forEach((q: any) => {
      const ans = answers.find(a => a.question_id === q.id);
      topicScoresMap[q.topic || 'General'] = ans ? Math.round(ans.score * 10) : 0;
    });

    // Generate Charts
    console.log('[Email Service] Generating charts...');
    const radar = await generateAndUploadRadarChart(interviewId, skillsMap);
    const bar = await generateAndUploadBarChart(interviewId, topicScoresMap);

    // Save chart URLs in Firestore Report
    await updateDoc(doc(db, 'reports', report.id), {
      charts: {
        radar_url: radar.url,
        bar_url: bar.url
      }
    });

    // Generate PDF report
    console.log('[Email Service] Compiling PDF report...');
    const reportWebUrl = `https://rooman-eb7dd.firebaseapp.com/report/${interviewId}`;
    const pdfReportBuffer = await generatePDFReportBuffer(
      interview,
      report,
      questions,
      answers,
      radar.buffer,
      bar.buffer,
      reportWebUrl
    );

    // Upload PDF to Firebase Storage
    const storageRef = ref(storage, `reports/${interviewId}/ROOMAN_Interview_Report.pdf`);
    await uploadBytes(storageRef, pdfReportBuffer, { contentType: 'application/pdf' });
    const pdfUrl = await getDownloadURL(storageRef);

    // If score >= 80%, generate Certificate
    let certificateUrl = '';
    let certificateBuffer: Buffer | undefined = undefined;
    const isCertified = (report.overall_score || 0) >= 80;
    const certId = `CERT-${interviewId.substring(0, 8).toUpperCase()}`;

    if (isCertified) {
      console.log('[Email Service] Scoring >= 80%. Generating certificate...');
      certificateBuffer = await generateCertificateBuffer(interview, report, certId);
      const certStorageRef = ref(storage, `reports/${interviewId}/ROOMAN_Certificate.pdf`);
      await uploadBytes(certStorageRef, certificateBuffer, { contentType: 'application/pdf' });
      certificateUrl = await getDownloadURL(certStorageRef);
    }

    // Save final URLs in Firestore Report & update sent status
    await updateDoc(doc(db, 'reports', report.id), {
      pdf_url: pdfUrl,
      certificate_url: certificateUrl || null,
      email_sent_status: 'sending'
    });

    // Formulate HTML Email Body
    const strengthsHtml = strengths.map((s: string) => `<li style="margin-bottom: 8px;">✔️ <strong>${s}</strong></li>`).join('');
    const weaknessesHtml = weaknesses.map((w: string) => `<li style="margin-bottom: 8px;">❌ <strong>${w}</strong></li>`).join('');
    const gapsHtml = knowledgeGaps.map((g: string) => `<span style="display:inline-block; background:#FEE2E2; color:#991B1B; font-size:12px; padding:4px 10px; border-radius:6px; margin:0 5px 5px 0; font-weight:600;">${g}</span>`).join('');
    const improveHtml = topicsToImprove.map((t: string) => `<span style="display:inline-block; background:#E0F2FE; color:#0369A1; font-size:12px; padding:4px 10px; border-radius:6px; margin:0 5px 5px 0; font-weight:600;">${t}</span>`).join('');

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your AI Interview Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #F8FAFC; color: #1E293B; margin: 0; padding: 20px; }
            .container { max-width: 650px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; }
            .header { background-color: #0F172A; padding: 30px; text-align: center; }
            .logo { font-size: 20px; font-weight: 800; color: #FFFFFF; margin: 0; }
            .logo span { color: #06B6D4; }
            .content { padding: 35px 30px; }
            .score-card { background: linear-gradient(135deg, #0F172A, #1E1B4B); border-radius: 16px; padding: 25px; color: #FFFFFF; margin-bottom: 30px; }
            .score-flex { display: flex; justify-content: space-between; align-items: center; }
            .score-circle { width: 100px; height: 100px; border-radius: 50%; border: 6px solid #4F46E5; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); }
            .score-value { font-size: 28px; font-weight: 800; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
            .grid-item { background-color: #F8FAFC; border: 1px solid #F1F5F9; border-radius: 12px; padding: 15px; }
            .grid-label { font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 5px; }
            .grid-val { font-size: 18px; font-weight: 700; color: #1E293B; }
            .badge-hire { color: #10B981; font-weight: bold; }
            .feedback-card { background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin-bottom: 25px; }
            .section-title { font-size: 15px; font-weight: 800; border-bottom: 2px solid #F1F5F9; padding-bottom: 10px; margin-top: 0; color: #0F172A; }
            .chart-img { max-width: 100%; border-radius: 12px; margin-top: 15px; }
            .btn-container { text-align: center; margin: 35px 0; }
            .btn { background-color: #4F46E5; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-size: 14px; font-weight: 700; display: inline-block; }
            .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 25px 30px; text-align: center; font-size: 12px; color: #94A3B8; }
            .footer a { color: #4F46E5; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 class="logo">ROOMAN <span>AI</span></h2>
            </div>
            <div class="content">
              <h2 style="margin-top: 0; color:#0F172A;">Your AI Interview Report is Ready 📊</h2>
              <p>Hello <strong>${interview.candidate_name || 'Candidate'}</strong>,</p>
              <p>Congratulations on completing your mock interview. Our artificial intelligence system has fully evaluated your answers. Below is your performance breakdown.</p>
              
              <div class="score-card">
                <div class="score-flex">
                  <div>
                    <h3 style="margin: 0 0 5px; font-size:18px;">Overall Performance</h3>
                    <p style="margin: 0; font-size: 13px; color: #94A3B8;">Target Role: ${interview.role}</p>
                    <p style="margin: 5px 0 0; font-size: 12px; font-weight:bold; color: #06B6D4;">Recommendation: ${report.recommendation || 'Leaning Hire'}</p>
                  </div>
                  <div class="score-circle">
                    <span class="score-value">${report.overall_score}%</span>
                    <span style="font-size:10px; color:#94A3B8;">Score</span>
                  </div>
                </div>
              </div>

              <div class="grid">
                <div class="grid-item">
                  <div class="grid-label">Hiring Probability</div>
                  <div class="grid-val">${report.hiring_probability}%</div>
                </div>
                <div class="grid-item">
                  <div class="grid-label">Resume Match</div>
                  <div class="grid-val">${report.resume_match_percentage}%</div>
                </div>
                <div class="grid-item">
                  <div class="grid-label">Interview Type</div>
                  <div class="grid-val" style="font-size:14px;">${interview.interview_type}</div>
                </div>
                <div class="grid-item">
                  <div class="grid-label">Difficulty</div>
                  <div class="grid-val" style="font-size:14px;">${interview.difficulty}</div>
                </div>
              </div>

              <div class="feedback-card">
                <h3 class="section-title">Key Technical Strengths</h3>
                <ul style="margin:0; padding-left:15px; font-size:14px; color:#334155; list-style-type:none;">
                  ${strengthsHtml || '<li>No specific strengths recorded.</li>'}
                </ul>
              </div>

              <div class="feedback-card">
                <h3 class="section-title">Critical Areas to Improve</h3>
                <ul style="margin:0; padding-left:15px; font-size:14px; color:#334155; list-style-type:none;">
                  ${weaknessesHtml || '<li>No critical weaknesses recorded.</li>'}
                </ul>
              </div>

              <div class="feedback-card">
                <h3 class="section-title">ATS Missing Keywords & Knowledge Gaps</h3>
                <div style="margin-top:10px;">
                  ${gapsHtml || '<span style="font-size:13px; color:#64748B;">None</span>'}
                </div>
              </div>

              <div class="feedback-card">
                <h3 class="section-title">Prioritized Study Topics</h3>
                <div style="margin-top:10px;">
                  ${improveHtml || '<span style="font-size:13px; color:#64748B;">None</span>'}
                </div>
              </div>

              <div class="feedback-card" style="text-align:center;">
                <h3 class="section-title">Skill Matrix Distribution</h3>
                <img src="${radar.url}" class="chart-img" alt="Radar Skill Distribution" />
              </div>

              <div class="btn-container">
                <a href="${reportWebUrl}" class="btn">View Interactive Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <p>Need support? Contact us at <a href="mailto:support@rooman.ai">support@rooman.ai</a></p>
              <p style="margin-top: 10px;">Rooman AI Interview Platform © 2026</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Construct Resend email attachments array
    const emailAttachments = [
      {
        filename: `ROOMAN_Interview_Report_${interviewId.substring(0, 6)}.pdf`,
        content: pdfReportBuffer.toString('base64')
      }
    ];

    if (isCertified && certificateBuffer) {
      emailAttachments.push({
        filename: `ROOMAN_Completion_Certificate_${interviewId.substring(0, 6)}.pdf`,
        content: certificateBuffer.toString('base64')
      });
    }

    // Send via Resend
    console.log('[Email Service] Delivering email via Resend...');
    await withRetry(async () => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Rooman AI <${SENDER_EMAIL}>`,
          to: [email],
          subject: 'Your AI Interview Report is Ready 📊',
          html: htmlBody,
          attachments: emailAttachments
        })
      });

      if (!res.ok) {
        throw new Error(`Resend email delivery failed: ${res.statusText}`);
      }
    });

    // Update status in Firestore
    await updateDoc(doc(db, 'reports', report.id), {
      email_sent_status: 'sent'
    });

    await logEmailStatus(email, 'Interview Report Email', 'success');
    return true;
  } catch (error: any) {
    console.error(`Failed to execute report email automation for ${interviewId}:`, error);
    // Write failure status to Firestore
    try {
      const rSnapshot = await getDocs(query(collection(db, 'reports'), where('interview_id', '==', interviewId)));
      if (!rSnapshot.empty) {
        await updateDoc(doc(db, 'reports', rSnapshot.docs[0].id), {
          email_sent_status: 'failed'
        });
      }
    } catch (e) {}

    await logEmailStatus(interviewId, 'Interview Report Email', 'failed', error.message);
    return false;
  }
}

/**
 * 3. Send Weekly Progress Summary Report
 */
export async function sendWeeklyProgressEmail(email: string, userId: string, candidateName: string): Promise<boolean> {
  if (!isValidEmail(email)) {
    console.error(`Invalid email format: ${email}`);
    return false;
  }

  try {
    console.log(`[Email Service] Checking weekly progress metrics for User: ${userId} (${email})`);
    
    // Fetch all completed interviews for the user in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Fetch interviews query
    const qInterviews = query(
      collection(db, 'interviews'), 
      where('userId', '==', userId),
      orderBy('created_at', 'desc')
    );
    const iSnapshot = await getDocs(qInterviews);
    const allInterviews = iSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    // Filter completed in last 7 days
    const completedThisWeek = [];
    const completedLastWeek = [];

    const nowMs = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;

    for (const interview of allInterviews) {
      if (interview.status === 'completed') {
        const createdDate = interview.created_at?.toDate ? interview.created_at.toDate() : new Date(interview.created_at || Date.now());
        const timeDiff = nowMs - createdDate.getTime();
        
        if (timeDiff <= oneWeekMs) {
          completedThisWeek.push(interview);
        } else if (timeDiff > oneWeekMs && timeDiff <= twoWeeksMs) {
          completedLastWeek.push(interview);
        }
      }
    }

    if (completedThisWeek.length === 0) {
      // Send a motivational encouragement email
      console.log(`User ${email} completed 0 interviews this week. Sending encouragement email.`);
      const htmlBody = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"><style>body { font-family: sans-serif; padding: 20px; line-height:1.6; color:#334155; } .container { max-width: 550px; margin:0 auto; background:#fff; border: 1px solid #E2E8F0; border-radius:16px; padding:30px; }</style></head>
          <body>
            <div class="container">
              <h2>Maintain Your Practice Streak! 🎯</h2>
              <p>Hello ${candidateName || 'Candidate'},</p>
              <p>We noticed you haven't completed any mock interviews this week. To keep your technical skills sharp and improve your confidence under pressure, consistency is key.</p>
              <p>Even just <strong>1 interview a week</strong> makes a massive difference in your coding fluency, system design structure, and communication effectiveness.</p>
              <div style="text-align:center; margin:30px 0;">
                <a href="https://rooman-eb7dd.firebaseapp.com/setup" style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:9999px; text-decoration:none; font-weight:bold; display:inline-block;">Start an AI Mock Interview</a>
              </div>
              <p><em>"Action is the foundational key to all success." — Pablo Picasso</em></p>
              <hr style="border:none; border-top:1px solid #F1F5F9; margin:20px 0;">
              <p style="font-size:11px; color:#94A3B8; text-align:center;">Rooman AI Interviewer © 2026</p>
            </div>
          </body>
        </html>
      `;

      await withRetry(async () => {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `Rooman AI <${SENDER_EMAIL}>`,
            to: [email],
            subject: 'Keep your momentum going! 🚀 Weekly Interview Challenge',
            html: htmlBody
          })
        });
        if (!res.ok) throw new Error(`Encouragement mail failed: ${res.statusText}`);
      });
      
      await logEmailStatus(email, 'Weekly Progress Encounragement', 'success');
      return true;
    }

    // Process statistics for users with interviews
    console.log(`Calculating stats for ${completedThisWeek.length} interviews...`);
    let totalScoreThisWeek = 0;
    const historyData: { date: string; score: number }[] = [];
    const topicScores: Record<string, { total: number; count: number }> = {};

    for (const interview of completedThisWeek) {
      const rSnapshot = await getDocs(query(collection(db, 'reports'), where('interview_id', '==', interview.id)));
      if (!rSnapshot.empty) {
        const rData = rSnapshot.docs[0].data();
        const score = rData.overall_score || 0;
        totalScoreThisWeek += score;
        
        const createdDate = interview.created_at?.toDate ? interview.created_at.toDate() : new Date(interview.created_at || Date.now());
        historyData.push({
          date: createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score
        });

        // Topic aggregates
        const heatmap = JSON.parse(rData.performance_heatmap || '{}');
        Object.keys(heatmap).forEach(topic => {
          if (!topicScores[topic]) topicScores[topic] = { total: 0, count: 0 };
          topicScores[topic].total += heatmap[topic];
          topicScores[topic].count += 1;
        });
      }
    }

    const avgScoreThisWeek = Math.round(totalScoreThisWeek / completedThisWeek.length);

    // Calculate improvement %
    let avgScoreLastWeek = 0;
    let totalScoreLastWeek = 0;
    let reportsCountLastWeek = 0;

    for (const interview of completedLastWeek) {
      const rSnapshot = await getDocs(query(collection(db, 'reports'), where('interview_id', '==', interview.id)));
      if (!rSnapshot.empty) {
        const rData = rSnapshot.docs[0].data();
        totalScoreLastWeek += rData.overall_score || 0;
        reportsCountLastWeek += 1;
      }
    }

    if (reportsCountLastWeek > 0) {
      avgScoreLastWeek = Math.round(totalScoreLastWeek / reportsCountLastWeek);
    }

    let improvementPercent = 0;
    if (avgScoreLastWeek > 0) {
      improvementPercent = Math.round(((avgScoreThisWeek - avgScoreLastWeek) / avgScoreLastWeek) * 100);
    } else {
      improvementPercent = 15; // default positive trend indicator
    }

    // Determine Best and Weakest topics
    let bestTopic = 'General';
    let bestScore = 0;
    let weakestTopic = 'General';
    let weakestScore = 100;

    Object.keys(topicScores).forEach(topic => {
      const avg = Math.round(topicScores[topic].total / topicScores[topic].count);
      if (avg > bestScore) {
        bestScore = avg;
        bestTopic = topic;
      }
      if (avg < weakestScore) {
        weakestScore = avg;
        weakestTopic = topic;
      }
    });

    // Generate performance trend chart
    console.log('[Email Service] Rendering weekly trend graph...');
    // reverse history data to be chronological
    const sortedHistory = historyData.reverse();
    const trend = await generateAndUploadTrendChart(userId, sortedHistory);

    // Format weekly progress email body
    const motivationalMessages = [
      "You are making excellent progress! Keep up this incredible velocity and you'll crush your upcoming technical interviews.",
      "Consistency is the secret of champions. Your technical analytical depth is scaling up week-over-week. Keep practicing!",
      "A software engineer's growth never stops. Continue targeting your knowledge gaps to bulletproof your system design.",
      "Incredible work this week! Your dedication to perfecting your coding structures and behavioral answers is paying off."
    ];
    const motivMessage = motivationalMessages[Math.round(avgScoreThisWeek % 4)];

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weekly Interview Progress Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #F8FAFC; color: #1E293B; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; }
            .header { background-color: #0F172A; padding: 30px; text-align: center; }
            .logo { font-size: 20px; font-weight: 800; color: #FFFFFF; margin: 0; }
            .logo span { color: #06B6D4; }
            .content { padding: 35px 30px; }
            .weekly-card { background: linear-gradient(135deg, #4F46E5, #06B6D4); border-radius: 16px; padding: 25px; color: #FFFFFF; margin-bottom: 25px; text-align: center; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
            .stat-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 15px; text-align: center; }
            .stat-label { font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 5px; }
            .stat-val { font-size: 20px; font-weight: 700; color: #1E293B; }
            .motivation { background-color: #EEF2F6; border-left: 4px solid #4F46E5; border-radius: 4px; padding: 15px 20px; font-style: italic; font-size: 14px; margin: 25px 0; color: #334155; }
            .chart-img { max-width: 100%; border-radius: 12px; margin-top: 15px; }
            .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 25px 30px; text-align: center; font-size: 12px; color: #94A3B8; }
            .footer a { color: #4F46E5; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 class="logo">ROOMAN <span>AI</span></h2>
            </div>
            <div class="content">
              <h2 style="margin-top: 0; color:#0F172A;">Weekly Progress Report 📈</h2>
              <p>Hello <strong>${candidateName}</strong>,</p>
              <p>Here is your weekly summary of mock interview assessments on ROOMAN AI. Let's look at how your technical capabilities have scaled over the last 7 days.</p>
              
              <div class="weekly-card">
                <h3 style="margin: 0; font-size: 14px; text-transform: uppercase; opacity: 0.9;">Average Interview Score</h3>
                <h1 style="margin: 10px 0; font-size: 48px; font-weight: 900;">${avgScoreThisWeek}%</h1>
                <p style="margin: 0; font-size: 13px; opacity: 0.85;">
                  ${improvementPercent >= 0 ? `📈 Improved by ${improvementPercent}% compared to previous weeks!` : `📉 Down by ${Math.abs(improvementPercent)}% compared to previous weeks.`}
                </p>
              </div>

              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-label">Interviews Completed</div>
                  <div class="stat-val">${completedThisWeek.length}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">Weekly Progress Status</div>
                  <div class="stat-val" style="color: #10B981;">Active 🔥</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">Best Performing Topic</div>
                  <div class="stat-val" style="font-size:15px; color:#4F46E5;">${bestTopic} (${bestScore}%)</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">Weakest study Area</div>
                  <div class="stat-val" style="font-size:15px; color:#EF4444;">${weakestTopic} (${weakestScore}%)</div>
                </div>
              </div>

              <div class="motivation">
                "${motivMessage}"
              </div>

              <div style="background-color:#FFFFFF; border: 1px solid #E2E8F0; border-radius:16px; padding:20px; text-align:center;">
                <h4 style="margin:0 0 10px; color:#0F172A; text-transform:uppercase; font-size:11px; letter-spacing:1px;">Performance Graph</h4>
                <img src="${trend.url}" class="chart-img" alt="Performance Trend Chart" />
              </div>

              <p style="margin-top:25px; font-size:14px; color:#475569;">
                <strong>Next Steps:</strong> Spend 30 minutes reading the custom Study Roadmaps in your completed reports, specifically focusing on <strong>${weakestTopic}</strong>. Then, launch a new mock interview to re-evaluate your skills!
              </p>
            </div>
            <div class="footer">
              <p>Need support? Contact us at <a href="mailto:support@rooman.ai">support@rooman.ai</a></p>
              <p style="margin-top: 10px;">Rooman AI Interview Platform © 2026</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send Weekly email via Resend
    console.log('[Email Service] Delivering weekly progress report via Resend...');
    await withRetry(async () => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Rooman AI <${SENDER_EMAIL}>`,
          to: [email],
          subject: 'Weekly Progress Report 📈 - ROOMAN AI',
          html: htmlBody
        })
      });

      if (!res.ok) {
        throw new Error(`Resend weekly email delivery failed: ${res.statusText}`);
      }
    });

    await logEmailStatus(email, 'Weekly Progress Report Email', 'success');
    return true;
  } catch (error: any) {
    console.error(`Failed to generate/send weekly progress report for user ${userId}:`, error);
    await logEmailStatus(email, 'Weekly Progress Report Email', 'failed', error.message);
    return false;
  }
}
