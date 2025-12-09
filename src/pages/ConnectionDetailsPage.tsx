import React from 'react';
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
    type ConnectionTestResult
} from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { 
    ArrowLeft, 
    Database, 
    RefreshCw, 
    Search, 
    Table as TableIcon, 
    FileJson, 
    Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export const ConnectionDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const connectionId = parseInt(id!);
    const queryClient = useQueryClient();

    const { data: connection, isLoading: loadingConnection } = useQuery({
        queryKey: ['connection', connectionId],
        queryFn: () => getConnection(connectionId)
    });

    const { data: assets, isLoading: loadingAssets } = useQuery({
        queryKey: ['assets', connectionId],
        queryFn: () => getConnectionAssets(connectionId)
    });

    const testMutation = useMutation({
        mutationFn: () => testConnection(connectionId),
        onSuccess: (data: ConnectionTestResult) => {
            if (data.success) toast.success("Connection Healthy", { description: data.message });
            else toast.error("Connection Failed", { description: data.message });
        },
        onError: () => toast.error("Test execution failed")
    });

    const discoverMutation = useMutation({
        mutationFn: () => discoverAssets(connectionId),
        onSuccess: (data: any) => {
            toast.success(`Discovered ${data.discovered_count} assets`);
            queryClient.invalidateQueries({ queryKey: ['assets', connectionId] });
        },
        onError: () => toast.error("Discovery failed")
    });

    if (loadingConnection) return <div className="p-8"><Skeleton className="h-32 w-full" /></div>;
    if (!connection) return <div className="p-8 text-red-500">Connection not found</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/connections">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Database className="h-6 w-6 text-blue-400" />
                            {connection.name}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-xs uppercase">{connection.type}</Badge>
                            <span>ID: {connection.id}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => testMutation.mutate()}
                        isLoading={testMutation.isPending}
                    >
                        {testMutation.isPending ? 'Testing...' : 'Test Connection'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="assets" className="w-full">
                <TabsList>
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                </TabsList>

                <TabsContent value="assets" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border">
                        <div>
                            <h3 className="text-lg font-medium">Discovered Assets</h3>
                            <p className="text-sm text-muted-foreground">Tables, views, or files found in this connection.</p>
                        </div>
                        <Button 
                            onClick={() => discoverMutation.mutate()} 
                            isLoading={discoverMutation.isPending}
                            variant="secondary"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" /> 
                            {discoverMutation.isPending ? 'Scanning...' : 'Scan for Assets'}
                        </Button>
                    </div>

                    {loadingAssets ? (
                        <div className="space-y-2">
                            {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : assets && assets.length > 0 ? (
                        <div className="grid gap-4">
                            {assets.map((asset: Asset) => (
                                <AssetCard key={asset.id} asset={asset} connectionId={connectionId} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No assets discovered yet.</p>
                            <p className="text-sm">Click "Scan for Assets" to populate this list.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="configuration">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connection Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Connection URL</span>
                                    <div className="font-mono text-sm bg-muted p-2 rounded truncate">
                                        {connection.connection_url ? '••••••••••••••••' : 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Created At</span>
                                    <div className="text-sm">
                                        {connection.created_at ? new Date(connection.created_at).toLocaleString() : '-'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const AssetCard: React.FC<{ asset: Asset, connectionId: number }> = ({ asset, connectionId }) => {
    const [expanded, setExpanded] = React.useState(false);
    const { data: schemaVersions, isLoading: loadingSchema } = useQuery({
        queryKey: ['schema', asset.id],
        queryFn: () => getAssetSchemaVersions(connectionId, asset.id),
        enabled: expanded
    });

    const inferMutation = useMutation({
        mutationFn: () => discoverAssetSchema(connectionId, asset.id),
        onSuccess: () => {
            toast.success("Schema inference complete");
        }
    });

    return (
        <Card className="overflow-hidden transition-all duration-200">
            <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <TableIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-medium text-sm">{asset.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{asset.asset_type}</span>
                            <span>•</span>
                            <span>Last updated {formatDistanceToNow(new Date(asset.updated_at), { addSuffix: true })}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {asset.current_schema_version ? (
                        <Badge variant="secondary" className="text-xs">
                            <Hash className="h-3 w-3 mr-1" /> v{asset.current_schema_version}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/20">
                            No Schema
                        </Badge>
                    )}
                </div>
            </div>

            {expanded && (
                <div className="border-t border-border bg-muted/10 p-4 space-y-4 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center">
                        <h5 className="text-sm font-semibold flex items-center gap-2">
                            <FileJson className="h-4 w-4" /> Schema History
                        </h5>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                inferMutation.mutate();
                            }}
                            isLoading={inferMutation.isPending}
                        >
                            Infer Schema
                        </Button>
                    </div>

                    {loadingSchema ? (
                        <Skeleton className="h-20 w-full" />
                    ) : schemaVersions && schemaVersions.length > 0 ? (
                        <div className="space-y-2">
                            {schemaVersions.map((v: any) => (
                                <div key={v.id} className="text-xs border rounded p-2 bg-background font-mono">
                                    <div className="flex justify-between text-muted-foreground mb-1">
                                        <span>Version {v.version}</span>
                                        <span>{new Date(v.discovered_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <pre>{JSON.stringify(v.json_schema, null, 2)}</pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            No schema versions recorded. Click "Infer Schema" to analyze the data structure.
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};
