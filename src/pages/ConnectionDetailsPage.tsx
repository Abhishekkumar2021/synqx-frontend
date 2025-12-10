/* eslint-disable react-hooks/set-state-in-render */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getConnection,
    testConnection,
    discoverAssets,
    getConnectionAssets,
    discoverAssetSchema,
    getAssetSchemaVersions,
    type Asset,
    type ConnectionTestResult} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft, Database, RefreshCw, Search,
    Table as TableIcon, FileJson, 
    MoreHorizontal, ShieldCheck, AlertTriangle,
    Clock, Activity, Lock, 
    CheckCircle2} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// --- Main Page ---
export const ConnectionDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const connectionId = parseInt(id!);
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('assets');

    // Queries
    const { data: connection, isLoading: loadingConnection } = useQuery({
        queryKey: ['connection', connectionId],
        queryFn: () => getConnection(connectionId)
    });

    const { data: assets, isLoading: loadingAssets } = useQuery({
        queryKey: ['assets', connectionId],
        queryFn: () => getConnectionAssets(connectionId)
    });

    // Mutations
    const testMutation = useMutation({
        mutationFn: () => testConnection(connectionId),
        onSuccess: (data: ConnectionTestResult) => {
            if (data.success) toast.success("Connection Healthy", { icon: <ShieldCheck className="text-emerald-500" /> });
            else toast.error("Connection Failed", { description: data.message });
        },
        onError: () => toast.error("Test execution failed")
    });

    const discoverMutation = useMutation({
        mutationFn: () => discoverAssets(connectionId),
        onSuccess: (data: any) => {
            toast.success(`Discovery Complete`, { description: `Found ${data.length || 0} new assets` });
            queryClient.invalidateQueries({ queryKey: ['assets', connectionId] });
        },
        onError: () => toast.error("Discovery failed")
    });

    if (loadingConnection) return (
        <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-64 w-full" />
        </div>
    );

    if (!connection) return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mb-4 opacity-20" />
            <h2 className="text-xl font-semibold text-foreground">Connection Not Found</h2>
            <Button variant="link" asChild><Link to="/connections">Return to List</Link></Button>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] gap-6 animate-in fade-in duration-500">

            {/* --- Header Section --- */}
            <div className="flex flex-col gap-6 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-full">
                            <Link to="/connections"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                    {connection.name}
                                </h2>
                                <Badge variant="outline" className={cn(
                                    "uppercase text-[10px] tracking-wider font-bold",
                                    connection.status === 'active' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" : "text-muted-foreground"
                                )}>
                                    {connection.status || 'UNKNOWN'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5 capitalize">
                                    <Database className="h-3.5 w-3.5" /> {connection.type}
                                </span>
                                <span className="w-px h-3 bg-border" />
                                <span className="flex items-center gap-1.5 font-mono">
                                    ID: {connection.id}
                                </span>
                                <span className="w-px h-3 bg-border" />
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    Created {formatDistanceToNow(new Date(connection.created_at || new Date()), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => testMutation.mutate()}
                            disabled={testMutation.isPending}
                            className={cn(testMutation.isSuccess && "text-emerald-500 border-emerald-500/20")}
                        >
                            {testMutation.isPending ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : testMutation.isSuccess ? (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                            ) : (
                                <Activity className="mr-2 h-4 w-4" />
                            )}
                            {testMutation.isPending ? 'Testing...' : 'Test Connection'}
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                        <TabsTrigger
                            value="assets"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                        >
                            Assets & Schema
                        </TabsTrigger>
                        <TabsTrigger
                            value="configuration"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                        >
                            Configuration
                        </TabsTrigger>
                        <TabsTrigger
                            value="logs"
                            disabled
                            className="rounded-none border-b-2 border-transparent opacity-50 px-4 py-3 cursor-not-allowed"
                        >
                            Audit Logs
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* --- Content Area --- */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === 'assets' && (
                    <Card className="h-full flex flex-col border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b bg-muted/10 shrink-0">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold">Metadata Catalog</CardTitle>
                                <CardDescription className="text-xs">
                                    {assets?.length || 0} objects discovered
                                </CardDescription>
                            </div>
                            <Button
                                onClick={() => discoverMutation.mutate()}
                                disabled={discoverMutation.isPending}
                                size="sm"
                                className="shadow-sm"
                            >
                                <RefreshCw className={cn("mr-2 h-4 w-4", discoverMutation.isPending && "animate-spin")} />
                                {discoverMutation.isPending ? 'Scanning...' : 'Scan Now'}
                            </Button>
                        </CardHeader>

                        <CardContent className="flex-1 p-0 overflow-auto scrollbar-thin scrollbar-thumb-border">
                            {loadingAssets ? (
                                <div className="space-y-4 p-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex justify-between items-center">
                                            <Skeleton className="h-12 w-1/3" />
                                            <Skeleton className="h-8 w-24" />
                                        </div>
                                    ))}
                                </div>
                            ) : assets && assets.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                            <TableHead className="w-[30%]">Asset Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Schema Version</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assets.map((asset: Asset) => (
                                            <AssetTableRow key={asset.id} asset={asset} connectionId={connectionId} />
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                    <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                                        <Search className="h-8 w-8 opacity-40" />
                                    </div>
                                    <p className="font-medium text-foreground">No assets found</p>
                                    <p className="text-sm mt-1 max-w-xs text-center">Run a scan to discover tables, views, or files in this connection.</p>
                                    <Button variant="outline" size="sm" className="mt-4" onClick={() => discoverMutation.mutate()}>
                                        Start Discovery
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'configuration' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto pr-2">
                        {/* Config Details */}
                        <Card className="lg:col-span-2 border-border/50 h-fit">
                            <CardHeader className="border-b bg-muted/10 pb-4">
                                <CardTitle className="text-base">Connection Settings</CardTitle>
                                <CardDescription>Technical configuration for this source.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <ConfigField label="Connection Name" value={connection.name} />
                                <ConfigField label="Description" value={connection.description || '—'} />
                                <div className="grid grid-cols-2 gap-6">
                                    <ConfigField label="Type" value={<span className="capitalize">{connection.type}</span>} />
                                    <ConfigField label="Created" value={format(new Date(connection.created_at || ''), 'PPpp')} />
                                </div>
                                <div className="border-t border-dashed" />
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium flex items-center gap-2 text-primary">
                                        <Lock className="h-3 w-3" /> Credentials
                                    </h4>
                                    <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
                                        <ConfigField label="Password" value="••••••••••••••••" isCode />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Side Panel Info */}
                        <div className="space-y-6">
                            <Card className="border-amber-500/20 bg-amber-500/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" /> Production Safety
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                                    This connection is used in <strong>3 active pipelines</strong>. Modifying credentials may cause failures in scheduled jobs.
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Sub-Components ---

const ConfigField = ({ label, value, isCode }: { label: string, value: any, isCode?: boolean }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
        <div className={cn(
            "text-sm p-2.5 rounded-md border bg-background/50",
            isCode && "font-mono text-muted-foreground bg-muted/20 border-transparent"
        )}>
            {value || <span className="text-muted-foreground/30 italic">Empty</span>}
        </div>
    </div>
);

interface AssetTableRowProps {
    asset: Asset;
    connectionId: number;
}

const AssetTableRow: React.FC<AssetTableRowProps> = ({ asset, connectionId }) => {
    const [isSchemaDialogOpen, setIsSchemaDialogOpen] = React.useState(false);
    const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
    const queryClient = useQueryClient();

    const { data: schemaVersions, isLoading: loadingSchema } = useQuery({
        queryKey: ['schema', asset.id],
        queryFn: () => getAssetSchemaVersions(connectionId, asset.id),
        enabled: isSchemaDialogOpen,
    });

    // Default to latest version when loaded
    useMemo(() => {
        if (schemaVersions && schemaVersions.length > 0 && !selectedVersionId) {
            setSelectedVersionId(schemaVersions[0].id);
        }
    }, [schemaVersions, selectedVersionId]);

    const inferMutation = useMutation({
        mutationFn: () => discoverAssetSchema(connectionId, asset.id),
        onSuccess: () => {
            toast.success("Schema Updated", { description: "Latest structure has been captured." });
            queryClient.invalidateQueries({ queryKey: ['schema', asset.id] });
            queryClient.invalidateQueries({ queryKey: ['assets', connectionId] });
        },
        onError: () => toast.error("Inference failed")
    });

    const selectedSchema = schemaVersions?.find(v => v.id === selectedVersionId);

    return (
        <TableRow className="group">
            <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded text-primary">
                        <TableIcon className="h-4 w-4" />
                    </div>
                    <span>{asset.name}</span>
                </div>
            </TableCell>
            <TableCell className="capitalize text-muted-foreground">{asset.asset_type}</TableCell>
            <TableCell>
                {asset.current_schema_version ? (
                    <Badge variant="outline" className="font-mono text-xs bg-muted/50">
                        v{asset.current_schema_version}
                    </Badge>
                ) : (
                    <span className="text-xs text-muted-foreground italic">Pending</span>
                )}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
                {asset.updated_at ? formatDistanceToNow(new Date(asset.updated_at), { addSuffix: true }) : '-'}
            </TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => inferMutation.mutate()} disabled={inferMutation.isPending}>
                            <RefreshCw className={cn("mr-2 h-4 w-4", inferMutation.isPending && "animate-spin")} />
                            Refresh Schema
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsSchemaDialogOpen(true)}>
                            <FileJson className="mr-2 h-4 w-4" /> View History
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* --- Advanced Schema Viewer Dialog --- */}
                <Dialog open={isSchemaDialogOpen} onOpenChange={setIsSchemaDialogOpen}>
                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
                        <div className="flex h-full">
                            {/* Sidebar: History */}
                            <div className="w-64 bg-muted/30 border-r flex flex-col">
                                <div className="p-4 border-b bg-background">
                                    <h4 className="font-semibold text-sm">Version History</h4>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="flex flex-col p-2 gap-1">
                                        {loadingSchema ? (
                                            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full mb-1" />)
                                        ) : schemaVersions?.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => setSelectedVersionId(v.id)}
                                                className={cn(
                                                    "text-left px-3 py-2 rounded-md text-xs transition-colors flex flex-col gap-0.5",
                                                    selectedVersionId === v.id ? "bg-background shadow-sm border border-border text-foreground" : "hover:bg-background/50 text-muted-foreground"
                                                )}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="font-bold">v{v.version}</span>
                                                    <span className="text-[10px] opacity-70">{format(new Date(v.discovered_at), 'MM/dd')}</span>
                                                </div>
                                                <span className="truncate opacity-70">Auto-detected</span>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Main: JSON Viewer */}
                            <div className="flex-1 flex flex-col bg-background min-w-0">
                                <DialogHeader className="px-6 py-4 border-b shrink-0">
                                    <DialogTitle className="flex items-center gap-2">
                                        <TableIcon className="h-5 w-5 text-primary" />
                                        {asset.name}
                                        <span className="text-muted-foreground font-normal text-sm ml-2">
                                            Schema Definition
                                        </span>
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 overflow-auto bg-[#0c0c0c] p-4 text-xs font-mono text-gray-300">
                                    {selectedSchema ? (
                                        <pre>{JSON.stringify(selectedSchema.json_schema, null, 2)}</pre>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            Select a version to view
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </TableCell>
        </TableRow>
    );
};