import { PrismaClient } from "@prisma/client";
import { config } from "../config";
import { logger } from "../utils/logger";
import type {
  SeedstrJob,
  RegisterResult,
  AgentProfile,
  UploadResult,
  SubmitResult,
  VerifyResult,
  SkillsResult,
  FileUpload,
} from "./types";

const prisma = new PrismaClient();

export class SeedstrClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.baseUrl = config.seedstr.apiUrl;
    this.apiKey = apiKey ?? config.seedstr.apiKey;
  }

  private get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = { ...this.headers, ...customHeaders };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();

    if (!res.ok) {
      logger.error(`Seedstr API error ${res.status} on ${method} ${path}`, {
        status: res.status,
        body: text,
      });
      throw new Error(`Seedstr API ${res.status}: ${text}`);
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  // ─── Agent Registration ───────────────────────────────────────────────────

  async register(walletAddress: string, walletType: "SOL" | "ETH" = "SOL"): Promise<RegisterResult> {
    logger.info(`Registering agent with wallet: ${walletAddress} (${walletType})`);
    const result = await this.request<RegisterResult>("POST", "/register", {
      walletAddress,
      walletType,
    });

    // Persist to DB
    await prisma.agentConfig.upsert({
      where: { walletAddress },
      create: {
        walletAddress,
        agentId: result.agentId,
        apiKey: result.apiKey,
        name: config.agent.name,
        bio: config.agent.bio,
      },
      update: {
        agentId: result.agentId,
        apiKey: result.apiKey,
      },
    });

    this.apiKey = result.apiKey;
    logger.success(`Registered! Agent ID: ${result.agentId}`);
    return result;
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getProfile(): Promise<AgentProfile> {
    return this.request<AgentProfile>("GET", "/me");
  }

  async updateProfile(name: string, bio: string, skills: string[]): Promise<AgentProfile> {
    logger.info(`Updating profile: ${name} with ${skills.length} skills`);
    const profile = await this.request<AgentProfile>("PATCH", "/me", {
      name,
      bio,
      skills,
    });

    await prisma.agentConfig.updateMany({
      where: { apiKey: this.apiKey },
      data: {
        name,
        bio,
        skills: JSON.stringify(skills),
      },
    });

    return profile;
  }

  // ─── Verification ─────────────────────────────────────────────────────────

  async verify(): Promise<VerifyResult> {
    logger.info(`Calling /verify endpoint...`);
    // No body needed — Seedstr checks Twitter based on your registered agent ID
    const result = await this.request<VerifyResult>("POST", "/verify");

    const isVerified = (result as any).isVerified ?? result.verified ?? false;

    if (isVerified) {
      await prisma.agentConfig.updateMany({
        where: { apiKey: this.apiKey },
        data: { verified: true },
      });
      logger.success("Agent verified!");
    }

    return result;
  }

  // ─── Jobs ─────────────────────────────────────────────────────────────────

  async listJobs(): Promise<SeedstrJob[]> {
    const result = await this.request<SeedstrJob[] | { jobs: SeedstrJob[] }>(
      "GET",
      "/jobs"
    );

    const jobs = Array.isArray(result) ? result : result.jobs ?? [];

    // Persist new jobs to DB
    for (const job of jobs) {
      await prisma.job.upsert({
        where: { id: job.id },
        create: {
          id: job.id,
          title: job.title,
          description: job.description,
          budget: job.budget,
          requiredSkills: JSON.stringify(job.requiredSkills ?? []),
          deadline: job.deadline ? new Date(job.deadline) : undefined,
          status: "SEEN",
        },
        update: {}, // Don't overwrite if we've already processed it
      });
    }

    return jobs;
  }

  async getJobDetails(jobId: string): Promise<SeedstrJob> {
    return this.request<SeedstrJob>("GET", `/jobs/${jobId}`);
  }

  async declineJob(jobId: string, reason?: string): Promise<void> {
    await this.request("POST", `/jobs/${jobId}/decline`, { reason });

    await prisma.job.update({
      where: { id: jobId },
      data: { status: "DECLINED", processedAt: new Date() },
    });

    logger.warn(`Declined job ${jobId}: ${reason ?? "outside skill set"}`);
  }

  // ─── File Upload ──────────────────────────────────────────────────────────

  async uploadFiles(files: FileUpload[]): Promise<UploadResult> {
    logger.info(`Uploading ${files.length} file(s) to Seedstr...`);

    const result = await this.request<UploadResult>("POST", "/upload", {
      files,
    });

    logger.success(`Upload complete. URLs: ${result.urls.join(", ")}`);
    return result;
  }

  async uploadZip(zipBuffer: Buffer, filename: string): Promise<UploadResult> {
    const base64 = zipBuffer.toString("base64");
    return this.uploadFiles([
      {
        name: filename,
        content: base64,
        type: "application/zip",
      },
    ]);
  }

  // ─── Submit Response ──────────────────────────────────────────────────────

  async submitResponse(
    jobId: string,
    text: string,
    fileUrls?: string[]
  ): Promise<SubmitResult> {
    logger.info(`Submitting response for job ${jobId}...`);

    const result = await this.request<SubmitResult>(
      "POST",
      `/jobs/${jobId}/respond`,
      { text, fileUrls }
    );

    // Update job and create submission record
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "COMPLETED", processedAt: new Date() },
    });

    await prisma.submission.upsert({
      where: { jobId },
      create: {
        jobId,
        responseText: text,
        fileUrl: fileUrls?.[0],
        status: "SUBMITTED",
      },
      update: {
        responseText: text,
        fileUrl: fileUrls?.[0],
        status: "SUBMITTED",
      },
    });

    logger.success(`Response submitted for job ${jobId}`);
    return result;
  }

  // ─── Skills ───────────────────────────────────────────────────────────────

  async listSkills(): Promise<string[]> {
    const result = await this.request<SkillsResult | string[]>("GET", "/skills");
    return Array.isArray(result) ? result : result.skills ?? [];
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async getStoredConfig() {
    return prisma.agentConfig.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }
}
