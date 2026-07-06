# AI Interview Agent

A production-ready, highly polished AI-powered technical interview platform built for the 24 Hour AI Agent Challenge. 

## Features
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Framer Motion + Zustand + React Query + Hook Form + Zod
- **Backend**: Express (Node.js) + SQLite (Better-SQLite3) + Google Gemini SDK
- **AI Integration**: Advanced multi-step evaluation using `gemini-2.5-pro`.
- **UI**: Premium Stripe/Linear-like aesthetic, glassmorphism, responsive design, dark mode.
- **Analytics**: Recharts, Radar charts, Heatmaps, PDF Export.

## Architecture

```
/src
  /api          # React Query clients
  /components   # UI Components (Buttons, Cards, Layouts)
  /pages        # Route views
  /server       # Express backend logic (Routes, Prompts, Gemini API, DB)
  /store        # Zustand state management
  /lib          # Utils
  App.tsx
  main.tsx
  types.ts
server.ts       # Backend entrypoint
```

## Installation

```bash
npm install
```

## Configuration
Create a `.env` file in the root directory:
```
GEMINI_API_KEY="your_api_key_here"
```

## Run Development Server

The development server runs the Express backend via `tsx` which handles API routes and integrates Vite middleware to serve the React frontend on port 3000.

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm run start
```

## How AI Works
1. **Question Generation**: Uses contextual variables (Role, Difficulty, Experience, Language) to generate advanced, non-repeating technical questions with expected answers and hints.
2. **Answer Evaluation**: Parses the exact candidate response, scoring it against an ideal production-ready answer, finding technical flaws, and creating learning suggestions.
3. **Hiring Assessment**: Consumes the full interview transcript to generate a comprehensive hiring probability score, a skill heatmap, and a custom learning roadmap.

## Future Improvements
- Multi-user authentication (NextAuth/Auth0)
- Real-time voice interaction using WebRTC
- Integrated code execution environment for live coding challenges
