import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

/**
 * Helper to build a PDF in memory and return a Buffer.
 */
function buildPdfBuffer(doc: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      }
    });

    doc.pipe(stream);

    stream.on('finish', () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Generates a premium PDF Report.
 */
export async function generatePDFReportBuffer(
  interview: any,
  report: any,
  questions: any[],
  answers: any[],
  radarChartBuffer?: Buffer,
  barChartBuffer?: Buffer,
  reportUrl = 'https://rooman-eb7dd.firebaseapp.com/'
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const bufferPromise = buildPdfBuffer(doc);

  // Colors
  const darkSlate = '#0F172A';
  const indigo = '#4F46E5';
  const cyan = '#0891B2';
  const textDark = '#1E293B';
  const textMuted = '#64748B';
  const bgLight = '#F8FAFC';

  // --- PAGE 1: COVER & OVERVIEW ---
  // Header background banner
  doc.rect(0, 0, 595, 120).fill(darkSlate);
  
  // Title
  doc.fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .fontSize(22)
     .text('ROOMAN AI', 40, 35)
     .fillColor(cyan)
     .text('INTERVIEW ASSESSMENT REPORT', 40, 65);

  // Metadata Card background
  doc.rect(40, 140, 515, 110).fill(bgLight);
  doc.rect(40, 140, 515, 110).lineWidth(1).stroke('#E2E8F0');

  // Candidate Info Left
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(11).text('CANDIDATE INFORMATION', 55, 155);
  doc.font('Helvetica').fontSize(10).fillColor(textMuted);
  doc.text('Name:', 55, 175).font('Helvetica-Bold').fillColor(textDark).text(interview.candidate_name || 'Candidate', 130, 175);
  doc.font('Helvetica').fillColor(textMuted).text('Target Role:', 55, 195).font('Helvetica-Bold').fillColor(textDark).text(interview.role || 'Full Stack Engineer', 130, 195);
  doc.font('Helvetica').fillColor(textMuted).text('Experience:', 55, 215).font('Helvetica-Bold').fillColor(textDark).text(interview.years_experience || 'Mid Level', 130, 215);

  // Candidate Info Right
  doc.font('Helvetica').fontSize(10).fillColor(textMuted);
  doc.text('Interview Type:', 320, 175).font('Helvetica-Bold').fillColor(textDark).text(interview.interview_type || 'Technical', 420, 175);
  doc.font('Helvetica').fillColor(textMuted).text('Difficulty:', 320, 195).font('Helvetica-Bold').fillColor(textDark).text(interview.difficulty || 'Medium', 420, 195);
  doc.font('Helvetica').fillColor(textMuted).text('Date:', 320, 215).font('Helvetica-Bold').fillColor(textDark).text(new Date(interview.created_at?.toDate ? interview.created_at.toDate() : interview.created_at || Date.now()).toLocaleDateString(), 420, 215);

  // --- SCORE METRICS BAR ---
  const overallScore = report.overall_score || 0;
  const hiringProb = report.hiring_probability || 0;
  const resumeMatch = report.resume_match_percentage || 0;

  // Draw 3 metric boxes
  const boxWidth = 160;
  const boxHeight = 70;
  const startX = 40;
  const gap = 17;

  // Box 1: Overall Score
  doc.rect(startX, 270, boxWidth, boxHeight).fill(bgLight).stroke('#E2E8F0');
  doc.fillColor(textMuted).font('Helvetica-Bold').fontSize(9).text('OVERALL SCORE', startX + 15, 280);
  doc.fillColor(indigo).font('Helvetica-Bold').fontSize(26).text(`${overallScore}%`, startX + 15, 298);

  // Box 2: Hiring Probability
  doc.rect(startX + boxWidth + gap, 270, boxWidth, boxHeight).fill(bgLight).stroke('#E2E8F0');
  doc.fillColor(textMuted).font('Helvetica-Bold').fontSize(9).text('PASS PROBABILITY', startX + boxWidth + gap + 15, 280);
  doc.fillColor(cyan).font('Helvetica-Bold').fontSize(26).text(`${hiringProb}%`, startX + boxWidth + gap + 15, 298);

  // Box 3: Resume Match
  doc.rect(startX + (boxWidth + gap) * 2, 270, boxWidth, boxHeight).fill(bgLight).stroke('#E2E8F0');
  doc.fillColor(textMuted).font('Helvetica-Bold').fontSize(9).text('RESUME MATCH', startX + (boxWidth + gap) * 2 + 15, 280);
  doc.fillColor('#10B981').font('Helvetica-Bold').fontSize(26).text(`${resumeMatch}%`, startX + (boxWidth + gap) * 2 + 15, 298);

  // Embed Skills Radar Chart on Page 1 if present
  if (radarChartBuffer) {
    try {
      doc.image(radarChartBuffer, 40, 360, { width: 240, height: 216 });
    } catch (e) {
      console.error('Error drawing radar chart in PDF:', e);
    }
  } else {
    doc.rect(40, 360, 240, 210).lineWidth(1).dash(5, { space: 3 }).stroke('#CBD5E1');
    doc.fillColor(textMuted).font('Helvetica').fontSize(10).text('Skills Analysis Chart Not Available', 80, 460);
  }

  // Embed Topic Bar Chart on Page 1 if present
  if (barChartBuffer) {
    try {
      doc.image(barChartBuffer, 305, 360, { width: 250, height: 160 });
    } catch (e) {
      console.error('Error drawing bar chart in PDF:', e);
    }
  } else {
    doc.rect(305, 360, 250, 160).lineWidth(1).dash(5, { space: 3 }).stroke('#CBD5E1');
    doc.fillColor(textMuted).font('Helvetica').fontSize(10).text('Topic Score Chart Not Available', 345, 430);
  }

  // Embed QR Code linking to Web Report
  try {
    const qrResponse = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reportUrl)}`);
    if (qrResponse.ok) {
      const qrBuffer = Buffer.from(await qrResponse.arrayBuffer());
      doc.image(qrBuffer, 320, 520, { width: 55, height: 55 });
      doc.fillColor(textMuted).font('Helvetica').fontSize(8).text('Scan QR to view interactive report online', 390, 545);
    }
  } catch (e) {
    console.warn('Could not generate/embed QR code in PDF:', e);
  }

  // Professional footer page 1
  doc.fillColor(textMuted).font('Helvetica').fontSize(8).text('Rooman AI Interview Platform  |  support@rooman.ai', 40, 800, { align: 'center' });

  // --- PAGE 2: DETAILED ANALYSIS & FEEDBACK ---
  doc.addPage();
  
  doc.fillColor(darkSlate).font('Helvetica-Bold').fontSize(16).text('Detailed Interview Analysis');
  doc.rect(40, 60, 515, 2).fill(indigo);

  // Strengths
  doc.fillColor(indigo).font('Helvetica-Bold').fontSize(12).text('Key Strengths', 40, 75);
  let strengths = [];
  try { strengths = JSON.parse(report.strengths || '[]'); } catch (e) {}
  let sY = 95;
  strengths.forEach((str: string) => {
    doc.fillColor('#10B981').fontSize(10).text('✓ ', 45, sY);
    doc.fillColor(textDark).text(str, 60, sY, { width: 495 });
    sY += doc.heightOfString(str, { width: 495 }) + 6;
  });

  // Weaknesses
  sY += 10;
  doc.fillColor('#EF4444').font('Helvetica-Bold').fontSize(12).text('Critical Areas of Improvement', 40, sY);
  let weaknesses = [];
  try { weaknesses = JSON.parse(report.weaknesses || '[]'); } catch (e) {}
  sY += 20;
  weaknesses.forEach((wk: string) => {
    doc.fillColor('#EF4444').fontSize(10).text('✗ ', 45, sY);
    doc.fillColor(textDark).text(wk, 60, sY, { width: 495 });
    sY += doc.heightOfString(wk, { width: 495 }) + 6;
  });

  // ATS & Resume vs JD Analysis
  sY += 15;
  doc.fillColor(cyan).font('Helvetica-Bold').fontSize(12).text('Resume & JD Match Analysis', 40, sY);
  sY += 20;
  
  const atsKeywords = JSON.parse(report.ats_missing_keywords || '[]');
  const atsText = atsKeywords.length > 0 
    ? `Missing Keywords in Resume: ${atsKeywords.join(', ')}`
    : 'Excellent resume optimization. No critical job description keywords are missing.';
  
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(10).text('ATS & Keyword Match:', 40, sY);
  doc.font('Helvetica').fillColor(textDark).text(atsText, 40, sY + 15, { width: 515 });
  sY += doc.heightOfString(atsText, { width: 515 }) + 25;

  doc.font('Helvetica-Bold').text('Resume Match Summary:', 40, sY);
  const matchAnalysis = report.resume_vs_jd_analysis || 'No detailed analysis provided.';
  doc.font('Helvetica').text(matchAnalysis, 40, sY + 15, { width: 515 });

  // Professional footer page 2
  doc.fillColor(textMuted).font('Helvetica').fontSize(8).text('Rooman AI Interview Platform  |  support@rooman.ai  |  Page 2', 40, 800, { align: 'center' });

  // --- PAGE 3: ACTIONABLE GROWTH ROADMAP ---
  doc.addPage();
  doc.fillColor(darkSlate).font('Helvetica-Bold').fontSize(16).text('Custom Skill Growth Roadmap');
  doc.rect(40, 60, 515, 2).fill(cyan);

  // Growth Roadmap
  let roadmapY = 75;
  doc.fillColor(indigo).font('Helvetica-Bold').fontSize(12).text('Custom Learning Journey', 40, roadmapY);
  roadmapY += 20;
  
  const roadmapMarkdown = report.learning_roadmap || 'Create a custom schedule for topics to study.';
  // Clean markdown bold symbols and render clean paragraphs
  const cleanRoadmap = roadmapMarkdown.replace(/[*_#`\-]/g, ' ').trim();
  doc.fillColor(textDark).font('Helvetica').fontSize(10).text(cleanRoadmap, 40, roadmapY, { width: 515, align: 'justify' });

  // Topics to improve
  const topicsList = JSON.parse(report.topics_to_improve || '[]');
  if (topicsList.length > 0) {
    const lastY = doc.y + 20;
    doc.fillColor(cyan).font('Helvetica-Bold').fontSize(12).text('Key Topics to Prioritize', 40, lastY);
    let topY = lastY + 20;
    topicsList.forEach((topic: string, i: number) => {
      doc.fillColor(darkSlate).font('Helvetica-Bold').fontSize(10).text(`${i + 1}.`, 45, topY);
      doc.fillColor(textDark).font('Helvetica').text(topic, 65, topY);
      topY += 20;
    });
  }

  // Professional footer page 3
  doc.fillColor(textMuted).font('Helvetica').fontSize(8).text('Rooman AI Interview Platform  |  support@rooman.ai  |  Page 3', 40, 800, { align: 'center' });

  // End document
  doc.end();

  return bufferPromise;
}

