import apiClient from './client';

// ===== 作业模板接口 =====
export interface JobTemplate {
  id: string;
  name: string;
  description?: string;
  script_ids: number[];
  cron_expression?: string;
  status: string;
  creator: string;
  create_time?: string;
}

export interface JobTemplateCreate {
  name: string;
  description?: string;
  script_ids: number[];
  cron_expression?: string;
  status?: string;
}

// ===== 任务编排接口 =====
export interface ScheduleItem {
  id: number;
  schedule_id: number;
  template_id: number;
  sort_order: number;
  template_name?: string;
}

export interface TaskSchedule {
  id: number;
  name: string;
  description?: string;
  schedule_type: string;
  cron_expression?: string;
  status: string;
  creator: string;
  create_time?: string;
  last_execution_time?: string;
  total_executions: number;
  failed_executions: number;
  items: ScheduleItem[];
}

export interface TaskScheduleCreate {
  name: string;
  description?: string;
  schedule_type?: string;
  cron_expression?: string;
  items?: { template_id: number }[];
}

// ===== 作业接口（保留兼容） =====
export interface Job {
  id: string;
  name: string;
  template_id?: number;
  template_name?: string;
  job_type: 'immediate' | 'scheduled' | 'manual';
  cron_expression?: string;
  status: string;
  creator: string;
  create_time?: string;
  last_execution?: string;
  next_execution?: string;
}

export interface JobCreate {
  name: string;
  template_id?: number;
  job_type: string;
  cron_expression?: string;
  status?: string;
}

// ===== 执行日志接口 =====
export interface ExecutionLog {
  id: string;
  task_id: number;
  job_id?: number;
  template_id?: number;
  script_id?: number;
  execution_type: 'script' | 'job' | 'schedule';
  name: string;
  status: string;
  output?: string;
  error?: string;
  creator: string;
  start_time?: string;
  end_time?: string;
}

export interface ExecutionLogCreate {
  job_id?: number;
  template_id?: number;
  script_id?: number;
  execution_type: string;
  name: string;
  status?: string;
}

// ===== 作业模板 API =====

export const getJobTemplates = async (): Promise<JobTemplate[]> => {
  const response = await apiClient.get('/api/job-templates/');
  return response.data;
};

export const getJobTemplate = async (id: string): Promise<JobTemplate> => {
  const response = await apiClient.get(`/api/job-templates/${id}`);
  return response.data;
};

export const createJobTemplate = async (template: JobTemplateCreate): Promise<JobTemplate> => {
  const response = await apiClient.post('/api/job-templates/', template);
  return response.data;
};

export const updateJobTemplate = async (id: string, template: Partial<JobTemplateCreate>): Promise<JobTemplate> => {
  const response = await apiClient.put(`/api/job-templates/${id}`, template);
  return response.data;
};

export const deleteJobTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/job-templates/${id}`);
};

// ===== 任务编排 API =====

export const getTaskSchedules = async (): Promise<TaskSchedule[]> => {
  const response = await apiClient.get('/api/task-schedules/');
  return response.data;
};

export const getTaskSchedule = async (id: number): Promise<TaskSchedule> => {
  const response = await apiClient.get(`/api/task-schedules/${id}`);
  return response.data;
};

export const createTaskSchedule = async (schedule: TaskScheduleCreate): Promise<TaskSchedule> => {
  const response = await apiClient.post('/api/task-schedules/', schedule);
  return response.data;
};

export const updateTaskSchedule = async (id: number, schedule: Partial<TaskScheduleCreate>): Promise<TaskSchedule> => {
  const response = await apiClient.put(`/api/task-schedules/${id}`, schedule);
  return response.data;
};

export const deleteTaskSchedule = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/task-schedules/${id}`);
};

export const addScheduleItem = async (scheduleId: number, templateId: number): Promise<any> => {
  const response = await apiClient.post(`/api/task-schedules/${scheduleId}/items?template_id=${templateId}`);
  return response.data;
};

export const removeScheduleItem = async (scheduleId: number, itemId: number): Promise<void> => {
  await apiClient.delete(`/api/task-schedules/${scheduleId}/items/${itemId}`);
};

export const reorderScheduleItems = async (scheduleId: number, itemIds: number[]): Promise<void> => {
  await apiClient.put(`/api/task-schedules/${scheduleId}/items/reorder`, itemIds);
};

export const executeTaskSchedule = async (id: number, targetHost?: string): Promise<any> => {
  const params = targetHost ? { target_host: targetHost } : {};
  const response = await apiClient.post(`/api/task-schedules/${id}/execute`, null, { params });
  return response.data;
};

// ===== 作业管理 API（保留兼容） =====

export const getJobs = async (): Promise<Job[]> => {
  const response = await apiClient.get('/api/jobs/');
  return response.data;
};

export const getJob = async (id: string): Promise<Job> => {
  const response = await apiClient.get(`/api/jobs/${id}`);
  return response.data;
};

export const createJob = async (job: JobCreate): Promise<Job> => {
  const response = await apiClient.post('/api/jobs/', job);
  return response.data;
};

export const updateJob = async (id: string, job: Partial<JobCreate>): Promise<Job> => {
  const response = await apiClient.put(`/api/jobs/${id}`, job);
  return response.data;
};

export const deleteJob = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/jobs/${id}`);
};

export const executeJob = async (id: string, targetHost?: string): Promise<any> => {
  const params = targetHost ? { target_host: targetHost } : {};
  const response = await apiClient.post(`/api/jobs/${id}/execute`, null, { params });
  return response.data;
};

// ===== 执行日志 API =====

export const getExecutionLogs = async (executionType?: string): Promise<ExecutionLog[]> => {
  const params = executionType ? { execution_type: executionType } : {};
  const response = await apiClient.get('/api/execution-logs/', { params });
  return response.data;
};

export const getExecutionLog = async (id: string): Promise<ExecutionLog> => {
  const response = await apiClient.get(`/api/execution-logs/${id}`);
  return response.data;
};

export const createExecutionLog = async (log: ExecutionLogCreate): Promise<ExecutionLog> => {
  const response = await apiClient.post('/api/execution-logs/', log);
  return response.data;
};

export const completeExecutionLog = async (
  id: string,
  status: string,
  output?: string,
  error?: string
): Promise<ExecutionLog> => {
  const response = await apiClient.put(`/api/execution-logs/${id}/complete`, null, {
    params: { status, output, error }
  });
  return response.data;
};

export const deleteExecutionLog = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/execution-logs/${id}`);
};
