/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { toast } from 'sonner';
import { 
    ConnectorType, 
    PipelineStatus, 
    JobStatus, 
    OperatorType, 
    RetryStrategy
} from './enums';

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
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                toast.error('Session expired. Please login again.');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            }
        } 
        else if (response && response.status === 403) {
            toast.error('You do not have permission to perform this action.');
        }
        else if (response && response.status >= 500) {
            toast.error('Server error. Please try again later.');
        }
        else if (error.message === 'Network Error') {
            toast.error('Network error. Please check your connection.');
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
    username: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name?: string;
}

// --- Auth Functions ---

export const loginUser = async (credentials: LoginRequest) => {
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

export const updateUser = async (payload: Partial<User> & { password?: string }) => {
    const { data } = await api.patch<User>('/auth/me', payload);
    return data;
};

export const deleteUser = async () => {
    await api.delete('/auth/me');
};

// --- Types ---

export interface Connection {
  id: number;
  name: string;
  connector_type: ConnectorType;
  description?: string;
  config_schema?: Record<string, any>;
  health_status?: string;
  last_test_at?: string;
  created_at?: string;
  updated_at?: string;
  asset_count?: number; 
  max_concurrent_connections?: number;
  connection_timeout_seconds?: number;
  tags?: Record<string, any>;
}

export interface ConnectionCreate {
  name: string;
  config: Record<string, any>;
  connector_type: ConnectorType;
  description?: string;
  tags?: Record<string, any>;
  max_concurrent_connections?: number;
  connection_timeout_seconds?: number;
}

export interface Pipeline {
  id: number;
  name: string;
  description?: string;
  schedule_cron?: string;
  schedule_enabled?: boolean;
  schedule_timezone?: string;
  status: PipelineStatus;
  current_version?: number;
  published_version_id?: number;
  max_parallel_runs?: number;
  execution_timeout_seconds?: number;
  tags?: Record<string, any>;
  priority?: number;
  created_at: string;
  updated_at: string;
}

export interface PipelineCreate {
  name: string;
  description?: string;
  schedule_cron?: string;
  schedule_enabled?: boolean;
  schedule_timezone?: string;
  max_parallel_runs?: number;
  execution_timeout_seconds?: number;
  tags?: Record<string, any>;
  priority?: number;
  initial_version: PipelineVersionCreate;
}

export interface PipelineUpdate {
  name?: string;
  description?: string;
  schedule_cron?: string;
  schedule_enabled?: boolean;
  schedule_timezone?: string;
  status?: PipelineStatus;
  max_parallel_runs?: number;
  execution_timeout_seconds?: number;
  tags?: Record<string, any>;
  priority?: number;
}

export interface Job {
  id: number;
  pipeline_id: number;
  pipeline_version_id: number;
  status: JobStatus;
  retry_count?: number;
  max_retries?: number;
  retry_strategy?: RetryStrategy;
  retry_delay_seconds?: number;
  infra_error?: string;
  worker_id?: string;
  queue_name?: string;
  execution_time_ms?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  celery_task_id?: string;
  correlation_id?: string;
}

export interface StepRun {
    id: number;
    step_id: number;
    job_id: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    started_at?: string;
    finished_at?: string;
    row_count?: number;
}

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
    fully_qualified_name?: string;
    is_source: boolean;
    is_destination: boolean;
    is_incremental_capable: boolean;
    schema_metadata?: any;
    current_schema_version?: number;
    description?: string;
    config?: Record<string, any>;
    tags?: Record<string, any>;
    row_count_estimate?: number;
    size_bytes_estimate?: number;
    updated_at: string;
    created_at: string;
}

export interface AssetListResponse {
    assets: Asset[];
    total: number;
    limit: number;
    offset: number;
}

export interface AssetCreate {
    name: string;
    asset_type: string;
    connection_id: number;
    schema_metadata?: Record<string, any>;
    description?: string;
    is_source?: boolean;
    is_destination?: boolean;
    is_incremental_capable?: boolean;
    config?: Record<string, any>;
    tags?: Record<string, any>;
    fully_qualified_name?: string;
    row_count_estimate?: number;
    size_bytes_estimate?: number;
}

