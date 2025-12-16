import { api } from '../lib/api';

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
  key: string; // The full key, returned only once
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
