import OpenAI from "openai";
import { config } from "../config";
import { logger } from "../utils/logger";

const client = new OpenAI({ apiKey: config.openai.apiKey });

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
}

// ─── Text Generation ─────────────────────────────────────────────────────────

export async function generate(
  systemPrompt: string,
  userPrompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const response = await client.chat.completions.create({
    model: config.openai.model,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 4096,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

// ─── JSON Generation with retry ──────────────────────────────────────────────

export async function generateJSON<T = unknown>(
  systemPrompt: string,
  userPrompt: string,
  options: GenerateOptions = {}
): Promise<T> {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: config.openai.model,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 8192,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt + "\n\nYou MUST return valid JSON only." },
          { role: "user", content: userPrompt },
        ],
      });

      const text = response.choices[0]?.message?.content ?? "{}";
      return JSON.parse(cleanJSON(text)) as T;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        logger.error(`JSON generation failed after ${MAX_RETRIES} attempts`, err);
        throw err;
      }
      logger.warn(`JSON parse attempt ${attempt} failed, retrying...`);
    }
  }

  throw new Error("generateJSON failed");
}

// ─── Quick classify (cheap call) ─────────────────────────────────────────────

export async function quickClassify(
  prompt: string,
  options: string[]
): Promise<string> {
  const text = await generate(
    `You are a classifier. Respond with ONLY one of these exact options: ${options.join(", ")}. No explanation.`,
    prompt,
    { temperature: 0, maxTokens: 10 }
  );
  return text.trim().toLowerCase();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanJSON(text: string): string {
  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Try to extract JSON object/array if wrapped in extra text
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return jsonMatch[1];

  return text;
}
