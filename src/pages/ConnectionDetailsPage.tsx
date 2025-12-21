/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getConnection,
    testConnection,
    deleteConnection,
    discoverAssets,
    getConnectionAssets,
    createAsset,
    type Asset,
    type ConnectionTestResult,
    type AssetCreate
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
    CheckCircle2, Download, Plus
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AssetTableRow } from '@/components/features/connections/AssetTableRow';
import { PageMeta } from '@/components/common/PageMeta';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";

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
    discoveredAssets,
    isLoading,
    onDiscover,
    setDiscoveredAssets
}: {
    connectionId: number,
    assets: Asset[] | undefined,
    discoveredAssets: any[],
    isLoading: boolean,
    onDiscover: () => void,
    setDiscoveredAssets: (assets: any[]) => void
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [importingName, setImportingName] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    // Create Form State
    const [newAssetName, setNewAssetName] = useState('');
    const [newAssetType, setNewAssetType] = useState('table');
    const [newUsageType, setNewUsageType] = useState('destination');
    const [newFullyQualifiedName, setNewFullyQualifiedName] = useState('');
    const [isIncremental, setIsIncremental] = useState(false);
    const [configJson, setConfigJson] = useState('{}');

    const queryClient = useQueryClient();

    // Reset form when opening dialog
    const openCreateDialog = () => {
        setNewAssetName('');
        setNewAssetType('table');
        setNewUsageType('destination');
        setNewFullyQualifiedName('');
        setIsIncremental(false);
        setConfigJson('{}');
        setIsCreateOpen(true);
    };

    // Client-side filtering for responsiveness
    const filteredAssets = useMemo(() => {
        if (!assets) return [];
        return assets.filter(asset =>
            asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.asset_type?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [assets, searchQuery]);

    const filteredDiscovered = useMemo(() => {
        return discoveredAssets.filter(asset =>
            asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (asset.type || asset.asset_type)?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [discoveredAssets, searchQuery]);

    // Create Asset Mutation
    const createMutation = useMutation({
        mutationFn: async () => {
            let parsedConfig = {};
            try {
                parsedConfig = JSON.parse(configJson);
            } catch (e) {
                toast.error("Invalid JSON configuration");
                throw e;
            }

            const payload: AssetCreate = {
                name: newAssetName,
                asset_type: newAssetType,
                fully_qualified_name: newFullyQualifiedName || undefined,
                connection_id: connectionId,
                description: 'Manually created asset',
                is_source: newUsageType === 'source',
                is_destination: newUsageType === 'destination',
                is_incremental_capable: isIncremental,
                config: parsedConfig
            };
            return createAsset(connectionId, payload);
        },
        onSuccess: () => {
            toast.success("Asset Created", {
                description: `Successfully added "${newAssetName}" to managed assets.`
            });
            queryClient.invalidateQueries({ queryKey: ['assets', connectionId] });
            setIsCreateOpen(false);
        },
        onError: (err) => {
            console.error(err);
            toast.error("Asset Creation Failed", {
                description: "There was an error defining this asset. Please try again."
            });
        }
    });

    // Import Asset Mutation
    const importMutation = useMutation({
        mutationFn: async ({ assetRaw, asDestination = false }: { assetRaw: any, asDestination?: boolean }) => {
            setImportingName(assetRaw.name);
            const payload: AssetCreate = {
                name: assetRaw.name,
                asset_type: assetRaw.type || assetRaw.asset_type || 'table',
                connection_id: connectionId,
                description: assetRaw.description,
                is_source: !asDestination,
                is_destination: asDestination
            };
            return createAsset(connectionId, payload);
        },
        onSuccess: (_, variables) => {
            toast.success(`Imported ${variables.assetRaw.name} as ${variables.asDestination ? 'Destination' : 'Source'}`);
            // Remove from discovered list
            setDiscoveredAssets(discoveredAssets.filter(a => a.name !== variables.assetRaw.name));
            // Refresh managed assets
            queryClient.invalidateQueries({ queryKey: ['assets', connectionId] });
            setImportingName(null);
        },
        onError: () => {
            toast.error("Import failed");
            setImportingName(null);
        }
    });

    return (
        <Card className="h-full flex flex-col border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-6 border-b border-border/40 bg-muted/20 shrink-0 gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">Assets</CardTitle>
                    <CardDescription className="text-xs">
                        {assets?.length || 0} managed, {discoveredAssets.length} discovered.
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
                        onClick={openCreateDialog}
                        size="sm"
                        variant="secondary"
                        className="rounded-lg shadow-sm"
                    >
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        New
                    </Button>
                    <Button
                        onClick={onDiscover}
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-border/50 shadow-sm"
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isLoading && "animate-spin")} />
                        Scan
                    </Button>
                </div>
            </CardHeader>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Asset</DialogTitle>
                        <DialogDescription>
                            Define a new table, file, or stream manually.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Asset Name <span className="text-destructive">*</span></Label>
                                <Input 
                                    placeholder="e.g. users_processed" 
                                    value={newAssetName}
                                    onChange={(e) => setNewAssetName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Asset Type</Label>
                                <Select value={newAssetType} onValueChange={setNewAssetType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="table">Table</SelectItem>
                                        <SelectItem value="view">View</SelectItem>
                                        <SelectItem value="file">File</SelectItem>
                                        <SelectItem value="stream">Stream</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Fully Qualified Name</Label>
                            <Input 
                                placeholder="e.g. public.users_processed" 
                                value={newFullyQualifiedName}
                                onChange={(e) => setNewFullyQualifiedName(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground">Optional schema-qualified name.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Usage Type</Label>
                            <Select value={newUsageType} onValueChange={setNewUsageType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="source">Source (Read)</SelectItem>
                                    <SelectItem value="destination">Destination (Write)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Incremental Load</Label>
                                <p className="text-xs text-muted-foreground">Supports incremental data processing</p>
                            </div>
                            <Switch checked={isIncremental} onCheckedChange={setIsIncremental} />
                        </div>

                        <div className="space-y-2">
                            <Label>Configuration (JSON)</Label>
                            <Textarea 
                                placeholder='{"partition_by": "date", "compression": "snappy"}'
                                className="font-mono text-xs"
                                value={configJson}
                                onChange={(e) => setConfigJson(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={() => createMutation.mutate()} disabled={!newAssetName || createMutation.isPending}>
                            {createMutation.isPending ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CardContent className="flex-1 p-0 overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar">
                    {/* Discovered Assets Section */}
                    {filteredDiscovered.length > 0 && (
                        <div className="mb-6">
                            <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                                <Download className="h-4 w-4 text-amber-500" />
                                <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-500">Discovered Assets</h3>
                                <Badge variant="outline" className="ml-auto border-amber-500/30 text-amber-600 bg-amber-500/5">
                                    {filteredDiscovered.length} Found
                                </Badge>
                            </div>
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-b border-border/50">
                                        <TableHead className="pl-6 w-[40%]">Asset Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDiscovered.map((asset, idx) => (
                                        <TableRow key={idx} className="hover:bg-muted/30 border-b border-border/40">
                                            <TableCell className="pl-6 font-medium">{asset.name}</TableCell>
                                            <TableCell className="capitalize text-muted-foreground text-xs">{asset.type || asset.asset_type}</TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button 
                                                                size="sm" 
                                                                variant="secondary" 
                                                                className="h-7 text-xs gap-1"
                                                                disabled={importingName === asset.name}
                                                            >
                                                                {importingName === asset.name ? (
                                                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Plus className="h-3 w-3" />
                                                                )}
                                                                Import
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => importMutation.mutate({ assetRaw: asset, asDestination: false })}>
                                                                Import as Source (Read)
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => importMutation.mutate({ assetRaw: asset, asDestination: true })}>
                                                                Import as Destination (Write)
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Managed Assets Section */}
                    {isLoading && !assets ? (
                        <div className="space-y-4 p-6">
                            {[1, 2, 3].map(i => (
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
                        <>
                             {(filteredDiscovered.length > 0) && (
                                <div className="px-6 py-2 bg-muted/20 border-y border-border/50 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                    Managed Assets
                                </div>
                            )}
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
                        </>
                    ) : (
                        filteredDiscovered.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground pb-12 p-4 text-center">
                                <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-6 ring-1 ring-border/50">
                                    {searchQuery ? <Search className="h-10 w-10 opacity-30" /> : <Database className="h-10 w-10 opacity-30" />}
                                </div>
                                <h3 className="font-semibold text-lg text-foreground">
                                    {searchQuery ? "No matching assets" : "No assets managed yet"}
                                </h3>
                                <p className="text-sm mt-2 max-w-sm leading-relaxed">
                                    {searchQuery
                                        ? `No assets found matching "${searchQuery}".`
                                        : "Run a scan to find tables, then import them to start building pipelines."}
                                </p>
                                {!searchQuery && (
                                    <Button variant="outline" size="sm" className="mt-6 border-dashed border-border" onClick={onDiscover}>
                                        Start Discovery Scan
                                    </Button>
                                )}
                            </div>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const ConfigurationTabContent = ({ connection }: { connection: any }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto p-4 custom-scrollbar z-10">
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
                        <ConfigField label="Connector Type" value={<span className="capitalize font-semibold text-foreground">{connection.connector_type}</span>} />
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
    const [discoveredAssets, setDiscoveredAssets] = useState<any[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: () => deleteConnection(connectionId),
        onSuccess: () => {
            toast.success("Connection deleted");
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            navigate('/connections');
        },
        onError: () => toast.error("Failed to delete connection")
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
                    description: `Verification successful. ${data.message || 'The system can successfully communicate with the data source.'}`,
                    icon: <ShieldCheck className="text-emerald-500 h-4 w-4" />
                });
            } else {
                toast.error("Connection Failed", {
                    description: data.message || "The data source could not be reached. Please check your credentials and host settings.",
                    icon: <AlertTriangle className="text-destructive h-4 w-4" />
                });
            }
        },
        onError: () => toast.error("Test execution failed", {
            description: "An internal error occurred while trying to verify connectivity."
        })
    });

    // Discover Assets Mutation
    const discoverMutation = useMutation({
        mutationFn: () => discoverAssets(connectionId),
        onSuccess: (data: any) => {
            const newAssets = data.assets || [];
            toast.success(`Discovery Complete`, { description: `Found ${data.discovered_count || newAssets.length || 0} items` });
            setDiscoveredAssets(newAssets);
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
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500">
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
                                    connection.health_status === 'active'
                                        ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                                        : "text-muted-foreground border-border bg-muted/50"
                                )}>
                                    {connection.health_status || 'UNKNOWN'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium flex-wrap">
                                <span className="flex items-center gap-1.5 capitalize">
                                    <div className="p-1 rounded-md bg-muted/50 border border-border/50">
                                        <Database className="h-3 w-3 text-primary" />
                                    </div>
                                    {connection.connector_type}
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
                                <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the connection "{connection.name}" and all associated metadata.
                                        Pipelines using this connection may fail.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => deleteMutation.mutate()}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
                    <div className="pt-6 h-[calc(100vh-16rem)]">
                        <TabsContent value="assets" className="h-full mt-0 focus-visible:outline-none">
                            <AssetsTabContent
                                connectionId={connectionId}
                                assets={assets}
                                discoveredAssets={discoveredAssets}
                                isLoading={loadingAssets || discoverMutation.isPending}
                                onDiscover={() => discoverMutation.mutate()}
                                setDiscoveredAssets={setDiscoveredAssets}
                            />
                        </TabsContent>

                        <TabsContent value="configuration" className="h-full mt-0 focus-visible:outline-none overflow-auto">
                            <ConfigurationTabContent connection={connection} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
};