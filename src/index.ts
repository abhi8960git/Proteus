import { PrismaClient } from "@prisma/client";
import { config } from "./config";
import { logger } from "./utils/logger";
import { SeedstrClient } from "./seedstr/client";
import { classifyJobSmart, shouldAcceptJob } from "./router/router";
import { handleFrontendJob } from "./modules/frontend";
import { handleContentJob } from "./modules/content";
import { handleCodeReviewJob } from "./modules/code-review";
import { handleResearchJob } from "./modules/research";
import { AGENT_SKILLS } from "./templates/design-system";
import type { SeedstrJob } from "./seedstr/types";

const prisma = new PrismaClient();
const processedJobIds = new Set<string>(); // In-memory dedup for current session

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<SeedstrClient> {
  logger.agent("=== OMNI-AGENT STARTING UP ===");

  const storedConfig = await prisma.agentConfig.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!storedConfig?.apiKey && !config.seedstr.apiKey) {
    logger.warn("No API key found. Run: npm run register");
    logger.warn("Set SEEDSTR_WALLET_ADDRESS in .env first.");
    process.exit(1);
  }

  const apiKey = storedConfig?.apiKey ?? config.seedstr.apiKey;
  const client = new SeedstrClient(apiKey);

  // Load already-processed job IDs from DB into memory
  const processed = await prisma.job.findMany({
    where: { status: { in: ["ACCEPTED", "COMPLETED", "DECLINED", "FAILED"] } },
    select: { id: true },
  });
  processed.forEach((j) => processedJobIds.add(j.id));

  logger.success(`Loaded ${processedJobIds.size} previously processed jobs`);

  // Update profile and skills on every startup
  try {
    await client.updateProfile(config.agent.name, config.agent.bio, AGENT_SKILLS);
    logger.success(`Profile updated: ${AGENT_SKILLS.length} skills registered`);
  } catch (err) {
    logger.warn("Could not update profile (maybe not verified yet)");
  }

  return client;
}

// ─── Process a single job ─────────────────────────────────────────────────────

async function processJob(client: SeedstrClient, job: SeedstrJob) {
  logger.agent(`\n--- Processing Job: ${job.id} ---`);
  logger.info(`Title: "${job.title}"`);
  logger.info(`Budget: $${job.budget}`);

  // Mark as accepted in DB
  await prisma.job.update({
    where: { id: job.id },
    data: { status: "ACCEPTED" },
  });

  try {
    const jobType = await classifyJobSmart(job);
    logger.info(`Job type classified as: ${jobType}`);

    // Update classification in DB
    await prisma.job.update({
      where: { id: job.id },
      data: { jobType },
    });

    if (!shouldAcceptJob(job, jobType)) {
      await client.declineJob(job.id, `Job type "${jobType}" is outside my skill set or below minimum budget`);
      return;
    }

    let responseText: string;
    let zipBuffer: Buffer | undefined;
    let projectName: string | undefined;

    // Route to the right module
    switch (jobType) {
      case "FRONTEND": {
        const result = await handleFrontendJob(job);
        responseText = result.text;
        zipBuffer = result.zipBuffer;
        projectName = result.projectName;
        break;
      }
      case "CONTENT": {
        const result = await handleContentJob(job);
        responseText = result.text;
        break;
      }
      case "CODE_REVIEW": {
        const result = await handleCodeReviewJob(job);
        responseText = result.text;
        break;
      }
      case "RESEARCH": {
        const result = await handleResearchJob(job);
        responseText = result.text;
        break;
      }
      default:
        await client.declineJob(job.id, "Unable to classify job type");
        return;
    }

    // Upload zip if it's a frontend job
    let fileUrls: string[] | undefined;
    if (zipBuffer && projectName) {
      const uploaded = await client.uploadZip(
        zipBuffer,
        `${projectName}.zip`
      );
      fileUrls = uploaded.urls;
    }

    // Submit response
    await client.submitResponse(job.id, responseText, fileUrls);
    processedJobIds.add(job.id);

    logger.success(`✓ Job ${job.id} completed successfully!`);
  } catch (err) {
    logger.error(`Failed to process job ${job.id}`, err);

    await prisma.job.update({
      where: { id: job.id },
      data: { status: "FAILED", processedAt: new Date() },
    });

    await prisma.submission.upsert({
      where: { jobId: job.id },
      create: {
        jobId: job.id,
        responseText: "",
        status: "SUBMITTED",
        errorMsg: String(err),
      },
      update: {
        status: "SUBMITTED",
        errorMsg: String(err),
      },
    });
  }
}

// ─── Main polling loop ────────────────────────────────────────────────────────

async function pollLoop(client: SeedstrClient) {
  logger.agent(`Polling every ${config.agent.pollInterval / 1000}s for new jobs...`);
  logger.agent(`Min budget: $${config.agent.minBudget}`);

  while (true) {
    try {
      const jobs = await client.listJobs();

      const newJobs = jobs.filter(
        (j) => !processedJobIds.has(j.id) && j.status === "pending"
      );

      if (newJobs.length > 0) {
        logger.success(`Found ${newJobs.length} new job(s)!`);

        for (const job of newJobs) {
          processedJobIds.add(job.id); // Add immediately to prevent double-processing
          await processJob(client, job);
        }
      } else {
        process.stdout.write(".");
      }
    } catch (err) {
      logger.error("Poll error", err);
    }

    await sleep(config.agent.pollInterval);
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main() {
  try {
    const client = await bootstrap();
    logger.agent("Bootstrap complete. Starting polling loop...\n");
    await pollLoop(client);
  } catch (err) {
    logger.error("Fatal error", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.agent("\nShutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

main();