export interface AssetUpdate {
    name?: string;
    description?: string;
    asset_type?: string;
    fully_qualified_name?: string;
    is_source?: boolean;
    is_destination?: boolean;
    is_incremental_capable?: boolean;
    config?: Record<string, any>;
    tags?: Record<string, any>;
    schema_metadata?: Record<string, any>;
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

export interface SchemaDiscoveryResponse {
    success: boolean;
    schema_version?: number;
    is_breaking_change: boolean;
    message: string;
    discovered_schema?: Record<string, any>;
}

export const discoverAssets = async (id: number) => {
    const { data } = await api.post<any>(`/connections/${id}/discover`, { include_metadata: false });
    return data;
};

export const getConnectionAssets = async (id: number) => {
    const { data } = await api.get<AssetListResponse>(`/connections/${id}/assets`);
    return data.assets;
};

export const createAsset = async (connectionId: number, payload: AssetCreate) => {
    const { data } = await api.post<Asset>(`/connections/${connectionId}/assets`, payload);
    return data;
};

export const updateAsset = async (connectionId: number, assetId: number, payload: AssetUpdate) => {
    const { data } = await api.patch<Asset>(`/connections/${connectionId}/assets/${assetId}`, payload);
    return data;
};

export const deleteAsset = async (connectionId: number, assetId: number) => {
    await api.delete(`/connections/${connectionId}/assets/${assetId}`);
};

export const discoverAssetSchema = async (connectionId: number, assetId: number) => {
    const { data } = await api.post<SchemaDiscoveryResponse>(`/connections/${connectionId}/assets/${assetId}/discover-schema`, { force_refresh: true });
    return data;
};

export const getAssetSchemaVersions = async (connectionId: number, assetId: number) => {
    const { data } = await api.get<SchemaVersion[]>(`/connections/${connectionId}/assets/${assetId}/schema-versions`);
    return data;
};

export interface AssetSampleData {
    asset_id: number;
    rows: any[];
    count: number;
}

export const getAssetSampleData = async (connectionId: number, assetId: number, limit: number = 100) => {
    const { data } = await api.get<AssetSampleData>(`/connections/${connectionId}/assets/${assetId}/sample`, { params: { limit } });
    return data;
};

// Pipelines
export interface PipelineNode {
    id?: number;
    node_id: string;
    name: string;
    description?: string;
    operator_type: OperatorType | string;
    operator_class: string;
    config: Record<string, any>;
    order_index: number;
    source_asset_id?: number;
    destination_asset_id?: number;
    max_retries?: number;
    timeout_seconds?: number;
    position?: { x: number; y: number }; 
}

export interface PipelineEdge {
    id?: number;
    from_node_id: string;
    to_node_id: string;
    edge_type?: string;
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

// Dashboard
export interface ThroughputDataPoint {
    timestamp: string;
    success_count: number;
    failure_count: number;
}

export interface PipelineDistribution {
    status: string;
    count: number;
}

export interface RecentActivity {
    id: number;
    pipeline_id: number;
    pipeline_name: string;
    status: string;
    started_at?: string;
    completed_at?: string;
    duration_seconds?: number;
    user_avatar?: string;
}

export interface DashboardStats {
    total_pipelines: number;
    active_pipelines: number;
    total_jobs_24h: number;
    success_rate_24h: number;
    avg_duration_24h: number;
    total_connections: number;
    throughput: ThroughputDataPoint[];
    pipeline_distribution: PipelineDistribution[];
    recent_activity: RecentActivity[];
}

export const getDashboardStats = async () => {
    const { data } = await api.get<DashboardStats>('/dashboard/stats');
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

export const deletePipeline = async (id: number) => {
    await api.delete(`/pipelines/${id}`);
};

export interface PipelineVersionCreate {
    config_snapshot?: Record<string, any>;
    change_summary?: Record<string, any>;
    version_notes?: string;
    nodes: PipelineNode[];
    edges: PipelineEdge[];
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

export const cancelJob = async (id: number) => {
    const { data } = await api.post<Job>(`/jobs/${id}/cancel`);
    return data;
};

export const retryJob = async (id: number) => {
    const { data } = await api.post<Job>(`/jobs/${id}/retry`);
    return data;
};

// Alerts
export interface AlertConfig {
    id: number;
    name: string;
    description?: string;
    alert_type: string;
    delivery_method: string;
    recipient: string;
    enabled: boolean;
    created_at: string;
}

export interface AlertConfigUpdate {
    enabled?: boolean;
    recipient?: string;
}

export const getAlertConfigs = async () => {
    const { data } = await api.get<AlertConfig[]>('/alerts');
    return data;
};

export const updateAlertConfig = async (id: number, payload: AlertConfigUpdate) => {
    const { data } = await api.patch<AlertConfig>(`/alerts/${id}`, payload);
    return data;
};

// API Keys
export interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  scopes?: string;
  created_at: string;
  expires_at?: string;
  last_used_at?: string;
  is_active: boolean;
}

export interface ApiKeyCreate {
  name: string;
  expires_in_days?: number;
  scopes?: string;
}

export interface ApiKeyCreated extends ApiKey {
  key: string; 
}

export const getApiKeys = async () => {
  const { data } = await api.get<ApiKey[]>('/api-keys');
  return data;
};

export const createApiKey = async (payload: ApiKeyCreate) => {
  const { data } = await api.post<ApiKeyCreated>('/api-keys', payload);
  return data;
};

export const revokeApiKey = async (id: number) => {
  const { data } = await api.delete<ApiKey>(`/api-keys/${id}`);
  return data;
};