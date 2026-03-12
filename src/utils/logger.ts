import { PrismaClient } from "@prisma/client";
type LogLevel = "INFO" | "SUCCESS" | "WARN" | "ERROR";

const prisma = new PrismaClient();

const RESET = "\x1b[0m";
const COLORS = {
  INFO: "\x1b[36m",     // Cyan
  SUCCESS: "\x1b[32m",  // Green
  WARN: "\x1b[33m",     // Yellow
  ERROR: "\x1b[31m",    // Red
  AGENT: "\x1b[35m",    // Magenta
} as const;

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

async function writeLog(level: LogLevel, message: string, data?: unknown) {
  try {
    await prisma.log.create({
      data: {
        level,
        message,
        data: data ? JSON.stringify(data) : undefined,
      },
    });
  } catch {
    // Don't let DB errors crash the logger
  }
}

export const logger = {
  info(message: string, data?: unknown) {
    console.log(`${COLORS.INFO}[INFO]${RESET} ${timestamp()} ${message}`);
    writeLog("INFO", message, data);
  },

  success(message: string, data?: unknown) {
    console.log(`${COLORS.SUCCESS}[SUCCESS]${RESET} ${timestamp()} ${message}`);
    writeLog("SUCCESS", message, data);
  },

  warn(message: string, data?: unknown) {
    console.warn(`${COLORS.WARN}[WARN]${RESET} ${timestamp()} ${message}`);
    writeLog("WARN", message, data);
  },

  error(message: string, data?: unknown) {
    console.error(`${COLORS.ERROR}[ERROR]${RESET} ${timestamp()} ${message}`);
    writeLog("ERROR", message, data);
  },

  agent(message: string) {
    console.log(`${COLORS.AGENT}[AGENT]${RESET} ${timestamp()} ${message}`);
  },
};
