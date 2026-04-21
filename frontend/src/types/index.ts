export interface User {
  id: string;
  username: string;
  nickname: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createTime: string;
  lastLoginTime: string;
}

export interface Script {
  id: string;
  name: string;
  category: string;
  language: string;
  creator: string;
  createTime: string;
  lastUsed: string;
  version: string;
  status: string;
  tags?: string[];
  parameters?: ScriptParameter[];
  content?: string;
  description?: string;
}

export interface ScriptParameter {
  name: string;
  type: string;
  required: boolean;
  default: any;
  description: string;
}

export interface JobTemplate {
  id: string;
  name: string;
  jobCount: number;
  creator: string;
  createTime: string;
  lastUsed: string;
  status: string;
}

export interface Job {
  id: string;
  name: string;
  type: string;
  status: string;
  creator: string;
  createTime: string;
  lastExecution: string;
  nextExecution?: string;
}

export interface ScheduledJob {
  id: string;
  name: string;
  jobTemplateId: string;
  jobTemplateName: string;
  cronExpression: string;
  description: string;
  status: string;
  lastExecutionTime: string;
  nextExecutionTime: string;
  createTime: string;
}

export interface ExecutionLog {
  id: string;
  jobId: string;
  jobName: string;
  jobType: string;
  status: string;
  startTime: string;
  endTime: string;
  duration: string;
  triggeredBy: string;
  errorMessage?: string;
  executionDetail: string;
}

export interface Host {
  id: string;
  name: string;
  ip: string;
  hostname: string;
  os: string;
  cpu: number;
  memory: number;
  disk: number;
  status: string;
  environment: string;
  businessLine: string;
  tags: string[];
}
