/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConnections, createConnection, deleteConnection, testConnection, type ConnectionCreate } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    Plus, Trash2, Database, ExternalLink, Server,
    CheckCircle2, XCircle, HardDrive, Cloud,
    Globe, Lock, FileJson, ShieldCheck, Search,
    LayoutGrid, List, MoreHorizontal, Plug, Pencil,
    RefreshCw
} from 'lucide-react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Metadata & Schemas ---
interface ConnectorMetadata {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: 'Database' | 'Warehouse' | 'File' | 'API';
    popular?: boolean;
}

const CONNECTOR_META: Record<string, ConnectorMetadata> = {
    postgresql: { id: 'postgresql', name: 'PostgreSQL', description: 'Reliable open-source object-relational database.', icon: <Database className="text-blue-500" />, category: 'Database', popular: true },
    mysql: { id: 'mysql', name: 'MySQL', description: 'The world\'s most popular open-source database.', icon: <Database className="text-sky-600" />, category: 'Database' },
    snowflake: { id: 'snowflake', name: 'Snowflake', description: 'Cloud-native data warehouse.', icon: <Cloud className="text-cyan-400" />, category: 'Warehouse', popular: true },
    mongodb: { id: 'mongodb', name: 'MongoDB', description: 'Source-available cross-platform document database.', icon: <FileJson className="text-emerald-500" />, category: 'Database' },
    local_file: { id: 'local_file', name: 'Local File', description: 'Read/Write CSV, JSON, and Parquet files.', icon: <HardDrive className="text-orange-500" />, category: 'File' },
    s3: { id: 's3', name: 'Amazon S3', description: 'Scalable object storage in the AWS cloud.', icon: <Cloud className="text-yellow-500" />, category: 'File', popular: true },
    rest_api: { id: 'rest_api', name: 'REST API', description: 'Connect to any HTTP/REST endpoint.', icon: <Globe className="text-purple-500" />, category: 'API' },
};

