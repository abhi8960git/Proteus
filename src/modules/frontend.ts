import { generateJSON, generate } from "../llm/openai";
import { createZip } from "../utils/zipper";
import { logger } from "../utils/logger";
import { DESIGN_SYSTEM, REVIEW_CHECKLIST } from "../templates/design-system";
import type { SeedstrJob } from "../seedstr/types";
import type { ProjectFile, GeneratedProject } from "../utils/zipper";

interface FrontendResult {
  text: string;
  zipBuffer: Buffer;
  projectName: string;
}

export async function handleFrontendJob(job: SeedstrJob): Promise<FrontendResult> {
  logger.agent(`[FRONTEND] Starting 2-pass generation for: "${job.title}"`);

  // ─── Pass 1: Generate ───────────────────────────────────────────────────────

  logger.info("[FRONTEND] Pass 1 — Generating project...");

  const systemPrompt = `You are an expert frontend developer and UI/UX designer.
Your task is to generate a COMPLETE, production-ready website project from scratch.

${DESIGN_SYSTEM}

IMPORTANT OUTPUT FORMAT:
Return a JSON object with exactly this shape:
{
  "projectName": "kebab-case-project-name",
  "files": [
    { "path": "index.html", "content": "...full HTML..." },
    { "path": "css/styles.css", "content": "...full CSS..." },
    { "path": "js/app.js", "content": "...full JS..." },
    { "path": "README.md", "content": "...markdown..." }
  ]
}

Rules:
- Every file must have COMPLETE content — no placeholders, no "add your code here"
- index.html must be a fully functional, beautiful page
- js/app.js must implement: dark mode toggle, mobile nav, scroll animations
- Use Tailwind CDN (not build process) so it works by opening index.html directly
- Use placehold.co for any image placeholders
- The site must look PROFESSIONAL and POLISHED
`;

  const userPrompt = `Build a complete website for this requirement:

Title: ${job.title}
Description: ${job.description}
Budget: $${job.budget}
${job.requiredSkills?.length ? `Required Skills: ${job.requiredSkills.join(", ")}` : ""}

Make it look stunning. Use the design system rules. Include all interactive features mentioned.`;

  const generated = await generateJSON<GeneratedProject>(systemPrompt, userPrompt, {
    maxTokens: 8192,
    temperature: 0.3,
  });

  logger.success(`[FRONTEND] Pass 1 complete. Generated ${generated.files?.length ?? 0} files.`);

  // ─── Pass 2: Self-Review & Fix ──────────────────────────────────────────────

  logger.info("[FRONTEND] Pass 2 — Self-reviewing and fixing...");

  const reviewPrompt = `You previously generated this website project:

${JSON.stringify(generated, null, 2)}

Original requirement: "${job.description}"

${REVIEW_CHECKLIST}

Review ALL files against the checklist above. Fix any issues found.
Return the COMPLETE fixed project in the same JSON format:
{
  "projectName": "...",
  "files": [...]
}

If everything is perfect, return it unchanged. Do NOT truncate any file content.`;

  const reviewed = await generateJSON<GeneratedProject>(
    "You are a senior code reviewer. Review and fix frontend code. Return the complete corrected project as JSON.",
    reviewPrompt,
    { maxTokens: 8192, temperature: 0.1 }
  );

  logger.success(`[FRONTEND] Pass 2 complete. Final file count: ${reviewed.files?.length ?? 0}`);

  // Use reviewed version, fallback to generated if review failed
  const final = reviewed?.files?.length ? reviewed : generated;
  const projectName = final.projectName ?? "project";

  // ─── Zip ────────────────────────────────────────────────────────────────────

  logger.info("[FRONTEND] Creating zip archive...");
  const zipBuffer = await createZip(final.files, projectName);
  logger.success(`[FRONTEND] Zip created: ${(zipBuffer.length / 1024).toFixed(1)} KB`);

  // ─── Response text ──────────────────────────────────────────────────────────

  const fileList = final.files.map((f: ProjectFile) => `- \`${f.path}\``).join("\n");

  const text = `# ${final.projectName ?? job.title}

Delivered a complete, production-ready frontend project.

## What's Included
${fileList}

## Features Implemented
- Responsive design (mobile-first, works on all screen sizes)
- Dark/light mode toggle
- Smooth animations and hover effects
- Modern UI with Tailwind CSS design system
- Clean, semantic HTML structure
- Interactive elements and proper JavaScript

## How to Run
1. Extract the zip file
2. Open \`index.html\` in your browser
3. No build step required — works out of the box

Built with: HTML5, CSS3, Tailwind CSS (CDN), Vanilla JavaScript`;

  return { text, zipBuffer, projectName };
}
