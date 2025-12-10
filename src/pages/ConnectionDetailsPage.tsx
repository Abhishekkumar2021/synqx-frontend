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
    type ConnectionTestResult,
    type SchemaVersion
} from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
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
    Hash,
    MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

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
            toast.success(`Discovered ${data.length || 0} assets`); // Data might not have discovered_count
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
                            <Database className="h-6 w-6 text-primary" />
                            {connection.name}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-xs uppercase">{connection.type}</Badge>
                            <span>ID: {connection.id}</span>
                            <Badge variant={connection.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                {connection.status || 'unknown'}
                            </Badge>
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
                    <Card className="bg-card/50 backdrop-blur-sm shadow-xl border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-lg font-medium">Discovered Assets</CardTitle>
                                <CardDescription className="text-muted-foreground">Tables, views, or files found in this connection.</CardDescription>
                            </div>
                            <Button 
                                onClick={() => discoverMutation.mutate()} 
                                isLoading={discoverMutation.isPending}
                                variant="secondary"
                                size="sm"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> 
                                {discoverMutation.isPending ? 'Scanning...' : 'Scan for Assets'}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingAssets ? (
                                <div className="space-y-2 p-4">
                                    {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                                </div>
                            ) : assets && assets.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[200px]">Name</TableHead>
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
                                <div className="text-center py-12 text-muted-foreground">
                                    <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No assets discovered yet.</p>
                                    <p className="text-sm">Click "Scan for Assets" to populate this list.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="configuration">
                    <Card className="bg-card/50 backdrop-blur-sm shadow-xl border-border/50">
                        <CardHeader>
                            <CardTitle>Connection Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Connection URL</span>
                                    <div className="font-mono text-sm bg-muted p-2 rounded truncate border border-border/50">
                                        {connection.connection_url ? '••••••••••••••••' : 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Type</span>
                                    <div className="text-sm bg-muted p-2 rounded border border-border/50">
                                        {connection.type}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Created At</span>
                                    <div className="text-sm bg-muted p-2 rounded border border-border/50">
                                        {connection.created_at ? format(new Date(connection.created_at), 'MMM dd, yyyy HH:mm') : '-'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Updated At</span>
                                    <div className="text-sm bg-muted p-2 rounded border border-border/50">
                                        {connection.updated_at ? format(new Date(connection.updated_at), 'MMM dd, yyyy HH:mm') : '-'}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Description</span>
                                <div className="text-sm bg-muted p-2 rounded border border-border/50 min-h-[40px]">
                                    {connection.description || 'No description provided.'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

interface AssetTableRowProps {
    asset: Asset;
    connectionId: number;
}

const AssetTableRow: React.FC<AssetTableRowProps> = ({ asset, connectionId }) => {
    const [isSchemaDialogOpen, setIsSchemaDialogOpen] = React.useState(false);
    const queryClient = useQueryClient();

    const { data: schemaVersions, isLoading: loadingSchema } = useQuery({
        queryKey: ['schema', asset.id],
        queryFn: () => getAssetSchemaVersions(connectionId, asset.id),
        enabled: isSchemaDialogOpen, // Fetch if dialog is open
    });

    const inferMutation = useMutation({
        mutationFn: () => discoverAssetSchema(connectionId, asset.id),
        onSuccess: () => {
            toast.success("Schema inference complete");
            queryClient.invalidateQueries({ queryKey: ['schema', asset.id] });
            queryClient.invalidateQueries({ queryKey: ['assets', connectionId] }); // To update schema version badge
        },
        onError: () => toast.error("Schema inference failed")
    });

    return (
        <TableRow>
            <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4 text-muted-foreground" />
                    {asset.name}
                </div>
            </TableCell>
            <TableCell className="capitalize">{asset.asset_type}</TableCell>
            <TableCell>
                {asset.current_schema_version ? (
                    <Badge variant="secondary" className="text-xs">
                        <Hash className="h-3 w-3 mr-1" /> v{asset.current_schema_version}
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/20">
                        No Schema
                    </Badge>
                )}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
                {asset.updated_at ? formatDistanceToNow(new Date(asset.updated_at), { addSuffix: true }) : 'N/A'}
            </TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Asset Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => inferMutation.mutate()} disabled={inferMutation.isPending}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Infer Schema
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsSchemaDialogOpen(true)}>
                            <FileJson className="mr-2 h-4 w-4" /> View Schema
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Schema Dialog */}
                <Dialog open={isSchemaDialogOpen} onOpenChange={setIsSchemaDialogOpen}>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Schema for "{asset.name}"</DialogTitle>
                            <DialogDescription>
                                Current schema version and historical changes.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {loadingSchema ? (
                                <Skeleton className="h-40 w-full" />
                            ) : schemaVersions && schemaVersions.length > 0 ? (
                                schemaVersions.map((v: SchemaVersion) => (
                                    <Card key={v.id} className="bg-muted/20 border-border/50">
                                        <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
                                            <h5 className="text-sm font-semibold">Version {v.version}</h5>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(v.discovered_at), 'MMM dd, yyyy HH:mm')}
                                            </span>
                                        </CardHeader>
                                        <CardContent className="pt-0 pb-3 px-3">
                                            <pre className="text-xs bg-background/50 p-2 rounded-md overflow-x-auto border border-border/50">
                                                <code>{JSON.stringify(v.json_schema, null, 2)}</code>
                                            </pre>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                    No schema versions recorded.
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </TableCell>
        </TableRow>
    );
};