const CONNECTOR_CONFIG_SCHEMAS: Record<string, any> = {
    postgresql: {
        fields: [
            { name: "host", label: "Host", type: "text", required: true, placeholder: "localhost" },
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
    rest_api: {
        fields: [
            { name: "base_url", label: "Base URL", type: "text", required: true, placeholder: "https://api.example.com/v1" },
            {
                name: "auth_type", label: "Authentication", type: "select", required: true, defaultValue: "none",
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
    // Fallbacks
    snowflake: { fields: [] }, s3: { fields: [] }, mongodb: { fields: [] }, local_file: { fields: [] }
};

const connectionSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    type: z.string().min(1, "Connection type is required"),
    description: z.string().optional(),
    config: z.record(z.string(), z.any()),
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

// --- Status Badge Component ---
const ConnectionStatusBadge = ({ status }: { status: string }) => {
    const variants: any = {
        active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
        error: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
        inactive: "bg-muted text-muted-foreground border-border",
        testing: "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse",
    };

    const icons: any = {
        active: <CheckCircle2 className="w-3 h-3 mr-1.5" />,
        error: <XCircle className="w-3 h-3 mr-1.5" />,
        inactive: <Plug className="w-3 h-3 mr-1.5" />,
        testing: <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
    };

    const s = (status || 'inactive').toLowerCase();
    const style = variants[s] || variants.inactive;
    const icon = icons[s] || icons.inactive;

    return (
        <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border", style)}>
            {icon} {status || 'Unknown'}
        </Badge>
    );
};

// --- MAIN PAGE ---
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
            toast.success('Connection deleted');
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
        toast('Are you sure you want to delete this connection?', {
            action: {
                label: 'Delete',
                onClick: () => deleteMutation.mutate(id)
            },
            cancel: { label: 'Cancel', onClick: () => { } },
            duration: 5000,
        });
    };

    const handleTest = async (id: number) => {
        setTestingId(id);
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // UX delay
            const res = await testConnection(id, {});
            if (res.success) toast.success("Connection Healthy", { icon: <ShieldCheck className="text-emerald-500" /> });
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

    if (error) return <div className="p-8 text-destructive">Failed to load connections.</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] gap-4 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between shrink-0 px-1">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        Connections
                    </h2>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                        Manage your data sources and destinations.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Button size="sm" className="shadow-md shadow-primary/20" onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> New Connection
                    </Button>
                    <DialogContent className="max-w-5xl h-[650px] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
                        <CreateConnectionFlow
                            initialData={editingConnection}
                            onClose={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex flex-col bg-card rounded-lg border shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="p-3 border-b bg-muted/20 flex gap-3 items-center justify-between shrink-0">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search connections..."
                            className="pl-8 h-9 text-sm bg-background"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-background border rounded-md p-0.5">
                            <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-sm", viewMode === 'grid' && "bg-muted shadow-sm")} onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-sm", viewMode === 'list' && "bg-muted shadow-sm")} onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-border">
                    <div className={cn("grid gap-4", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)
                        ) : filteredConnections.length === 0 ? (
                            <div className="col-span-full h-[400px] flex flex-col items-center justify-center text-muted-foreground bg-muted/5 rounded-lg border border-dashed">
                                <Plug className="h-10 w-10 opacity-20 mb-4" />
                                <h3 className="text-lg font-medium text-foreground">No connections found</h3>
                                <p className="text-sm max-w-xs text-center mt-1">Connect your first database or API.</p>
                                <Button variant="outline" className="mt-6" onClick={handleCreate}>Add Connection</Button>
                            </div>
                        ) : (
                            filteredConnections.map((conn) => {
                                const meta = CONNECTOR_META[conn.type] || { icon: <Server className="text-muted-foreground" />, name: conn.type };
                                // Conditional Border Color based on status
                                const statusColor = conn.status === 'error' ? 'hover:border-rose-500/50' : 'hover:border-primary/50';

                                return (
                                    <div
                                        key={conn.id}
                                        className={cn(
                                            "group relative flex flex-col bg-background border transition-all hover:shadow-md",
                                            statusColor,
                                            viewMode === 'grid' ? "rounded-xl p-5" : "rounded-lg p-4 flex-row items-center gap-4"
                                        )}
                                    >
                                        <div className={cn("flex justify-between items-start", viewMode === 'list' && "w-[250px] shrink-0")}>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                    {React.cloneElement(meta.icon as React.ReactElement<any>, { className: "h-6 w-6" })}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-sm truncate max-w-[140px]">{conn.name}</h3>
                                                    <p className="text-xs text-muted-foreground capitalize">{meta.name}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={cn("flex-1", viewMode === 'grid' ? "mt-4 mb-4" : "px-4 border-l")}>
                                            {viewMode === 'grid' && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 h-8 leading-relaxed">
                                                    {conn.description || "No description provided."}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <ConnectionStatusBadge status={conn.status || 'active'} />
                                                <span className="text-[10px] text-muted-foreground font-mono">ID: {conn.id}</span>
                                            </div>
                                        </div>

                                        <div className={cn("flex items-center gap-2", viewMode === 'grid' ? "pt-3 border-t mt-auto" : "ml-auto border-l pl-4")}>
                                            <Button
                                                variant="ghost" size="sm"
                                                className={cn("text-xs h-7 hover:bg-muted", viewMode === 'grid' && "flex-1")}
                                                onClick={() => handleTest(conn.id)}
                                                disabled={testingId === conn.id}
                                            >
                                                {testingId === conn.id ? <div className="animate-spin mr-2">⟳</div> : <ExternalLink className="mr-2 h-3 w-3" />}
                                                Test
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="text-xs" onClick={() => handleEdit(conn)}>
                                                        <Pencil className="mr-2 h-3 w-3" /> Edit Configuration
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-xs text-destructive focus:text-destructive" onClick={() => handleDelete(conn.id)}>
                                                        <Trash2 className="mr-2 h-3 w-3" /> Delete Connection
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

// --- Create/Edit Flow ---
const CreateConnectionFlow = ({ initialData, onClose }: { initialData?: any, onClose: () => void }) => {
    const isEditMode = !!initialData;
    const [step, setStep] = useState<'select' | 'configure'>('select');
    const [selectedType, setSelectedType] = useState<string | null>(initialData?.type || null);
    const queryClient = useQueryClient();

    // If we have initial data, skip selection step
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
        mutationFn: (data: ConnectionFormValues) =>
            createConnection(data as ConnectionCreate),
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
        // Load defaults only if creating fresh
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

    // Step 1: Select Type
    if (step === 'select' && !isEditMode) {
        return (
            <div className="flex flex-col h-full bg-background">
                <DialogHeader className="px-6 py-4 border-b bg-muted/10 shrink-0">
                    <DialogTitle>Select Connector</DialogTitle>
                    <DialogDescription>Choose a source or destination to get started.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Object.entries(CONNECTOR_META).map(([key, meta]) => (
                            <button
                                key={key}
                                onClick={() => handleSelect(key)}
                                className="group flex flex-col items-center gap-3 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all text-center relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 transition-colors z-10">
                                    {React.cloneElement(meta.icon as React.ReactElement<any>, { className: "h-8 w-8" })}
                                </div>
                                <div className="z-10">
                                    <h4 className="font-semibold text-sm">{meta.name}</h4>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{meta.category}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Configure
    const meta = selectedType ? CONNECTOR_META[selectedType] : null;
    const schema = selectedType ? CONNECTOR_CONFIG_SCHEMAS[selectedType] : null;

    return (
        <div className="flex h-full">
            <div className="w-[280px] bg-muted/30 border-r p-6 hidden md:flex flex-col gap-6 shrink-0">
                <div>
                    {!isEditMode && (
                        <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground" onClick={() => setStep('select')}>
                            &larr; Back to Selection
                        </Button>
                    )}
                    <div className="h-14 w-14 bg-background border rounded-xl flex items-center justify-center mb-4 shadow-sm">
                        {React.cloneElement(meta?.icon as React.ReactElement<any>, { className: "h-8 w-8" })}
                    </div>
                    <h3 className="text-xl font-bold">{isEditMode ? 'Edit' : 'Configure'} {meta?.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{meta?.description}</p>
                </div>
                <div className="mt-auto space-y-4">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
                        <strong>Security Note:</strong> Credentials are encrypted at rest using AES-256 before storage.
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full bg-background min-w-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle>{isEditMode ? `Edit ${initialData.name}` : 'Connection Details'}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6">
                    <FormProvider {...form}>
                        <form id="conn-form" onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6 max-w-lg mx-auto">
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs">1</span>
                                    General
                                </h4>
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl><Input {...field} placeholder="e.g. Production DB" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl><Input {...field} placeholder="Optional description" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <div className="border-t border-dashed" />
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs">2</span>
                                    Config
                                </h4>
                                {schema?.fields?.map((field: any) => {
                                    if (field.dependency) {
                                        const depVal = configValues[field.dependency.field];
                                        if (depVal !== field.dependency.value) return null;
                                    }
                                    return (
                                        <FormField key={field.name} control={form.control} name={`config.${field.name}`} render={({ field: f }) => (
                                            <FormItem>
                                                <FormLabel>{field.label}</FormLabel>
                                                <FormControl>
                                                    {field.type === 'select' ? (
                                                        <Select onValueChange={f.onChange} defaultValue={f.value}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {field.options?.map((o: any) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <div className="relative">
                                                            <Input {...f} type={field.type} placeholder={field.placeholder} className={field.type === 'password' ? 'pl-9' : ''} />
                                                            {field.type === 'password' && <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />}
                                                        </div>
                                                    )}
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    );
                                })}
                            </div>
                        </form>
                    </FormProvider>
                </div>
                <DialogFooter className="p-4 border-t bg-muted/5 shrink-0">
                    <Button variant="ghost" onClick={onClose} className="mr-auto">Cancel</Button>
                    <Button form="conn-form" type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <div className="animate-spin mr-2">⟳</div>}
                        {isEditMode ? 'Update Connection' : 'Save Connection'}
                    </Button>
                </DialogFooter>
            </div>
        </div>
    );
}