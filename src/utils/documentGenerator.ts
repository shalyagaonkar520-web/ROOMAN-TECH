import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } from 'docx';
import { jsPDF } from 'jspdf';

export const generateDocxResume = async (resumeData: any): Promise<Blob> => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: resumeData.name,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `${resumeData.email} | ${resumeData.phone} | ${resumeData.location}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `LinkedIn: ${resumeData.links?.linkedin || ''} | GitHub: ${resumeData.links?.github || ''}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '' }),
          
          new Paragraph({
            text: 'CAREER OBJECTIVE',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: resumeData.careerObjective || '' }),
          new Paragraph({ text: '' }),

          new Paragraph({
            text: 'SKILLS',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: (resumeData.skills || []).join(', ') }),
          new Paragraph({ text: '' }),

          new Paragraph({
            text: 'EXPERIENCE',
            heading: HeadingLevel.HEADING_2,
          }),
          ...(resumeData.experience || []).flatMap((exp: any) => [
            new Paragraph({
              children: [
                new TextRun({ text: exp.company, bold: true }),
                new TextRun({ text: ` - ${exp.role}` }),
              ],
            }),
            new Paragraph({
              text: exp.duration,
              italics: true,
            }),
            new Paragraph({ text: exp.description }),
            new Paragraph({ text: '' }),
          ]),

          new Paragraph({
            text: 'PROJECTS',
            heading: HeadingLevel.HEADING_2,
          }),
          ...(resumeData.projects || []).flatMap((proj: any) => [
            new Paragraph({
              children: [
                new TextRun({ text: proj.name, bold: true }),
                new TextRun({ text: ` | ${proj.technologies?.join(', ')}` }),
              ],
            }),
            new Paragraph({ text: proj.description }),
            new Paragraph({ text: '' }),
          ]),

          new Paragraph({
            text: 'EDUCATION',
            heading: HeadingLevel.HEADING_2,
          }),
          ...(resumeData.education || []).flatMap((edu: any) => [
            new Paragraph({
              children: [
                new TextRun({ text: edu.institution, bold: true }),
                new TextRun({ text: ` - ${edu.degree}` }),
              ],
            }),
            new Paragraph({ text: edu.year }),
            new Paragraph({ text: '' }),
          ]),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
};

export const generatePdfResume = (resumeData: any): Blob => {
  const doc = new jsPDF();
  let y = 20;
  const margin = 20;

  doc.setFontSize(22);
  doc.text(resumeData.name || '', 105, y, { align: 'center' });
  y += 10;
  
  doc.setFontSize(10);
  doc.text(`${resumeData.email || ''} | ${resumeData.phone || ''} | ${resumeData.location || ''}`, 105, y, { align: 'center' });
  y += 15;

  doc.setFontSize(14);
  doc.text('CAREER OBJECTIVE', margin, y);
  y += 6;
  doc.setFontSize(10);
  const objLines = doc.splitTextToSize(resumeData.careerObjective || '', 170);
  doc.text(objLines, margin, y);
  y += objLines.length * 5 + 10;

  doc.setFontSize(14);
  doc.text('SKILLS', margin, y);
  y += 6;
  doc.setFontSize(10);
  const skillsLines = doc.splitTextToSize((resumeData.skills || []).join(', '), 170);
  doc.text(skillsLines, margin, y);
  y += skillsLines.length * 5 + 10;

  doc.setFontSize(14);
  doc.text('EXPERIENCE', margin, y);
  y += 6;
  (resumeData.experience || []).forEach((exp: any) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${exp.company} - ${exp.role}`, margin, y);
    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(exp.duration || '', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(exp.description || '', 170);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 5;
    
    if (y > 270) { doc.addPage(); y = 20; }
  });

  return doc.output('blob');
};

export const generatePdfCoverLetter = (coverLetterText: string): Blob => {
  const doc = new jsPDF();
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(coverLetterText || '', 170);
  doc.text(lines, 20, 20);
  return doc.output('blob');
};
