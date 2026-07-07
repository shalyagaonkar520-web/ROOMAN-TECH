# Testing Suite

This repository uses [Vitest](https://vitest.dev/) along with React Testing Library to ensure production-quality reliability.

## 🚀 How to Run Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (for active development)
npm run test:run
```

## 📂 Test Structure
- `smoke.test.ts`: Ensures the application renders without crashing.
- `authentication.test.ts`: Verifies Firebase auth flows and session states.
- `resume-upload.test.ts`: Tests the drag-and-drop resume uploading logic.
- `api-*.test.ts`: Tests the Express API routes using `supertest`.
- `integration.test.ts`: End-to-end user workflow simulations.

## 🛠️ Mocking Strategy
To ensure fast and reliable execution without incurring API costs:
- **Firebase/Firestore**: Mocked completely in `tests/setup.ts`.
- **Gemini AI**: Functions in `gemini.ts` are mocked to return structured JSON.
- **Web Speech API**: Browser TTS/STT are mocked to prevent errors in JSDOM.

## 📊 Expected Output & Coverage
All 13 test files should pass natively (`PASS`). 
To view coverage, install `@vitest/coverage-v8` and run `npx vitest run --coverage`.
