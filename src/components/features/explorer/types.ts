import { type QueryResponse } from "@/lib/api";

export interface QueryTab {
    id: string;
    title: string;
    query: string;
    language: string;
    results: QueryResponse | null;
}

export interface HistoryItem {
    id: string;
    query: string;
    timestamp: number;
    connectionName: string;
    duration?: number;
    rowCount?: number;
}

export const SUPPORTED_EXPLORER_TYPES = [
    'postgresql', 'mysql', 'mariadb', 'mssql', 'oracle', 'sqlite',
    'snowflake', 'bigquery', 'redshift', 'databricks', 'mongodb'
];
