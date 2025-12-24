/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
    Database, Cloud, HardDrive, Globe, FileJson, Server, Code
} from 'lucide-react';

export interface ConnectorMetadata {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: 'Database' | 'Warehouse' | 'File' | 'API' | 'Generic';
    color: string;
    popular?: boolean;
}

export const SafeIcon = ({ icon, className }: { icon: React.ReactNode, className?: string }) => {
    if (React.isValidElement(icon)) {
        return React.cloneElement(icon as React.ReactElement<any>, { className });
    }
    return <Server className={className} />;
};

export const CONNECTOR_META: Record<string, ConnectorMetadata> = {
    postgresql: { 
        id: 'postgresql', name: 'PostgreSQL', description: 'Advanced open-source relational database.', 
        icon: <Database />, category: 'Database', color: "text-blue-500 bg-blue-500/10 border-blue-500/20", popular: true 
    },
    mysql: { 
        id: 'mysql', name: 'MySQL', description: 'The world\'s most popular open-source database.', 
        icon: <Database />, category: 'Database', color: "text-sky-500 bg-sky-500/10 border-sky-500/20"
    },
    mariadb: { 
        id: 'mariadb', name: 'MariaDB', description: 'High performance open-source database.', 
        icon: <Database />, category: 'Database', color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
    },
    mssql: { 
        id: 'mssql', name: 'SQL Server', description: 'Microsoft relational database management system.', 
        icon: <Database />, category: 'Database', color: "text-red-500 bg-red-500/10 border-red-500/20"
    },
    oracle: { 
        id: 'oracle', name: 'Oracle DB', description: 'Multi-model database management system.', 
        icon: <Database />, category: 'Database', color: "text-red-600 bg-red-600/10 border-red-600/20"
    },
    sqlite: { 
        id: 'sqlite', name: 'SQLite', description: 'C-language library embedded database.', 
        icon: <Database />, category: 'Database', color: "text-blue-400 bg-blue-400/10 border-blue-400/20"
    },
    snowflake: { 
        id: 'snowflake', name: 'Snowflake', description: 'Cloud-native data warehousing platform.', 
        icon: <Cloud />, category: 'Warehouse', color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", popular: true 
    },
    redshift: { 
        id: 'redshift', name: 'Redshift', description: 'Fast, simple, cost-effective data warehousing.', 
        icon: <Cloud />, category: 'Warehouse', color: "text-purple-600 bg-purple-600/10 border-purple-600/20"
    },
    bigquery: { 
        id: 'bigquery', name: 'Google BigQuery', description: 'Serverless enterprise data warehouse.', 
        icon: <Cloud />, category: 'Warehouse', color: "text-blue-600 bg-blue-600/10 border-blue-600/20"
    },
    mongodb: { 
        id: 'mongodb', name: 'MongoDB', description: 'Source-available document database.', 
        icon: <FileJson />, category: 'Database', color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    },
    redis: { 
        id: 'redis', name: 'Redis', description: 'In-memory key-value store.', 
        icon: <Database />, category: 'Database', color: "text-red-600 bg-red-600/10 border-red-600/20"
    },
    local_file: { 
        id: 'local_file', name: 'Local File', description: 'Read CSV, JSON, and Parquet from disk.', 
        icon: <HardDrive />, category: 'File', color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    },
    s3: { 
        id: 's3', name: 'Amazon S3', description: 'Scalable object storage in AWS.', 
        icon: <Cloud />, category: 'File', color: "text-orange-500 bg-orange-500/10 border-orange-500/20", popular: true 
    },
    rest_api: { 
        id: 'rest_api', name: 'REST API', description: 'Connect to generic HTTP endpoints.', 
        icon: <Globe />, category: 'API', color: "text-purple-500 bg-purple-500/10 border-purple-500/20"
    },
    custom_script: {
        id: 'custom_script', name: 'Custom Script', description: 'Execute Python or Shell scripts to extract data.',
        icon: <Code />, category: 'Generic', color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
    },
};

