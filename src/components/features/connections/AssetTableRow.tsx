import React, { useState } from 'react';
import {
    TableIcon, Eye, MoreHorizontal, RefreshCw, FileJson, Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
    DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
    getAssetSchemaVersions, 
    discoverAssetSchema, 
    type Asset 
} from '@/lib/api';

interface AssetTableRowProps {
    asset: Asset;
    connectionId: number;
}

export const AssetTableRow: React.FC<AssetTableRowProps> = ({ asset, connectionId }) => {
    const [isSchemaDialogOpen, setIsSchemaDialogOpen] = useState(false);
    const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
    const queryClient = useQueryClient();

    const { data: schemaVersions, isLoading: loadingSchema } = useQuery({
        queryKey: ['schema', asset.id],
        queryFn: () => getAssetSchemaVersions(connectionId, asset.id),
        enabled: isSchemaDialogOpen,
    });

    // Default to latest version when loaded
    React.useEffect(() => {
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
        <TableRow className="group hover:bg-white/5 transition-colors border-b border-white/5">
            <TableCell className="pl-6 font-medium">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20">
                        <TableIcon className="h-4 w-4" />
                    </div>
                    <span className="text-foreground">{asset.name}</span>
                </div>
            </TableCell>
            <TableCell className="capitalize text-muted-foreground text-xs">{asset.asset_type}</TableCell>
            <TableCell>
                {asset.current_schema_version ? (
                    <Badge variant="secondary" className="font-mono text-[10px] bg-white/5 text-muted-foreground border-white/10">
                        v{asset.current_schema_version}
                    </Badge>
                ) : (
                    <span className="text-xs text-muted-foreground/50 italic">Pending Discovery</span>
                )}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs font-mono">
                {asset.updated_at ? formatDistanceToNow(new Date(asset.updated_at), { addSuffix: true }) : '-'}
            </TableCell>
            <TableCell className="text-right pr-6">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={() => setIsSchemaDialogOpen(true)}
                        title="View Schema"
                    >
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Asset Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => inferMutation.mutate()} disabled={inferMutation.isPending}>
                                <RefreshCw className={cn("mr-2 h-3.5 w-3.5", inferMutation.isPending && "animate-spin")} />
                                Refresh Schema
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsSchemaDialogOpen(true)}>
                                <FileJson className="mr-2 h-3.5 w-3.5" /> View History
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* --- Schema Viewer Dialog --- */}
                <Dialog open={isSchemaDialogOpen} onOpenChange={setIsSchemaDialogOpen}>
                    <DialogContent className="max-w-4xl h-[75vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl glass-panel">
                        <div className="flex h-full">
                            {/* Sidebar: History */}
                            <div className="w-64 bg-white/5 border-r border-white/5 flex flex-col">
                                <div className="p-4 border-b border-white/5 bg-white/5">
                                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Version History</h4>
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
                                                    "text-left px-3 py-2.5 rounded-lg text-xs transition-all flex flex-col gap-1 border border-transparent",
                                                    selectedVersionId === v.id 
                                                        ? "bg-background shadow-sm border-white/10 text-foreground ring-1 ring-primary/10" 
                                                        : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="font-bold text-primary">v{v.version}</span>
                                                    <span className="text-[10px] opacity-70 font-mono">{format(new Date(v.discovered_at), 'MMM dd')}</span>
                                                </div>
                                                <span className="truncate opacity-70 text-[10px]">Auto-detected change</span>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Main: JSON Viewer */}
                            <div className="flex-1 flex flex-col bg-[#09090b] min-w-0">
                                <DialogHeader className="px-6 py-3 border-b border-white/10 shrink-0 bg-[#09090b] flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                                            <FileJson className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-sm font-medium text-gray-200">
                                                {asset.name}
                                            </DialogTitle>
                                            <DialogDescription className="text-xs text-gray-500">
                                                Schema Definition (Read-only)
                                            </DialogDescription>
                                        </div>
                                    </div>
                                    {selectedSchema && (
                                        <Badge variant="outline" className="text-[10px] border-white/10 text-gray-400 bg-white/5">
                                            {format(new Date(selectedSchema.discovered_at), 'PPP pp')}
                                        </Badge>
                                    )}
                                </DialogHeader>
                                
                                <div className="flex-1 overflow-auto p-6 relative group">
                                    {selectedSchema ? (
                                        <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
                                            {JSON.stringify(selectedSchema.json_schema, null, 2)}
                                        </pre>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                                            <Terminal className="h-8 w-8 opacity-20" />
                                            <span>Select a version to view schema</span>
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
