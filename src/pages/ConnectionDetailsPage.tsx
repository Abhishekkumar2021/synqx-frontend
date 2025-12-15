/* eslint-disable react-hooks/set-state-in-render */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getConnection,
    testConnection,
    discoverAssets,
    getConnectionAssets,
    type Asset,
    type ConnectionTestResult
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft, Database, RefreshCw, Search,
    ShieldCheck, AlertTriangle,
    Clock, Activity, 
    CheckCircle2, Layers, History,
    Key,
    Server,
    Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AssetTableRow } from '@/components/features/connections/AssetTableRow';
import { ConfigField } from '@/components/features/connections/ConfigField';
import { PageMeta } from '@/components/common/PageMeta';

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
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                 <Skeleton className="h-10 w-64" />
                 <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
    );

    if (!connection) return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground gap-4">
            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 opacity-50" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Connection Not Found</h2>
            <Button variant="outline" asChild><Link to="/connections">Return to Connections</Link></Button>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500">
            <PageMeta title={connection.name} description={`Manage ${connection.name} connection.`} />

            {/* --- Header Section --- */}
            <div className="flex flex-col gap-6 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="h-9 w-9 hover:bg-muted/50">
                            <Link to="/connections"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                    {connection.name}
                                </h2>
                                <Badge variant="outline" className={cn(
                                    "uppercase text-[10px] tracking-wider font-bold border px-2 py-0.5",
                                    connection.status === 'active' 
                                        ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" 
                                        : "text-muted-foreground border-border bg-muted/50"
                                )}>
                                    {connection.status || 'UNKNOWN'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5 capitalize">
                                    <Database className="h-3.5 w-3.5 text-primary/70" /> {connection.type}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="flex items-center gap-1.5 font-mono opacity-80">
                                    ID: {connection.id}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    Updated {formatDistanceToNow(new Date(connection.updated_at || new Date()), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testMutation.mutate()}
                            disabled={testMutation.isPending}
                            className={cn(
                                "border-border/50 hover:bg-muted/50 transition-all",
                                testMutation.isSuccess && "text-emerald-500 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                            )}
                        >
                            {testMutation.isPending ? (
                                <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : testMutation.isSuccess ? (
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                            ) : (
                                <Activity className="mr-2 h-3.5 w-3.5" />
                            )}
                            {testMutation.isPending ? 'Testing...' : 'Test Connectivity'}
                        </Button>
                    </div>
                </div>

                {/* Styled Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start border-b border-border/50 rounded-none h-auto p-0 bg-transparent gap-8">
                        <TabsTrigger
                            value="assets"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-1 py-3 text-sm font-medium transition-all hover:text-foreground/80"
                        >
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                Metadata Catalog
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="configuration"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-1 py-3 text-sm font-medium transition-all hover:text-foreground/80"
                        >
                             <div className="flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                Configuration
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="logs"
                            disabled
                            className="rounded-none border-b-2 border-transparent opacity-50 px-1 py-3 text-sm font-medium cursor-not-allowed"
                        >
                             <div className="flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Audit Logs
                            </div>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* --- Content Area --- */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === 'assets' && (
                    <Card className="h-full flex flex-col glass-panel shadow-sm border-none overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-white/5 bg-white/5 shrink-0">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold">Discovered Assets</CardTitle>
                                <CardDescription className="text-xs">
                                    Managed tables, views, and file objects available for extraction.
                                </CardDescription>
                            </div>
                            <Button
                                onClick={() => discoverMutation.mutate()}
                                disabled={discoverMutation.isPending}
                                size="sm"
                                className="shadow-[0_0_10px_-4px_var(--color-primary)] rounded-full"
                            >
                                <RefreshCw className={cn("mr-2 h-3.5 w-3.5", discoverMutation.isPending && "animate-spin")} />
                                {discoverMutation.isPending ? 'Scanning...' : 'Scan for Assets'}
                            </Button>
                        </CardHeader>

                        <CardContent className="flex-1 p-0 overflow-hidden">
                            <div className="h-full overflow-y-auto custom-scrollbar">
                                {loadingAssets ? (
                                    <div className="space-y-4 p-6">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="flex justify-between items-center py-2">
                                                <div className="flex items-center gap-4">
                                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-48" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                </div>
                                                <Skeleton className="h-8 w-24" />
                                            </div>
                                        ))}
                                    </div>
                                ) : assets && assets.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                            <TableRow className="hover:bg-transparent border-b border-white/5">
                                                <TableHead className="w-[35%] pl-6">Asset Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Schema Version</TableHead>
                                                <TableHead>Last Sync</TableHead>
                                                <TableHead className="text-right pr-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {assets.map((asset: Asset) => (
                                                <AssetTableRow key={asset.id} asset={asset} connectionId={connectionId} />
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground pb-12">
                                        <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                                            <Search className="h-10 w-10 opacity-30" />
                                        </div>
                                        <h3 className="font-semibold text-lg text-foreground">No assets discovered yet</h3>
                                        <p className="text-sm mt-2 max-w-sm text-center leading-relaxed">
                                            Run a scan to automatically detect tables, views, and schemas from this connection.
                                        </p>
                                        <Button variant="outline" size="sm" className="mt-6 border-dashed" onClick={() => discoverMutation.mutate()}>
                                            Start Discovery Scan
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'configuration' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
                        {/* Config Details */}
                        <Card className="lg:col-span-2 glass-card h-fit">
                            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Settings2 className="h-4 w-4 text-primary" /> 
                                    Connection Settings
                                </CardTitle>
                                <CardDescription>Read-only technical configuration.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <ConfigField label="Connection Name" value={connection.name} />
                                <ConfigField label="Description" value={connection.description || '—'} />
                                <div className="grid grid-cols-2 gap-6">
                                    <ConfigField label="Connector Type" value={<span className="capitalize font-semibold text-foreground">{connection.type}</span>} />
                                    <ConfigField label="Created On" value={format(new Date(connection.created_at || ''), 'PPP')} />
                                </div>
                                <div className="border-t border-white/5 border-dashed my-2" />
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Key className="h-3.5 w-3.5" /> Authentication
                                    </h4>
                                    <div className="bg-black/20 border border-white/5 rounded-lg p-4 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground">Password / API Key</p>
                                            <div className="font-mono text-sm tracking-widest text-foreground">••••••••••••••••</div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-xs h-7">Rotate</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Side Panel Info */}
                        <div className="space-y-6">
                            <Card className="border-amber-500/20 bg-amber-500/5 shadow-sm glass-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" /> Dependency Alert
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                                    This connection is actively used by <strong>3 pipelines</strong>. 
                                    Changing credentials or host details may cause immediate failures in scheduled jobs.
                                </CardContent>
                            </Card>

                             <Card className="glass-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Activity className="h-4 w-4" /> Usage Stats
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Sync Success Rate</span>
                                        <span className="font-mono font-bold text-emerald-500">99.8%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Avg. Latency</span>
                                        <span className="font-mono">45ms</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Data Extracted (24h)</span>
                                        <span className="font-mono">1.2 GB</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

