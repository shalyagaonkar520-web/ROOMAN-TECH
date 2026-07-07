# 📋 Manual Testing Guide

The following features can be tested directly from the live application.

---

## 🤖 Career Assistant

### Input

- Upload Resume (PDF/DOCX)
- (Optional) Select Target Job Role
- (Optional) Upload Job Description

### Expected Workflow

1. Upload Resume.
2. AI extracts resume information.
3. AI generates:
   - ATS Score
   - Resume Match
   - Hiring Probability
   - Missing Keywords
   - Resume Improvement Suggestions
4. AI suggests keywords to improve ATS compatibility.
5. AI generates a downloadable Cover Letter based on the selected role.
6. User can download the generated Cover Letter.

---

## 📄 Resume Enhancer

### Input

- Resume
- Job Role
- Optional Job Description

### Expected Workflow

1. Upload Resume.
2. Select Target Role.
3. AI analyzes the resume.
4. AI suggests ATS improvements.
---

## 📊 ATS Resume Analysis

### Input

- Resume
- Job Description (Optional)

### Expected Workflow

AI displays:

- ATS Score
- Resume Match %
- Hiring Probability
- Missing Keywords
- Missing Skills
- Resume Suggestions

---

## 🎥 Face-to-Face AI Interview

### Manual Test

Input:

- Resume (Optional)
- Job Description (Optional)

### Expected Workflow

1. Allow Camera Permission.
2. Allow Microphone Permission.
3. AI reads the uploaded Resume.
4. AI reads the uploaded Job Description.
5. AI generates personalized interview questions.
6. AI asks questions based on:
   - Resume
   - Job Description
   - Selected Job Role
7. User answers using voice.
8. AI asks intelligent follow-up questions.
9. AI evaluates each response.

---

## 🎤 AI Mock Interview

### Expected Workflow

- Role-specific interview
- Technical questions
- Behavioural questions
- Mixed interview
- AI evaluation
- Performance summary

---


---

## 🔐 Authentication

Verify:

- Google Login
- Secure Authentication
