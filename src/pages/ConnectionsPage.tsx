/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConnections, createConnection, deleteConnection, testConnection, type ConnectionCreate } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
    Plus, Trash2, Database, ExternalLink, Server,
    CheckCircle2, XCircle, HardDrive, Cloud,
    Globe, Lock, FileJson, ShieldCheck, Search,
    LayoutGrid, List, Plug, Pencil,
    RefreshCw, Link as LinkIcon, Settings2} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Form,
    FormControl, 
    FormField, 
    FormItem, 
    FormMessage 
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ConnectorMetadata {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: 'Database' | 'Warehouse' | 'File' | 'API';
    color: string;
    popular?: boolean;
}

const SafeIcon = ({ icon, className }: { icon: React.ReactNode, className?: string }) => {
    if (React.isValidElement(icon)) {
        return React.cloneElement(icon as React.ReactElement<any>, { className });
    }
    return <Server className={className} />;
};

const CONNECTOR_META: Record<string, ConnectorMetadata> = {
    postgresql: { 
        id: 'postgresql', name: 'PostgreSQL', description: 'Advanced open-source relational database.', 
        icon: <Database />, category: 'Database', color: "text-blue-500 bg-blue-500/10 border-blue-500/20", popular: true 
    },
    mysql: { 
        id: 'mysql', name: 'MySQL', description: 'The world\'s most popular open-source database.', 
        icon: <Database />, category: 'Database', color: "text-sky-500 bg-sky-500/10 border-sky-500/20" 
    },
    snowflake: { 
        id: 'snowflake', name: 'Snowflake', description: 'Cloud-native data warehousing platform.', 
        icon: <Cloud />, category: 'Warehouse', color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", popular: true 
    },
    mongodb: { 
        id: 'mongodb', name: 'MongoDB', description: 'Source-available document database.', 
        icon: <FileJson />, category: 'Database', color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" 
    },
    local_file: { 
        id: 'local_file', name: 'Local File', description: 'Read CSV, JSON, and Parquet from disk.', 
        icon: <HardDrive />, category: 'File', color: "text-amber-500 bg-amber-500/10 border-amber-500/20" 
    },
    s3: { 
        id: 's3', name: 'Amazon S3', description: 'Scalable object storage in AWS.', 
        icon: <Cloud />, category: 'File', color: "text-orange-500 bg-orange-500/10 border-orange-500/20", popular: true 
    },
    redis: { 
        id: 'redis', name: 'Redis', description: 'In-memory key-value store.', 
        icon: <Database />, category: 'Database', color: "text-red-600 bg-red-600/10 border-red-600/20" 
    },
    bigquery: { 
        id: 'bigquery', name: 'Google BigQuery', description: 'Serverless enterprise data warehouse.', 
        icon: <Cloud />, category: 'Warehouse', color: "text-blue-600 bg-blue-600/10 border-blue-600/20" 
    },
    rest_api: { 
        id: 'rest_api', name: 'REST API', description: 'Connect to generic HTTP endpoints.', 
        icon: <Globe />, category: 'API', color: "text-purple-500 bg-purple-500/10 border-purple-500/20" 
    },
};

const CONNECTOR_CONFIG_SCHEMAS: Record<string, any> = {
    postgresql: {
        fields: [
            { name: "host", label: "Host Address", type: "text", required: true, placeholder: "e.g. db.example.com" },
            { name: "port", label: "Port", type: "number", required: true, defaultValue: 5432 },
            { name: "database", label: "Database Name", type: "text", required: true },
            { name: "username", label: "Username", type: "text", required: true },
            { name: "password", label: "Password", type: "password", required: true },
            { name: "ssl", label: "SSL Mode", type: "select", options: [{ label: "Disable", value: "disable" }, { label: "Require", value: "require" }], defaultValue: "require" }
        ]
    },
    mysql: {
        fields: [
            { name: "host", label: "Host", type: "text", required: true, placeholder: "localhost" },
            { name: "port", label: "Port", type: "number", required: true, defaultValue: 3306 },
            { name: "database", label: "Database Name", type: "text", required: true },
            { name: "username", label: "Username", type: "text", required: true },
            { name: "password", label: "Password", type: "password", required: true },
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
            { name: "token", label: "Bearer Token", type: "password", required: true, dependency: { field: "auth_type", value: "bearer" } },
            { name: "username", label: "Username", type: "text", required: true, dependency: { field: "auth_type", value: "basic" } },
            { name: "password", label: "Password", type: "password", required: true, dependency: { field: "auth_type", value: "basic" } },
        ]
    },
    local_file: { fields: [] }
};

const connectionSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    type: z.string().min(1, "Connection type is required"),
    description: z.string().optional(),
    config: z.record(z.string(), z.any()),
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

