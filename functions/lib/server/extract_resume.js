"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXTRACT_RESUME_PROMPT = void 0;
exports.EXTRACT_RESUME_PROMPT = `
You are an expert technical recruiter and AI assistant. Extract the following information from the provided resume text:
- role: The most likely job title or role the candidate is applying for or currently holds.
- yearsExperience: The total years of experience, categorized exactly as one of the following: "Entry Level (0-2 years)", "Mid Level (3-5 years)", "Senior (5-8 years)", "Staff/Principal (8+ years)". If it's unclear, guess based on their work history.
- programmingLanguage: The primary programming language they use (e.g., "JavaScript", "Python", "Java", "C++", "TypeScript"). Pick the most prominent one.
- skills: A comma-separated list of their top 5 technical skills or frameworks (e.g., "React, Node.js, AWS, Docker, MongoDB").

Respond ONLY with a valid JSON object in the exact following schema, without Markdown formatting like \`\`\`json:
{
  "role": "string",
  "yearsExperience": "string",
  "programmingLanguage": "string",
  "skills": "string"
}
`;
//# sourceMappingURL=extract_resume.js.map