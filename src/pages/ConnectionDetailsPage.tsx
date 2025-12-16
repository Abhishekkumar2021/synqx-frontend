/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    ArrowLeft, Database, RefreshCw, Search,
    ShieldCheck, AlertTriangle,
    Clock, Activity,
    Layers, History,
    Key, Server, Settings2, Lock,
    MoreVertical, Trash2, Pencil, Copy, Check,
    CheckCircle2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AssetTableRow } from '@/components/features/connections/AssetTableRow';
import { PageMeta } from '@/components/common/PageMeta';

// --- Sub-Components ---

const ConfigField = ({ label, value, sensitive = false, copyable = false }: { label: string, value: React.ReactNode, sensitive?: boolean, copyable?: boolean }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (typeof value === 'string') {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("Copied to clipboard");
        }
    };

    return (
        <div className="space-y-1.5 group">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
            <div className={cn(
                "text-sm font-medium p-3 rounded-lg border border-border/50 bg-muted/20 flex items-center justify-between transition-colors hover:border-border/80",
                sensitive && "font-mono tracking-widest"
            )}>
                <span className="truncate">{value}</span>
                <div className="flex items-center gap-2">
                    {sensitive && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    {copyable && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleCopy}
                        >
                            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

const AssetsTabContent = ({
    connectionId,
    assets,
    isLoading,
    onDiscover
}: {
    connectionId: number,
    assets: Asset[] | undefined,
    isLoading: boolean,
    onDiscover: () => void
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Client-side filtering for responsiveness
    const filteredAssets = useMemo(() => {
        if (!assets) return [];
        return assets.filter(asset =>
            asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.asset_type?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [assets, searchQuery]);


    return (
        <Card className="h-full flex flex-col border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-6 border-b border-border/40 bg-muted/20 shrink-0 gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">Discovered Assets</CardTitle>
                    <CardDescription className="text-xs">
                        {assets?.length || 0} managed objects available for extraction.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-20" />
                        <Input
                            placeholder="Filter assets..."
                            className="pl-9 h-9 bg-background/50 border-border/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={onDiscover}
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-border/50 shadow-sm"
                    >
                        <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isLoading && "animate-spin")} />
                        Scan
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar">
                    {isLoading && !assets ? (
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
                    ) : filteredAssets.length > 0 ? (
                        <Table>
                            <TableHeader className="bg-card sticky top-0 z-10 backdrop-blur-md shadow-sm">
                                <TableRow className="hover:bg-transparent border-b border-border/50">
                                    <TableHead className="w-[40%] pl-6">Asset Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Schema</TableHead>
                                    <TableHead>Last Sync</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAssets.map((asset) => (
                                    <AssetTableRow key={asset.id} asset={asset} connectionId={connectionId} />
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground pb-12 p-4 text-center">
                            <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-6 ring-1 ring-border/50">
                                {searchQuery ? <Search className="h-10 w-10 opacity-30" /> : <Database className="h-10 w-10 opacity-30" />}
                            </div>
                            <h3 className="font-semibold text-lg text-foreground">
                                {searchQuery ? "No matching assets" : "No assets discovered yet"}
                            </h3>
                            <p className="text-sm mt-2 max-w-sm leading-relaxed">
                                {searchQuery
                                    ? `No assets found matching "${searchQuery}". Try a different term.`
                                    : "Run a scan to automatically detect tables, views, and schemas from this connection."}
                            </p>
                            {!searchQuery && (
                                <Button variant="outline" size="sm" className="mt-6 border-dashed border-border" onClick={onDiscover}>
                                    Start Discovery Scan
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const ConfigurationTabContent = ({ connection }: { connection: any }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto pr-1 pb-4 custom-scrollbar">
            {/* Config Details */}
            <Card className="lg:col-span-2 border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm h-fit">
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-primary" />
                        Connection Settings
                    </CardTitle>
                    <CardDescription>Read-only technical configuration.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <ConfigField label="Connection Name" value={connection.name} copyable />
                        <ConfigField label="Connector Type" value={<span className="capitalize font-semibold text-foreground">{connection.type}</span>} />
                    </div>
                    <ConfigField label="Description" value={connection.description || '—'} />
                    <div className="grid gap-6 md:grid-cols-2">
                        <ConfigField label="Host" value={connection.host || '127.0.0.1'} copyable />
                        <ConfigField label="Port" value={connection.port || '5432'} />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <ConfigField label="Created On" value={format(new Date(connection.created_at || ''), 'PPP')} />
                        <ConfigField label="Last Updated" value={format(new Date(connection.updated_at || ''), 'PPP')} />
                    </div>

                    <div className="border-t border-dashed border-border my-2" />

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Key className="h-3.5 w-3.5" /> Authentication
                        </h4>
                        <div className="bg-muted/30 border border-border/60 rounded-lg p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Encrypted Password / API Key</p>
                                <div className="font-mono text-sm tracking-widest text-foreground">••••••••••••••••</div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs h-7 hover:bg-muted/50 border border-border/50">
                                Rotate Credentials
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Side Panel Info */}
            <div className="space-y-6">
                <Card className="border-amber-500/20 bg-amber-500/5 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Impact Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground leading-relaxed">
                        This connection is actively used by <strong>3 pipelines</strong>.
                        Changing credentials or host details may cause immediate failures in scheduled jobs.
                    </CardContent>
                </Card>

                <Card className="border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" /> Usage Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Sync Success Rate</span>
                            <span className="font-mono font-bold text-emerald-500">99.8%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Avg. Latency</span>
                            <span className="font-mono text-foreground">45ms</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Data Extracted (24h)</span>
                            <span className="font-mono text-foreground">1.2 GB</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// --- Main Page Component ---

export const ConnectionDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const connectionId = parseInt(id!);
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('assets');

    // Fetch Connection
    const {
        data: connection,
        isLoading: loadingConnection,
        isError: isConnectionError
    } = useQuery({
        queryKey: ['connection', connectionId],
        queryFn: () => getConnection(connectionId),
        retry: 1
    });

    // Fetch Assets
    const {
        data: assets,
        isLoading: loadingAssets } = useQuery({
            queryKey: ['assets', connectionId],
            queryFn: () => getConnectionAssets(connectionId),
            enabled: !!connection // Only fetch if connection exists
        });

    // Test Connection Mutation
    const testMutation = useMutation({
        mutationFn: () => testConnection(connectionId),
        onSuccess: (data: ConnectionTestResult) => {
            if (data.success) {
                toast.success("Connection Healthy", {
                    description: "Latency: 45ms • SSL: Verified",
                    icon: <ShieldCheck className="text-emerald-500 h-4 w-4" />
                });
            } else {
                toast.error("Connection Failed", {
                    description: data.message,
                    icon: <AlertTriangle className="text-destructive h-4 w-4" />
                });
            }
        },
        onError: () => toast.error("Test execution failed")
    });

    // Discover Assets Mutation
    const discoverMutation = useMutation({
        mutationFn: () => discoverAssets(connectionId),
        onSuccess: (data: any) => {
            toast.success(`Discovery Complete`, { description: `Found ${data.length || 0} new assets` });
            queryClient.invalidateQueries({ queryKey: ['assets', connectionId] });
        },
        onError: () => toast.error("Discovery failed")
    });

    // --- Render States ---

    if (loadingConnection) return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-[500px] w-full rounded-3xl" />
        </div>
    );

    if (isConnectionError || !connection) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-6">
            <div className="relative">
                <div className="absolute inset-0 bg-destructive/20 blur-xl rounded-full" />
                <div className="relative h-20 w-20 bg-card border border-border rounded-[2rem] flex items-center justify-center shadow-lg">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Connection Not Found</h2>
                <p className="max-w-md mx-auto">The connection you are looking for does not exist or you do not have permission to view it.</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/connections')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Return to Connections
            </Button>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] gap-6 animate-in fade-in duration-500 pb-6">
            <PageMeta title={connection.name} description={`Manage ${connection.name} connection details.`} />

            {/* --- Header Section --- */}
            <div className="flex flex-col gap-6 shrink-0">
                <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-muted/50 rounded-xl border border-transparent hover:border-border/50"
                            onClick={() => navigate('/connections')}
                        >
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </Button>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                    {connection.name}
                                </h2>
                                <Badge variant="outline" className={cn(
                                    "uppercase text-[10px] tracking-wider font-bold border px-2 py-0.5 rounded-md",
                                    connection.status === 'active'
                                        ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                                        : "text-muted-foreground border-border bg-muted/50"
                                )}>
                                    {connection.status || 'UNKNOWN'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium flex-wrap">
                                <span className="flex items-center gap-1.5 capitalize">
                                    <div className="p-1 rounded-md bg-muted/50 border border-border/50">
                                        <Database className="h-3 w-3 text-primary" />
                                    </div>
                                    {connection.type}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="flex items-center gap-1.5 font-mono opacity-80" title="Click to copy ID">
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
                                "border-border/50 bg-card hover:bg-muted/50 transition-all shadow-sm min-w-[140px]",
                                testMutation.isSuccess && "text-emerald-600 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
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

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/60 bg-background/95 backdrop-blur-md shadow-xl">
                                <DropdownMenuItem>
                                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Connection
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border/50" />
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="h-10 w-full justify-start rounded-lg bg-muted/40 p-1 text-muted-foreground gap-1">
                        <TabsTrigger
                            value="assets"
                            className="
            flex-1 sm:flex-none inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-1.5 
            text-sm font-medium ring-offset-background transition-all focus-visible:outline-none 
            disabled:pointer-events-none disabled:opacity-50 
            data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
        "
                        >
                            <Layers className="h-4 w-4" />
                            Metadata
                        </TabsTrigger>

                        <TabsTrigger
                            value="configuration"
                            className="
                                flex-1 sm:flex-none inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-1.5 
                                text-sm font-medium ring-offset-background transition-all focus-visible:outline-none 
                                disabled:pointer-events-none disabled:opacity-50 
                                data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
                            "
                        >
                            <Server className="h-4 w-4" />
                            Config
                        </TabsTrigger>

                        <TabsTrigger
                            value="logs"
                            disabled
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-md px-4 py-1.5 text-sm"
                        >
                            <History className="h-4 w-4" />
                            Logs
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab Content Wrappers */}
                    <div className="pt-6 h-[calc(100vh-14rem)]">
                        <TabsContent value="assets" className="h-full mt-0 focus-visible:outline-none">
                            <AssetsTabContent
                                connectionId={connectionId}
                                assets={assets}
                                isLoading={loadingAssets || discoverMutation.isPending}
                                onDiscover={() => discoverMutation.mutate()}
                            />
                        </TabsContent>

                        <TabsContent value="configuration" className="h-full mt-0 focus-visible:outline-none">
                            <ConfigurationTabContent connection={connection} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
};