// --- Components ---

const ConnectionStatusBadge = ({ status }: { status: string }) => {
    const config = useMemo(() => {
        const s = (status || 'inactive').toLowerCase();
        if (s === 'active' || s === 'connected') return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 };
        if (s === 'error' || s === 'failed') return { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", icon: XCircle };
        if (s === 'testing') return { color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", icon: RefreshCw, animate: true };
        return { color: "text-muted-foreground", bg: "bg-muted", border: "border-border", icon: Plug };
    }, [status]);

    const Icon = config.icon;

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all",
            config.color, config.bg, config.border
        )}>
            <Icon className={cn("w-3 h-3", config.animate && "animate-spin")} />
            {status || 'Unknown'}
        </span>
    );
};

export const ConnectionsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingConnection, setEditingConnection] = useState<any | null>(null);
    const [testingId, setTestingId] = useState<number | null>(null);
    const [filter, setFilter] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { data: connections, isLoading, error } = useQuery({
        queryKey: ['connections'],
        queryFn: getConnections,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteConnection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            toast.success('Connection deleted successfully');
        },
    });

    const handleEdit = (connection: any) => {
        setEditingConnection(connection);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingConnection(null);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        toast('Delete this connection?', {
            description: "Pipelines using this connection may break.",
            action: {
                label: 'Delete',
                onClick: () => deleteMutation.mutate(id)
            },
            cancel: { label: 'Cancel', onClick: () => { } },
        });
    };

    const handleTest = async (id: number) => {
        setTestingId(id);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const res = await testConnection(id, {});
            if (res.success) toast.success("Connection Healthy", { icon: <ShieldCheck className="h-4 w-4 text-emerald-500" /> });
            else toast.error("Connection Failed", { description: res.message });
        } catch (e) {
            toast.error("Network Error during test");
        } finally {
            setTestingId(null);
        }
    };

    const filteredConnections = useMemo(() => {
        if (!connections) return [];
        return connections.filter(c =>
            c.name.toLowerCase().includes(filter.toLowerCase()) ||
            c.type.toLowerCase().includes(filter.toLowerCase())
        );
    }, [connections, filter]);

    if (error) return (
        <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-2">
                <XCircle className="h-8 w-8 text-destructive mx-auto" />
                <h3 className="text-lg font-semibold">Failed to load connections</h3>
                <p className="text-muted-foreground">Please check your network settings.</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg ring-1 ring-primary/20">
                            <LinkIcon className="h-5 w-5 text-primary" />
                        </div>
                        Connections
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage authentication and configuration for your data sources.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Button size="sm" onClick={handleCreate} className="shadow-[0_0_15px_-5px_var(--color-primary)]">
                        <Plus className="mr-2 h-4 w-4" /> New Connection
                    </Button>
                    <DialogContent className="max-w-5xl h-[700px] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl">
                        <CreateConnectionFlow
                            initialData={editingConnection}
                            onClose={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 min-h-0 flex flex-col bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 border-b border-border/50 bg-muted/5 flex gap-4 items-center justify-between shrink-0">
                    <div className="relative w-full max-w-sm group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Filter connections..."
                            className="pl-9 h-9 bg-background/50 focus:bg-background border-muted-foreground/20 focus:border-primary/50"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg p-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-7 w-7 rounded-md transition-all", viewMode === 'grid' ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-muted")} 
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-7 w-7 rounded-md transition-all", viewMode === 'list' ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-muted")} 
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Connection List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className={cn("grid gap-4", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-40 rounded-xl border border-border/40 bg-card p-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-lg" />
                                        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
                                    </div>
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ))
                        ) : filteredConnections.length === 0 ? (
                            <div className="col-span-full h-[400px] flex flex-col items-center justify-center text-center p-8">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                    <div className="relative h-20 w-20 bg-card border rounded-2xl flex items-center justify-center shadow-lg">
                                        <Plug className="h-10 w-10 text-muted-foreground/50" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-2">No Connections</h3>
                                <p className="text-muted-foreground max-w-sm mb-6">
                                    You haven't configured any data sources yet. Create one to start building pipelines.
                                </p>
                                <Button onClick={handleCreate} className="gap-2">
                                    <Plus className="h-4 w-4" /> Add First Connection
                                </Button>
                            </div>
                        ) : (
                            filteredConnections.map((conn) => {
                                const meta = CONNECTOR_META[conn.type] || { 
                                    icon: <Server />, name: conn.type, color: "bg-muted text-muted-foreground" 
                                };
                                const isTesting = testingId === conn.id;

                                return (
                                    <div
                                        key={conn.id}
                                        className={cn(
                                            "group relative flex bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5",
                                            viewMode === 'grid' ? "flex-col rounded-xl p-5" : "flex-row items-center rounded-lg p-4 gap-6"
                                        )}
                                    >
                                        <div className={cn("flex items-start justify-between", viewMode === 'list' && "w-[300px] shrink-0")}>
                                            <div className="flex items-center gap-3.5">
                                                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105", meta.color)}>
                                                    {/* SAFE CLONE usage */}
                                                    <SafeIcon icon={meta.icon} className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-sm text-foreground truncate max-w-40">{conn.name}</h3>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                        <span className="capitalize">{meta.name || conn.type}</span>
                                                        <span className="w-1 h-1 rounded-full bg-border" />
                                                        <span className="font-mono opacity-70">ID: {conn.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={cn("flex-1", viewMode === 'grid' ? "mt-4 mb-4" : "px-4 border-l border-border/40")}>
                                            {viewMode === 'grid' ? (
                                                <p className="text-xs text-muted-foreground line-clamp-2 h-8 leading-relaxed">
                                                    {conn.description || <span className="italic opacity-50">No description provided</span>}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground truncate">{conn.description}</p>
                                            )}
                                            
                                            {viewMode === 'grid' && (
                                                <div className="mt-4 flex items-center gap-2">
                                                    <ConnectionStatusBadge status={conn.status || 'active'} />
                                                </div>
                                            )}
                                        </div>

                                        <div className={cn("flex items-center gap-2", viewMode === 'grid' ? "pt-3 border-t border-border/40 mt-auto" : "ml-auto")}>
                                            <Button
                                                variant="outline" size="sm"
                                                className={cn("text-xs h-8 bg-transparent border-border/50 hover:bg-muted/50", viewMode === 'grid' && "flex-1")}
                                                onClick={() => handleTest(conn.id)}
                                                disabled={isTesting}
                                            >
                                                {isTesting ? (
                                                    <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin text-primary" />
                                                ) : (
                                                    <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                                )}
                                                {isTesting ? "Testing..." : "Test"}
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                                                        <Settings2 className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => handleEdit(conn)}>
                                                        <Pencil className="mr-2 h-3.5 w-3.5" /> Configure
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDelete(conn.id)}>
                                                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Create/Edit Flow Subcomponent ---

const CreateConnectionFlow = ({ initialData, onClose }: { initialData?: any, onClose: () => void }) => {
    const isEditMode = !!initialData;
    const [step, setStep] = useState<'select' | 'configure'>('select');
    const [selectedType, setSelectedType] = useState<string | null>(initialData?.type || null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (initialData?.type) {
            setSelectedType(initialData.type);
            setStep('configure');
        }
    }, [initialData]);

    const form = useForm<ConnectionFormValues>({
        resolver: zodResolver(connectionSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            type: initialData?.type || '',
            config: initialData?.config || {}
        }
    });

    const configValues = form.watch('config') || {};

    const mutation = useMutation({
        mutationFn: (data: ConnectionFormValues) => createConnection(data as ConnectionCreate),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            toast.success(`Connection ${isEditMode ? 'updated' : 'created'} successfully`);
            onClose();
        },
        onError: (_err: any) => toast.error(`Failed to ${isEditMode ? 'update' : 'create'} connection`)
    });

    const handleSelect = (type: string) => {
        setSelectedType(type);
        form.setValue('type', type);
        if (!isEditMode) {
            const schema = CONNECTOR_CONFIG_SCHEMAS[type];
            if (schema) {
                const defaults: any = {};
                schema.fields?.forEach((f: any) => { if (f.defaultValue) defaults[f.name] = f.defaultValue; });
                form.setValue('config', defaults);
            }
        }
        setStep('configure');
    };

    // --- STEP 1: Selection ---
    if (step === 'select' && !isEditMode) {
        return (
            <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl">
                <DialogHeader className="px-8 py-6 border-b border-border/50 shrink-0 bg-muted/5">
                    <DialogTitle className="text-xl">Select a Connector</DialogTitle>
                    <DialogDescription>Choose your data source or destination to proceed.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-8 bg-muted/5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                        {Object.entries(CONNECTOR_META).map(([key, meta]) => (
                            <button
                                key={key}
                                onClick={() => handleSelect(key)}
                                className="group relative flex flex-col items-center gap-4 p-6 rounded-xl border border-border/60 bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all text-center overflow-hidden"
                            >
                                <div className={cn("p-4 rounded-2xl bg-muted/50 group-hover:bg-background transition-colors shadow-inner", meta.color.replace('text-', 'text-opacity-80 text-'))}>
                                    <SafeIcon icon={meta.icon} className="h-8 w-8" />
                                </div>
                                <div className="space-y-1 z-10">
                                    <h4 className="font-semibold text-sm text-foreground">{meta.name}</h4>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{meta.category}</span>
                                </div>
                                {meta.popular && (
                                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary">POPULAR</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- STEP 2: Configuration ---
    const meta = (selectedType && CONNECTOR_META[selectedType]) 
        ? CONNECTOR_META[selectedType] 
        : { name: selectedType || 'Unknown', icon: <Server />, description: 'Custom or deprecated connector type.', color: 'bg-muted text-muted-foreground' };
        
    const schema = selectedType ? CONNECTOR_CONFIG_SCHEMAS[selectedType] : null;

    return (
        <div className="flex h-full">
            {/* Sidebar for Dialog */}
            <div className="w-[280px] bg-muted/10 border-r border-border/50 p-6 hidden md:flex flex-col gap-6 shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-b from-transparent to-muted/20 pointer-events-none" />
                
                <div className="z-10">
                    {!isEditMode && (
                        <Button 
                            variant="link" 
                            size="sm" 
                            className="-ml-4 mb-6 text-muted-foreground hover:text-primary" 
                            onClick={() => setStep('select')}
                        >
                            &larr; Change Connector
                        </Button>
                    )}
                    <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-5 border shadow-sm", meta?.color)}>
                        {/* SAFE CLONE usage */}
                        <SafeIcon icon={meta.icon} className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">{isEditMode ? 'Edit' : 'Configure'} {meta?.name}</h3>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{meta?.description}</p>
                </div>

                <div className="mt-auto space-y-4 z-10">
                     <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-600/80 dark:text-blue-400">
                        <div className="flex items-center gap-2 font-semibold mb-1">
                            <ShieldCheck className="h-3.5 w-3.5" /> Secure Storage
                        </div>
                        Credentials are encrypted at rest using AES-256 GCM.
                    </div>
                </div>
            </div>

            {/* Form Area */}
            <div className="flex-1 flex flex-col h-full bg-background/50 backdrop-blur-sm min-w-0">
                <DialogHeader className="px-8 py-6 border-b border-border/50 shrink-0">
                    <DialogTitle className="text-lg">Connection Details</DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-8">
                    {/* SAFE GUARD: Form Provider wraps everything */}
                    <Form {...form}>
                        <form id="conn-form" onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-8 max-w-lg mx-auto">
                            
                            {/* General Section */}
                            <div className="space-y-5">
                                {/* Use standard HTML h4 for headers, NOT FormLabel */}
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px]">1</span>
                                    General Information
                                </h4>
                                <div className="grid gap-5 pl-7">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            {/* FIX: Using Label primitive instead of FormLabel to prevent context crash */}
                                            <Label className="text-sm font-medium">Connection Name</Label>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Production DB" className="bg-background/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            {/* FIX: Using Label primitive */}
                                            <Label className="text-sm font-medium">Description</Label>
                                            <FormControl>
                                                <Input {...field} placeholder="Optional context" className="bg-background/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            <div className="h-px bg-border/50" />

                            {/* Config Section */}
                            <div className="space-y-5">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px]">2</span>
                                    Credentials
                                </h4>
                                <div className="grid gap-5 pl-7">
                                    {schema?.fields?.map((field: any) => {
                                        // Dependency Check
                                        if (field.dependency) {
                                            const depVal = configValues[field.dependency.field];
                                            if (depVal !== field.dependency.value) return null;
                                        }
                                        return (
                                            <FormField key={field.name} control={form.control} name={`config.${field.name}`} render={({ field: f }) => (
                                                <FormItem>
                                                    {/* FIX: Using Label primitive */}
                                                    <Label className="text-sm font-medium">{field.label}</Label>
                                                    <FormControl>
                                                        {field.type === 'select' ? (
                                                            <Select onValueChange={f.onChange} defaultValue={f.value}>
                                                                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {field.options?.map((o: any) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <div className="relative">
                                                                <Input 
                                                                    {...f} 
                                                                    type={field.type} 
                                                                    placeholder={field.placeholder} 
                                                                    className={cn("bg-background/50", field.type === 'password' && 'pl-9')} 
                                                                />
                                                                {field.type === 'password' && (
                                                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        );
                                    })}
                                    {(!schema?.fields || schema.fields.length === 0) && (
                                        <div className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded-md border border-border/50">
                                            No additional configuration required for this connector type.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>

                <DialogFooter className="p-6 border-t border-border/50 bg-muted/5 shrink-0 flex items-center justify-between">
                    <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">Cancel</Button>
                    <Button form="conn-form" type="submit" disabled={mutation.isPending} className="px-6 shadow-lg shadow-primary/20">
                        {mutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        {isEditMode ? 'Update Connection' : 'Save Connection'}
                    </Button>
                </DialogFooter>
            </div>
        </div>
    );
};