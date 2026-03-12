import { quickClassify } from "../llm/openai";

export type JobType = "FRONTEND" | "CONTENT" | "CODE_REVIEW" | "RESEARCH" | "UNKNOWN";
import { config } from "../config";
import type { SeedstrJob } from "../seedstr/types";

// ─── Keyword-based fast classifier ───────────────────────────────────────────

const FRONTEND_KEYWORDS = [
  "build", "create", "design", "make", "develop",
  "website", "web app", "landing page", "portfolio", "dashboard",
  "ui", "frontend", "html", "css", "react", "nextjs", "page",
  "app", "application", "interface", "component", "layout",
  "responsive", "tailwind", "mobile", "saas", "e-commerce", "ecommerce",
];

const CONTENT_KEYWORDS = [
  "write", "writing", "blog", "article", "post", "content",
  "copy", "copywriting", "seo", "newsletter", "email",
  "essay", "marketing", "social media", "caption", "description",
  "press release", "announcement", "script", "story",
];

const CODE_REVIEW_KEYWORDS = [
  "review", "debug", "fix", "audit", "analyze", "refactor",
  "code review", "find bug", "find bugs", "check code", "improve code",
  "optimize", "security audit", "vulnerability", "performance issue",
];

const RESEARCH_KEYWORDS = [
  "research", "analyze", "report", "compare", "summarize",
  "investigate", "study", "survey", "data analysis", "market research",
  "competitive analysis", "trend", "statistics",
];

function matchKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw)).length;
}

// ─── Fast classify (no LLM call) ─────────────────────────────────────────────

export function classifyJobFast(job: SeedstrJob): JobType {
  const text = `${job.title} ${job.description}`;

  const scores: Record<JobType, number> = {
    FRONTEND: matchKeywords(text, FRONTEND_KEYWORDS),
    CONTENT: matchKeywords(text, CONTENT_KEYWORDS),
    CODE_REVIEW: matchKeywords(text, CODE_REVIEW_KEYWORDS),
    RESEARCH: matchKeywords(text, RESEARCH_KEYWORDS),
    UNKNOWN: 0,
  };

  const best = Object.entries(scores).reduce((a, b) =>
    b[1] > a[1] ? b : a
  );

  // Require at least 2 keyword matches for confidence
  return best[1] >= 2 ? (best[0] as JobType) : "UNKNOWN";
}

// ─── LLM-assisted classify for ambiguous jobs ─────────────────────────────────

export async function classifyJobSmart(job: SeedstrJob): Promise<JobType> {
  const fastResult = classifyJobFast(job);

  if (fastResult !== "UNKNOWN") return fastResult;

  // Only use LLM if fast classifier is uncertain
  const prompt = `Job title: "${job.title}"\nDescription: "${job.description.substring(0, 500)}"`;

  const result = await quickClassify(prompt, [
    "frontend",
    "content",
    "code_review",
    "research",
    "unknown",
  ]);

  const map: Record<string, JobType> = {
    frontend: "FRONTEND",
    content: "CONTENT",
    code_review: "CODE_REVIEW",
    research: "RESEARCH",
    unknown: "UNKNOWN",
  };

  return map[result] ?? "UNKNOWN";
}

// ─── Accept/decline decision ─────────────────────────────────────────────────

export function shouldAcceptJob(job: SeedstrJob, jobType: JobType): boolean {
  if (jobType === "UNKNOWN") return false;
  if (job.budget < config.agent.minBudget) return false;
  return true;
}
