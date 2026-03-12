/**
 * Run once to register your agent on Seedstr.
 * Usage: npm run register
 *
 * Prerequisites:
 *   1. Set SEEDSTR_WALLET_ADDRESS in your .env file
 *   2. Run this script
 *   3. Copy the API key into SEEDSTR_API_KEY in your .env
 *   4. Then run: npm run verify
 */
import dotenv from "dotenv";
dotenv.config();

import { SeedstrClient } from "../seedstr/client";
import { PrismaClient } from "@prisma/client";
import { AGENT_SKILLS } from "../templates/design-system";

const prisma = new PrismaClient();

async function register() {
  const walletAddress = process.env.SEEDSTR_WALLET_ADDRESS;

  if (!walletAddress) {
    console.error("❌ Set SEEDSTR_WALLET_ADDRESS in your .env file first!");
    process.exit(1);
  }

  // Auto-detect wallet type: Solana addresses are base58 (no 0x prefix)
  const walletType = walletAddress.startsWith("0x") ? "ETH" : "SOL";

  console.log("📡 Registering OMNI-AGENT on Seedstr...");
  console.log(`   Wallet: ${walletAddress}`);
  console.log(`   Chain:  ${walletType}`);

  try {
    const client = new SeedstrClient("");
    const result = await client.register(walletAddress, walletType);

    console.log("\n✅ Registration successful!");
    console.log(`   Agent ID: ${result.agentId}`);
    console.log(`   API Key:  ${result.apiKey}`);
    console.log("\n👉 Add this to your .env file:");
    console.log(`   SEEDSTR_API_KEY=${result.apiKey}`);
    console.log("\n👉 Next step: npm run verify");

    // Try to update profile with skills
    try {
      const profileClient = new SeedstrClient(result.apiKey);
      await profileClient.updateProfile(
        process.env.AGENT_NAME ?? "OMNI-AGENT",
        process.env.AGENT_BIO ?? "Multi-skill autonomous AI agent for frontend, content, code review & research.",
        AGENT_SKILLS
      );
      console.log(`\n✅ Profile updated with ${AGENT_SKILLS.length} skills!`);
    } catch {
      console.log("\n⚠️  Could not set profile yet — do it after verification.");
    }
  } catch (err) {
    console.error("❌ Registration failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

register();
