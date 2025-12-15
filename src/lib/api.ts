/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { toast } from 'sonner';

// --- Configuration ---
export const API_BASE_URL = 'http://localhost:8000/api/v1'; // Adjust as needed

// Renaming for consistency with request
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error;
        
        // Handle 401 Unauthorized (Session Expired)
        if (response && response.status === 401) {
            // Only redirect if we are not already on the login page to avoid loops
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                toast.error('Session expired. Please login again.');
                // Slight delay to allow toast to be seen
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            }
        } 
        // Handle 403 Forbidden
        else if (response && response.status === 403) {
            toast.error('You do not have permission to perform this action.');
        }
        // Handle 500 Server Errors
        else if (response && response.status >= 500) {
            toast.error('Server error. Please try again later.');
        }
        // Handle Network Errors
        else if (error.message === 'Network Error') {
            toast.error('Network error. Please check your connection.');
        }
        // Let specific 400 errors be handled by the caller if needed, 
        // but provide a default message if none exists
        else if (response && response.data && response.data.detail) {
             // Optional: Toast specific API errors globally if desired, 
             // or let components handle them. For now, we pass it through.
        }

        return Promise.reject(error);
    }
);

// --- Auth Types ---
export interface AuthToken {
    access_token: string;
    token_type: string;
}

export interface User {
    id: number;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_superuser: boolean;
}

export interface LoginRequest {
    username: string; // OAuth2 expects username/password form fields usually, but here handling as JSON or Form
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name?: string;
}

// --- Auth Functions ---

export const loginUser = async (credentials: LoginRequest) => {
    // FastAPIs OAuth2PasswordRequestForm expects form-data usually
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);
    
    const { data } = await api.post<AuthToken>('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return data;
};

export const registerUser = async (payload: RegisterRequest) => {
    const { data } = await api.post<User>('/auth/register', payload);
    return data;
};

export const getCurrentUser = async () => {
    const { data } = await api.get<User>('/auth/me');
    return data;
};

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
  config: Record<string, any>; // Updated to send dynamic config
  type: string;
  description?: string;
}

export interface Pipeline {
  id: number;
  name: string;
  description?: string;
  schedule_cron?: string; // cron expression
  schedule_enabled?: boolean;
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
  status: "running" | "failed" | "pending" | "completed" | "cancelled" | "success" | "error";
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
export interface ConnectionListResponse {
    connections: Connection[];
    total: number;
    limit: number;
    offset: number;
}

export interface ConnectionTestResult {
    success: boolean;
    message: string;
    latency_ms?: number;
}

export interface Asset {
    id: number;
    name: string;
    asset_type: string;
    schema_metadata?: any;
    current_schema_version?: number;
    updated_at: string;
}

export interface AssetListResponse {
    assets: Asset[];
    total: number;
    limit: number;
    offset: number;
}

export interface SchemaVersion {
    id: number;
    version: number;
    json_schema: any;
    discovered_at: string;
    is_breaking_change: boolean;
}

export const getConnections = async () => {
  const { data } = await api.get<ConnectionListResponse>('/connections');
  return data.connections;
};

export const getConnection = async (id: number) => {
    const { data } = await api.get<Connection>(`/connections/${id}`);
    return data;
};

export const createConnection = async (payload: ConnectionCreate) => {
  const { data } = await api.post<Connection>('/connections', payload);
  return data;
};

export const deleteConnection = async (id: number) => {
    await api.delete(`/connections/${id}`);
};

export const testConnection = async (id: number, config: any = {}) => {
    const { data } = await api.post<ConnectionTestResult>(`/connections/${id}/test`, { config });
    return data;
};

export const discoverAssets = async (id: number) => {
    const { data } = await api.post<any>(`/connections/${id}/discover`, { include_metadata: false });
    return data;
};

export const getConnectionAssets = async (id: number) => {
    const { data } = await api.get<AssetListResponse>(`/connections/${id}/assets`);
    return data.assets;
};

export const discoverAssetSchema = async (connectionId: number, assetId: number) => {
    const { data } = await api.post<any>(`/connections/${connectionId}/assets/${assetId}/discover-schema`, { force_refresh: true });
    return data;
};

export const getAssetSchemaVersions = async (connectionId: number, assetId: number) => {
    const { data } = await api.get<SchemaVersion[]>(`/connections/${connectionId}/assets/${assetId}/schema-versions`);
    return data;
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
  const { data } = await api.get<PipelineListResponse>('/pipelines');
  return data.pipelines;
};

export const getPipeline = async (id: number) => {
    const { data } = await api.get<PipelineDetailRead>(`/pipelines/${id}`);
    return data;
};

export const getPipelineStats = async (id: number) => {
    const { data } = await api.get<PipelineStatsResponse>(`/pipelines/${id}/stats`);
    return data;
};

export const createPipeline = async (payload: PipelineCreate) => {
    const { data } = await api.post<PipelineDetailRead>('/pipelines', payload);
    return data;
};

export const updatePipeline = async (id: number, payload: any) => {
    const { data } = await api.patch<PipelineDetailRead>(`/pipelines/${id}`, payload);
    return data;
};

export interface PipelineVersionCreate {
    config_snapshot?: Record<string, any>;
    change_summary?: Record<string, any>;
    version_notes?: string;
    nodes: any[]; // Using any[] for brevity, ideally strict typed
    edges: any[];
}

export const createPipelineVersion = async (id: number, payload: PipelineVersionCreate) => {
    const { data } = await api.post<PipelineVersionRead>(`/pipelines/${id}/versions`, payload);
    return data;
};

export const publishPipelineVersion = async (pipelineId: number, versionId: number) => {
    const { data } = await api.post<any>(`/pipelines/${pipelineId}/versions/${versionId}/publish`, {});
    return data;
};

export const triggerPipeline = async (id: number) => {
    const { data } = await api.post<Job>(`/pipelines/${id}/trigger`, {});
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
  const { data } = await api.get<JobListResponse>('/jobs', { params });
  return data.jobs;
};

export const getJob = async (id: number) => {
    const { data } = await api.get<Job>(`/jobs/${id}`);
    return data;
};

export const getJobLogs = async (id: number) => {
    const { data } = await api.get<any[]>(`/jobs/${id}/logs`);
    return data;
};