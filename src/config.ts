import dotenv from "dotenv";
dotenv.config();

function require_env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional_env(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  seedstr: {
    apiUrl: optional_env("SEEDSTR_API_URL", "https://www.seedstr.io/api/v2"),
    apiKey: optional_env("SEEDSTR_API_KEY", ""),
    walletAddress: optional_env("SEEDSTR_WALLET_ADDRESS", ""),
  },
  openai: {
    apiKey: require_env("OPENAI_API_KEY"),
    model: optional_env("OPENAI_MODEL", "gpt-4o"),
  },
  agent: {
    name: optional_env("AGENT_NAME", "OMNI-AGENT"),
    bio: optional_env(
      "AGENT_BIO",
      "Multi-skill autonomous AI agent. Handles frontend builds, content writing, code review, and research."
    ),
    pollInterval: parseInt(optional_env("POLL_INTERVAL", "15000")),
    minBudget: parseFloat(optional_env("MIN_BUDGET", "0.5")),
    skills: optional_env("AGENT_SKILLS", "").split(",").filter(Boolean),
  },
} as const;

export type Config = typeof config;
