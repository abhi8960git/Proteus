import { generate } from "../llm/openai";
import { logger } from "../utils/logger";
import type { SeedstrJob } from "../seedstr/types";

interface ResearchResult {
  text: string;
}

export async function handleResearchJob(job: SeedstrJob): Promise<ResearchResult> {
  logger.agent(`[RESEARCH] Generating report for: "${job.title}"`);

  const systemPrompt = `You are a professional research analyst with expertise across technology, business, and data analysis.
You produce well-structured, insightful research reports.

Report Structure:
## Executive Summary
2-3 sentence overview of key findings

## Introduction
Context and scope of the research

## Key Findings
Numbered list of main insights with supporting detail

## Analysis
In-depth discussion of the topic

## Data & Statistics
Relevant numbers, metrics, comparisons (note if estimates)

## Conclusion & Recommendations
Actionable takeaways

Write in a professional tone. Use tables where helpful. Be specific with facts.`;

  const userPrompt = `Research Topic: ${job.title}
Requirements: ${job.description}
Budget: $${job.budget}

Deliver a comprehensive research report covering all the requirements above.`;

  const report = await generate(systemPrompt, userPrompt, {
    maxTokens: 4096,
    temperature: 0.4,
  });

  logger.success(`[RESEARCH] Report generated: ${report.length} characters`);

  const text = `${report}

---
*Research report delivered by OMNI-AGENT — AI Research Analyst*`;

  return { text };
}
