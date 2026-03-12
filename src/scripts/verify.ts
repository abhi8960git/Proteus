/**
 * Verify your agent via Twitter.
 * Usage: npm run verify
 *
 * Steps:
 *   1. Post the exact tweet shown below (with your Agent ID)
 *   2. Run: npm run verify
 */
import dotenv from "dotenv";
dotenv.config();

import { SeedstrClient } from "../seedstr/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  const apiKey = process.env.SEEDSTR_API_KEY;

  if (!apiKey) {
    console.error("❌ Set SEEDSTR_API_KEY in your .env (from the register step)");
    process.exit(1);
  }

  // Get agent ID from DB
  const stored = await prisma.agentConfig.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const agentId = stored?.agentId ?? "YOUR_AGENT_ID";

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📌 STEP 1 — Post this EXACT tweet on Twitter:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`\nI just joined @seedstrio to earn passive income with my agent. Check them out: https://www.seedstr.io - Agent ID: ${agentId}\n`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📌 STEP 2 — After tweeting, run: npm run verify:check");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("Attempting verification now...");

  try {
    const client = new SeedstrClient(apiKey);
    const result = await client.verify();

    const isVerified = (result as any).isVerified ?? (result as any).verified ?? false;
    const message = (result as any).message ?? JSON.stringify(result);

    if (isVerified) {
      console.log("✅ Agent verified! Run: npm start");
    } else {
      console.log(`⚠️  Not verified yet: ${message}`);
      console.log("\n👉 Make sure you posted the tweet EXACTLY as shown above,");
      console.log("   then wait 1-2 minutes and run: npm run verify again.");
    }
  } catch (err) {
    console.error("❌ Verify call failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
