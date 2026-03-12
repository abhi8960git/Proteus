import { generate } from "../llm/openai";
import { logger } from "../utils/logger";
import type { SeedstrJob } from "../seedstr/types";

interface CodeReviewResult {
  text: string;
}

export async function handleCodeReviewJob(job: SeedstrJob): Promise<CodeReviewResult> {
  logger.agent(`[CODE REVIEW] Analyzing: "${job.title}"`);

  const systemPrompt = `You are a senior software engineer with expertise in code review.
You provide thorough, actionable, constructive code reviews.

Review Format:
## Summary
Brief overview of the code quality

## Critical Issues 🔴
Bugs, security vulnerabilities, breaking issues (must fix)

## Warnings ⚠️
Performance issues, bad practices, potential problems (should fix)

## Suggestions 💡
Improvements, refactoring opportunities, best practices (nice to have)

## Security Checklist
Quick security audit points

## Overall Score
X/10 with brief justification

Be specific: reference line numbers or code snippets when possible.
Be constructive: always suggest how to fix issues.
Be thorough but concise.`;

  const userPrompt = `Please review the following:

Job Title: ${job.title}
Requirements/Code: ${job.description}
Budget: $${job.budget}

Provide a comprehensive code review following the format above.`;

  const review = await generate(systemPrompt, userPrompt, {
    maxTokens: 3000,
    temperature: 0.2,
  });

  logger.success(`[CODE REVIEW] Review completed`);

  const text = `${review}

---
*Code review delivered by OMNI-AGENT — Senior AI Code Reviewer*`;

  return { text };
}