export const CONNECTOR_CONFIG_SCHEMAS: Record<string, any> = {
    postgresql: {
        fields: [
            { name: "host", label: "Host Address", type: "text", required: true, placeholder: "e.g. db.example.com" },
            { name: "port", label: "Port", type: "number", required: true, defaultValue: 5432 },
            { name: "database", label: "Database Name", type: "text", required: true },
            { name: "db_schema", label: "Schema", type: "text", defaultValue: "public" },
            { name: "username", label: "Username", type: "text", required: true },
            { name: "password", label: "Password", type: "password", required: true },
        ]
    },
    mysql: {
        fields: [
            { name: "host", label: "Host", type: "text", required: true, placeholder: "localhost" },
            { name: "port", label: "Port", type: "number", required: true, defaultValue: 3306 },
            { name: "database", label: "Database Name", type: "text", required: true },
            { name: "db_schema", label: "Schema", type: "text", defaultValue: "public" },
            { name: "username", label: "Username", type: "text", required: true },
            { name: "password", label: "Password", type: "password", required: true },
        ]
    },
    mariadb: {
        fields: [
            { name: "host", label: "Host", type: "text", required: true, placeholder: "localhost" },
            { name: "port", label: "Port", type: "number", required: true, defaultValue: 3306 },
            { name: "database", label: "Database Name", type: "text", required: true },
            { name: "db_schema", label: "Schema", type: "text", defaultValue: "public" },
            { name: "username", label: "Username", type: "text", required: true },
            { name: "password", label: "Password", type: "password", required: true },
        ]
    },
    mssql: {
        fields: [
            { name: "host", label: "Host", type: "text", required: true, placeholder: "sqlserver.example.com" },
            { name: "port", label: "Port", type: "number", required: true, defaultValue: 1433 },
            { name: "database", label: "Database Name", type: "text", required: true },
            { name: "db_schema", label: "Schema", type: "text", defaultValue: "dbo" },
            { name: "username", label: "Username", type: "text", required: true },
            { name: "password", label: "Password", type: "password", required: true },
        ]
    },
    oracle: {
        fields: [
            { name: "host", label: "Host", type: "text", required: true, placeholder: "oracle.example.com" },
            { name: "port", label: "Port", type: "number", required: true, defaultValue: 1521 },
            { name: "database", label: "Service Name / SID", type: "text", required: true },
            { name: "db_schema", label: "Schema", type: "text" },
            { name: "username", label: "Username", type: "text", required: true },
            { name: "password", label: "Password", type: "password", required: true },
        ]
    },
    redshift: {
        fields: [
            { name: "host", label: "Host Address", type: "text", required: true, placeholder: "cluster.abc.region.redshift.amazonaws.com" },
            { name: "port", label: "Port", type: "number", required: true, defaultValue: 5439 },
            { name: "database", label: "Database Name", type: "text", required: true },
            { name: "db_schema", label: "Schema", type: "text", defaultValue: "public" },
            { name: "username", label: "Username", type: "text", required: true },
            { name: "password", label: "Password", type: "password", required: true },
        ]
    },
    sqlite: {
        fields: [
            { name: "database_path", label: "Database Path", type: "text", required: true, placeholder: "/path/to/database.db" }
        ]
    },
    mongodb: {
        fields: [
            { name: "connection_string", label: "Connection String (URI)", type: "text", placeholder: "mongodb://user:pass@host:27017/db" },
            { name: "host", label: "Host", type: "text", placeholder: "localhost", defaultValue: "localhost" },
            { name: "port", label: "Port", type: "number", defaultValue: 27017 },
            { name: "database", label: "Database Name", type: "text", required: true },
            { name: "username", label: "Username", type: "text" },
            { name: "password", label: "Password", type: "password" },
            { name: "auth_source", label: "Auth Source", type: "text", defaultValue: "admin" },
        ]
    },
    s3: {
        fields: [
            { name: "bucket", label: "Bucket Name", type: "text", required: true },
            { name: "region_name", label: "AWS Region", type: "text", defaultValue: "us-east-1" },
            { name: "aws_access_key_id", label: "Access Key ID", type: "text" },
            { name: "aws_secret_access_key", label: "Secret Access Key", type: "password" },
            { name: "endpoint_url", label: "Custom Endpoint URL", type: "text", placeholder: "https://s3.amazonaws.com" },
        ]
    },
    redis: {
        fields: [
            { name: "host", label: "Host", type: "text", required: true, defaultValue: "localhost" },
            { name: "port", label: "Port", type: "number", required: true, defaultValue: 6379 },
            { name: "password", label: "Password", type: "password" },
            { name: "db", label: "DB Index", type: "number", defaultValue: 0 },
            { name: "decode_responses", label: "Decode Responses", type: "select", options: [{label: "True", value: true}, {label: "False", value: false}], defaultValue: true }
        ]
    },
    snowflake: {
        fields: [
            { name: "user", label: "User", type: "text", required: true },
            { name: "password", label: "Password", type: "password", required: true },
            { name: "account", label: "Account", type: "text", required: true, placeholder: "xy12345.us-east-1" },
            { name: "warehouse", label: "Warehouse", type: "text", required: true },
            { name: "database", label: "Database", type: "text", required: true },
            { name: "schema_name", label: "Schema", type: "text", defaultValue: "PUBLIC" },
            { name: "role", label: "Role", type: "text" },
        ]
    },
    bigquery: {
        fields: [
            { name: "project_id", label: "Project ID", type: "text", required: true },
            { name: "dataset_id", label: "Dataset ID", type: "text", required: true },
            { name: "credentials_json", label: "Service Account JSON", type: "textarea", placeholder: "{ ... }" },
            { name: "credentials_path", label: "Key File Path", type: "text" },
        ]
    },
    rest_api: {
        fields: [
            { name: "base_url", label: "Base URL", type: "text", required: true, placeholder: "https://api.example.com/v1" },
            {
                name: "auth_type", label: "Authentication Method", type: "select", required: true, defaultValue: "none",
                options: [
                    { label: "No Auth", value: "none" },
                    { label: "Bearer Token", value: "bearer" },
                    { label: "Basic Auth", value: "basic" },
                    { label: "API Key", value: "api_key" },
                ]
            },
            { name: "auth_token", label: "Bearer Token", type: "password", required: true, dependency: { field: "auth_type", value: "bearer" } },
            { name: "auth_username", label: "Username", type: "text", required: true, dependency: { field: "auth_type", value: "basic" } },
            { name: "auth_password", label: "Password", type: "password", required: true, dependency: { field: "auth_type", value: "basic" } },
            { name: "api_key_name", label: "API Key Name", type: "text", defaultValue: "X-API-Key", dependency: { field: "auth_type", value: "api_key" } },
            { name: "api_key_value", label: "API Key Value", type: "password", dependency: { field: "auth_type", value: "api_key" } },
            { 
                name: "api_key_in", label: "API Key Location", type: "select", defaultValue: "header",
                options: [{label: "Header", value: "header"}, {label: "Query Param", value: "query"}],
                dependency: { field: "auth_type", value: "api_key" } 
            },
            { name: "timeout", label: "Timeout (seconds)", type: "number", defaultValue: 30.0 },
        ]
    },
    local_file: { 
        fields: [
            { name: "base_path", label: "Base Path", type: "text", required: true, placeholder: "/data/files" }
        ] 
    },
    custom_script: {
        fields: [
            { name: "base_path", label: "Base Script Path (Optional)", type: "text", placeholder: "/opt/scripts" },
            { name: "env_vars", label: "Global Env Vars (JSON)", type: "textarea", placeholder: "{\"API_KEY\": \"...\"}" }
        ]
    }
};
