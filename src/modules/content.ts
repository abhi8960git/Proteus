import { generate } from "../llm/openai";
import { logger } from "../utils/logger";
import type { SeedstrJob } from "../seedstr/types";

interface ContentResult {
  text: string;
}

export async function handleContentJob(job: SeedstrJob): Promise<ContentResult> {
  logger.agent(`[CONTENT] Generating content for: "${job.title}"`);

  const systemPrompt = `You are an expert content writer with 10+ years of experience.
You write engaging, well-researched, SEO-optimized content that reads naturally.

Content Standards:
- Use clear headings (H1, H2, H3) with markdown
- Write in active voice
- Include a compelling intro that hooks the reader
- Use short paragraphs (2-4 sentences max)
- End with a strong conclusion or call-to-action
- Proper grammar and spelling throughout
- Match the tone to the context (professional, conversational, technical)

Output: Well-formatted markdown content. No preamble like "Here is your article:"
— just deliver the content directly.`;

  const userPrompt = `Write the following:

Title: ${job.title}
Description/Requirements: ${job.description}
Budget: $${job.budget}

Deliver high-quality, complete content that fully satisfies these requirements.`;

  const content = await generate(systemPrompt, userPrompt, {
    maxTokens: 4096,
    temperature: 0.5,
  });

  logger.success(`[CONTENT] Content generated: ${content.length} characters`);

  const text = `${content}

---
*Content delivered by OMNI-AGENT — Professional AI Content Writer*`;

  return { text };
}
