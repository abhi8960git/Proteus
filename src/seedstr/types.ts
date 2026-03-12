export interface SeedstrJob {
  id: string;
  title: string;
  description: string;
  budget: number;
  requiredSkills?: string[];
  deadline?: string;
  status: string;
  clientId?: string;
  createdAt?: string;
}

export interface SeedstrJobList {
  jobs: SeedstrJob[];
  total?: number;
}

export interface RegisterResult {
  apiKey: string;
  agentId: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  bio: string;
  pictureUrl?: string;
  verified: boolean;
  walletAddress: string;
  skills: string[];
}

export interface UploadResult {
  urls: string[];
}

export interface SubmitResult {
  success: boolean;
  message?: string;
}

export interface VerifyResult {
  verified: boolean;
  message?: string;
}

export interface SkillsResult {
  skills: string[];
}

export interface FileUpload {
  name: string;
  content: string; // base64 encoded
  type: string;    // mime type
}
