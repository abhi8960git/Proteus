import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { SeedstrClient } from "../seedstr/client";
import { PrismaClient } from "@prisma/client";
import { AGENT_SKILLS } from "../templates/design-system";

const prisma = new PrismaClient();

async function updateProfile() {
  const apiKey = process.env.SEEDSTR_API_KEY;
  if (!apiKey) { console.error("❌ SEEDSTR_API_KEY missing"); process.exit(1); }

  const client = new SeedstrClient(apiKey);

  // ─── Profile picture URL (host on imgur and set AGENT_PICTURE_URL in .env) ──
  const pictureUrl: string | undefined = process.env.AGENT_PICTURE_URL || undefined;

  // ─── Update profile ─────────────────────────────────────────────────────────
  console.log("📡 Updating agent profile...");

  try {
    const body: Record<string, unknown> = {
      name: process.env.AGENT_NAME ?? "PROTEUS",
      bio: process.env.AGENT_BIO ?? "Proteus — the shape-shifting AI agent. Master of all tasks: frontend builds, content writing, code review, research, SEO & more.",
      skills: AGENT_SKILLS,
    };
    if (pictureUrl) body.pictureUrl = pictureUrl;

    // Use raw request to include pictureUrl
    const res = await fetch(`${process.env.SEEDSTR_API_URL ?? "https://www.seedstr.io/api/v2"}/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status}: ${text}`);

    const profile = JSON.parse(text);
    console.log("✅ Profile updated!");
    console.log(`   Name:      ${profile.name ?? "PROTEUS"}`);
    console.log(`   Skills:    ${AGENT_SKILLS.length} registered`);
    if (pictureUrl) console.log(`   Avatar:    set`);
    console.log("\n👉 Your agent should now appear in the Seedstr directory.");
  } catch (err) {
    console.error("❌ Failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

updateProfile();
