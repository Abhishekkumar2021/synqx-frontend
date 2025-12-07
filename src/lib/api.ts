import axios from 'axios';

// --- Configuration ---
export const API_BASE_URL = 'http://localhost:8000/api/v1'; // Adjust as needed

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Types (Mirrored from OpenAPI) ---

export interface Connection {
  id: number;
  name: string;
  connection_url: string; // or hidden in real app
  type: 'postgres' | 'snowflake' | 'mysql' | 'bigquery' | 's3' | 'rest_api'; // Example types
  description?: string;
  created_at?: string;
  updated_at?: string;
  status?: 'active' | 'inactive' | 'error';
}

export interface ConnectionCreate {
  name: string;
  connection_url: string;
  type: string;
  description?: string;
}

export interface Pipeline {
  id: number;
  name: string;
  description?: string;
  schedule_interval?: string; // cron expression
  status: 'active' | 'paused' | 'draft';
  created_at?: string;
  updated_at?: string;
  last_run_at?: string;
  last_run_status?: 'success' | 'failed' | 'running' | null;
}

export interface PipelineCreate {
  name: string;
  description?: string;
  schedule_interval?: string;
}

export interface Job {
  id: number;
  pipeline_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at?: string;
  finished_at?: string;
  trigger_type: 'manual' | 'scheduled' | 'webhook';
}

export interface StepRun {
    id: number;
    step_id: number; // or string name
    job_id: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    started_at?: string;
    finished_at?: string;
    row_count?: number;
}

// --- API Functions ---

// Connections
export const getConnections = async () => {
  const { data } = await apiClient.get<Connection[]>('/connections');
  return data;
};

export const createConnection = async (payload: ConnectionCreate) => {
  const { data } = await apiClient.post<Connection>('/connections', payload);
  return data;
};

export const deleteConnection = async (id: number) => {
    await apiClient.delete(`/connections/${id}`);
};

// Pipelines
export interface PipelineNode {
    id: number;
    node_id: string;
    name: string;
    description?: string;
    operator_type: string;
    operator_class: string;
    config: Record<string, any>;
    position?: { x: number; y: number }; // Frontend specific, might need to be stored in config or separate
}

export interface PipelineEdge {
    id: number;
    from_node_id: string;
    to_node_id: string;
}

export interface PipelineVersionRead {
    id: number;
    pipeline_id: number;
    version: number;
    nodes: PipelineNode[];
    edges: PipelineEdge[];
}

export interface PipelineDetailRead extends Pipeline {
    published_version?: PipelineVersionRead;
}

export interface PipelineListResponse {
    pipelines: Pipeline[];
    total: number;
    limit: number;
    offset: number;
}

export interface PipelineStatsResponse {
    pipeline_id: number;
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    average_duration_seconds?: number;
}

export const getPipelines = async () => {
  const { data } = await apiClient.get<PipelineListResponse>('/pipelines');
  return data.pipelines;
};

export const getPipeline = async (id: number) => {
    const { data } = await apiClient.get<PipelineDetailRead>(`/pipelines/${id}`);
    return data;
};

export const getPipelineStats = async (id: number) => {
    const { data } = await apiClient.get<PipelineStatsResponse>(`/pipelines/${id}/stats`);
    return data;
};

export const createPipeline = async (payload: PipelineCreate) => {
    const { data } = await apiClient.post<PipelineDetailRead>('/pipelines', payload);
    return data;
};

export const triggerPipeline = async (id: number) => {
    const { data } = await apiClient.post<Job>(`/pipelines/${id}/trigger`, {});
    return data;
};

// Jobs
export interface JobListResponse {
    jobs: Job[];
    total: number;
    limit: number;
    offset: number;
}

export const getJobs = async (pipelineId?: number) => {
  const params = pipelineId ? { pipeline_id: pipelineId } : {};
  const { data } = await apiClient.get<JobListResponse>('/jobs', { params });
  return data.jobs;
};

export const getJob = async (id: number) => {
    const { data } = await apiClient.get<Job>(`/jobs/${id}`);
    return data;
};
