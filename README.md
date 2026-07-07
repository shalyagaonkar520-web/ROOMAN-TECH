# Rooman AI Interview Agent

An end-to-end AI agent built for the **24-Hour AI Agent Challenge** by Rooman Technologies Pvt. Ltd.

**Track Selected**: Interview Agent (Intermediate)
**Score Goal**: 100/100

## 🎯 The Agent's Job

> "My agent takes a user's target role, experience, and uploaded resume, and produces a dynamic, fully interactive mock interview complete with real-time AI voice synthesis, followed by a comprehensive, scored evaluation report outlining their strengths and gaps."

---

## 🚀 Setup & Execution (How to Run)

### 1. Prerequisites
- Node.js (v18+)
- A Google Gemini API Key

### 2. Installation
```bash
# Install dependencies
npm install

# Create environment file
touch .env
```

### 3. Configuration
Add your Gemini API key to the `.env` file at the root of the project:
```env
GEMINI_API_KEY="your_google_gemini_api_key_here"
```

### 4. Run the Agent
```bash
npm run dev
```
Navigate to `http://localhost:3000` in your browser. The app runs a Vite React frontend and an Express backend simultaneously.

---

## 📦 Agent-Specific Deliverables
As required by the **Interview Agent (Intermediate)** track, the deliverables are included in this repository:

1. **A transcript of one full mock interview**
2. **Scores for each question**
3. **Final evaluation summary**

👉 **View the Deliverable**: [SAMPLE_INTERVIEW.md](./SAMPLE_INTERVIEW.md)

---

## 🛠️ Architecture & Workflow

The agent follows a strict **Input → Think → Act → Output** cycle:
1. **Input**: User provides role, difficulty, and resume.
2. **Think (Generate)**: Backend uses `gemini-2.5-pro` to dynamically generate 5 highly specific technical questions based on the exact resume payload.
3. **Act (Interview)**: The frontend conducts the interview using either text (Manual Mode) or voice/webcam (Face-to-Face Mode) using native Web Speech APIs.
4. **Think (Evaluate)**: The backend evaluates the candidate's answer against the generated "ideal answer", assigning a score out of 100.
5. **Output**: The system synthesizes the entire transcript and returns a structured JSON evaluation, plotting the candidate's skills on a React Recharts heatmap and generating a "Hire Probability".

---

## 🤔 Design Choices & Tradeoffs

### 1. Model Choice: Google Gemini 2.5 Pro
**Why**: I chose `gemini-2.5-pro` because of its massive context window (ideal for parsing long resumes and past interview transcripts) and its exceptional speed in returning structured JSON. 
**Tradeoff**: While GPT-4o is slightly better at deep reasoning, Gemini's speed-to-cost ratio and native structured JSON output made it the perfect fit for a real-time interview loop where latency matters.

### 2. Voice & Audio: Web Speech API vs. External TTS
**Why**: Instead of using ElevenLabs or OpenAI TTS which cost money and introduce latency, I used the native browser `window.speechSynthesis` and `webkitSpeechRecognition`.
**Tradeoff**: The voice sounds slightly robotic and relies on browser support (best on Chrome), but it enables completely free, instantaneous, offline-capable voice interactions.

### 3. Tech Stack: React + Express (Monorepo)
**Why**: A unified TypeScript stack allows sharing types between the frontend and backend.
**Tradeoff**: Using a meta-framework like Next.js could have simplified routing, but a decoupled Express backend demonstrates clearer "glue code" around the AI model and allows for cleaner integration of SQLite for the database requirement.

---

## ✨ Features
- **Smart Parsing**: Contextual questions based on your uploaded resume.
- **Strict JSON Parsing**: Robust Zod schemas guarantee the AI never breaks the UI.
- **Cinematic UI**: Built with Framer Motion and Tailwind CSS for a premium, high-stakes interview feel.
- **Real-Time Proctoring**: (Bonus feature) Client-side TensorFlow.js analyzes the webcam feed to detect phones and ensure eye contact during the Face-to-Face interview.