/**
 * Generates a premium landscape Completion Certificate.
 */
export async function generateCertificateBuffer(
  interview: any,
  report: any,
  certificateId: string
): Promise<Buffer> {
  // A4 Page is 595.28 x 841.89 points. Landscape is 841.89 x 595.28 points.
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
  const bufferPromise = buildPdfBuffer(doc);

  const gold = '#D4AF37';
  const darkNavy = '#0F172A';
  const cream = '#FAF9F6';
  const textDark = '#1E293B';
  const textMuted = '#64748B';

  // --- BACKGROUND & BORDER ---
  // Fill background with light cream
  doc.rect(0, 0, 842, 596).fill(cream);

  // Outer Gold Border
  doc.rect(30, 30, 782, 536).lineWidth(3).stroke(gold);
  // Inner Border
  doc.rect(40, 40, 762, 516).lineWidth(1).stroke(darkNavy);

  // Gold Corners
  doc.lineWidth(2);
  // Top-Left corner accent
  doc.moveTo(35, 60).lineTo(35, 35).lineTo(60, 35).stroke(gold);
  // Top-Right corner accent
  doc.moveTo(807, 60).lineTo(807, 35).lineTo(782, 35).stroke(gold);
  // Bottom-Left corner accent
  doc.moveTo(35, 536).lineTo(35, 561).lineTo(60, 561).stroke(gold);
  // Bottom-Right corner accent
  doc.moveTo(807, 536).lineTo(807, 561).lineTo(782, 561).stroke(gold);

  // --- CERTIFICATE CONTENT ---
  // Platform Branding Header
  doc.fillColor(darkNavy)
     .font('Helvetica-Bold')
     .fontSize(16)
     .text('ROOMAN AI INTERVIEW ACADEMY', 40, 70, { align: 'center' });

  // Seal or Star visual
  doc.lineWidth(1).strokeColor(gold);
  doc.polygon([421, 105], [431, 125], [453, 125], [435, 138], [441, 160], [421, 146], [401, 160], [407, 138], [389, 125], [411, 125]);
  doc.fill(gold);

  // Title
  doc.fillColor(darkNavy)
     .font('Helvetica-Bold')
     .fontSize(34)
     .text('CERTIFICATE OF ACHIEVEMENT', 40, 185, { align: 'center', characterSpacing: 1.5 });

  // Recipient Subtitle
  doc.fillColor(textMuted)
     .font('Helvetica')
     .fontSize(12)
     .text('This is proudly presented to', 40, 245, { align: 'center' });

  // Recipient Name
  const candidateName = interview.candidate_name || 'Candidate Name';
  doc.fillColor(gold)
     .font('Helvetica-Bold')
     .fontSize(28)
     .text(candidateName.toUpperCase(), 40, 275, { align: 'center' });

  // Gold Line under candidate name
  doc.moveTo(220, 310).lineTo(620, 310).lineWidth(1.5).stroke(gold);

  // Certification description text
  const completionText = `for demonstrating outstanding technical competence by successfully completing the simulated industry-standard technical interview assessment for the target role of`;
  doc.fillColor(textDark)
     .font('Helvetica')
     .fontSize(11.5)
     .text(completionText, 100, 335, { align: 'center', width: 642, lineGap: 4 });

  // Role
  const roleText = `${interview.role || 'Software Engineer'} (${interview.difficulty || 'Medium'} Level)`;
  doc.fillColor(darkNavy)
     .font('Helvetica-Bold')
     .fontSize(15)
     .text(roleText, 40, 395, { align: 'center' });

  // Assessment Score details
  const scorePercent = report.overall_score || 80;
  const evaluationResult = `Overall Assessment Score: ${scorePercent}% | Grade: Excellent (Strong Hire)`;
  doc.fillColor(textDark)
     .font('Helvetica-Bold')
     .fontSize(11)
     .text(evaluationResult, 40, 428, { align: 'center' });

  // Signatures / Date / ID footer
  doc.moveTo(100, 500).lineTo(280, 500).lineWidth(0.5).stroke(textMuted);
  doc.fillColor(textMuted)
     .font('Helvetica')
     .fontSize(9)
     .text('AUTHORIZED SIGNATURE', 100, 506, { width: 180, align: 'center' })
     .font('Helvetica-Bold')
     .fillColor(darkNavy)
     .text('ROOMAN AI INTERVIEWER', 100, 485, { width: 180, align: 'center' });

  // Completion Date
  const dateStr = new Date(interview.created_at?.toDate ? interview.created_at.toDate() : interview.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.moveTo(562, 500).lineTo(742, 500).lineWidth(0.5).stroke(textMuted);
  doc.fillColor(textMuted)
     .font('Helvetica')
     .fontSize(9)
     .text('DATE OF EXCELLENCE', 562, 506, { width: 180, align: 'center' })
     .font('Helvetica-Bold')
     .fillColor(darkNavy)
     .text(dateStr, 562, 485, { width: 180, align: 'center' });

  // Certificate Unique ID
  doc.fillColor(textMuted)
     .font('Helvetica')
     .fontSize(8)
     .text(`Verification ID: ${certificateId}`, 40, 532, { align: 'center' });

  // End Document
  doc.end();

  return bufferPromise;
}
