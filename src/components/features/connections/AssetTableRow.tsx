import React, { useState, useEffect } from 'react';
import {
    Table as TableIcon, Eye, MoreHorizontal, RefreshCw, FileJson, Terminal,
    FileText, Database, Copy, Check
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

// Helper to choose icon based on asset type
const getAssetIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('table')) return <TableIcon className="h-4 w-4" />;
    if (t.includes('file') || t.includes('csv') || t.includes('json')) return <FileText className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
};

export const AssetTableRow: React.FC<AssetTableRowProps> = ({ asset, connectionId }) => {
    const [isSchemaDialogOpen, setIsSchemaDialogOpen] = useState(false);
    const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const queryClient = useQueryClient();

    // Fetch Schema Versions
    const { data: schemaVersions, isLoading: loadingSchema } = useQuery({
        queryKey: ['schema', asset.id],
        queryFn: () => getAssetSchemaVersions(connectionId, asset.id),
        enabled: isSchemaDialogOpen,
    });

    // Default to latest version when loaded
    useEffect(() => {
        if (schemaVersions && schemaVersions.length > 0 && !selectedVersionId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedVersionId(schemaVersions[0].id);
        }
    }, [schemaVersions, selectedVersionId]);

    // Mutation: Refresh Schema
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

    const handleCopyJson = () => {
        if (selectedSchema?.json_schema) {
            navigator.clipboard.writeText(JSON.stringify(selectedSchema.json_schema, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("Schema copied to clipboard");
        }
    };

    return (
        <TableRow className="group transition-colors border-b border-border/40 hover:bg-muted/30">
            <TableCell className="pl-6 font-medium">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20 shadow-sm">
                        {getAssetIcon(asset.asset_type || 'table')}
                    </div>
                    <span className="text-foreground font-semibold">{asset.name}</span>
                </div>
            </TableCell>
            <TableCell className="capitalize text-muted-foreground text-xs font-medium">{asset.asset_type}</TableCell>
            <TableCell>
                {asset.current_schema_version ? (
                    <Badge variant="secondary" className="font-mono text-[10px] bg-muted text-muted-foreground border-border/50">
                        v{asset.current_schema_version}
                    </Badge>
                ) : (
                    <span className="text-xs text-muted-foreground/50 italic flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" /> Pending
                    </span>
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
                        className="h-8 w-8 p-0 hover:bg-background hover:text-primary hover:border hover:border-border"
                        onClick={() => setIsSchemaDialogOpen(true)}
                        title="View Schema"
                    >
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background hover:border hover:border-border">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/60 shadow-xl backdrop-blur-md">
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
                    <DialogContent className="max-w-5xl h-[75vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-[1.5rem] border-border/60 bg-background/95 backdrop-blur-2xl shadow-2xl">
                        <div className="flex h-full">

                            {/* Sidebar: History List */}
                            <div className="w-72 bg-muted/20 border-r border-border/50 flex flex-col shrink-0">
                                <div className="p-4 border-b border-border/50 bg-muted/30">
                                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <HistoryIcon className="h-3.5 w-3.5" /> Version History
                                    </h4>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="flex flex-col p-3 gap-2">
                                        {loadingSchema ? (
                                            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
                                        ) : schemaVersions?.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => setSelectedVersionId(v.id)}
                                                className={cn(
                                                    "text-left px-4 py-3 rounded-xl text-xs transition-all flex flex-col gap-1 border",
                                                    selectedVersionId === v.id
                                                        ? "bg-background border-primary/20 text-foreground shadow-sm ring-1 ring-primary/10"
                                                        : "border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span className={cn("font-bold text-sm", selectedVersionId === v.id ? "text-primary" : "")}>v{v.version}</span>
                                                    <span className="text-[10px] opacity-70 font-mono">{format(new Date(v.discovered_at), 'MMM dd')}</span>
                                                </div>
                                                <span className="truncate opacity-70 text-[10px] flex items-center gap-1">
                                                    <RefreshCw className="h-2.5 w-2.5" /> Auto-detected change
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Main: JSON Viewer */}
                            <div className="flex-1 flex flex-col min-w-0 bg-card">
                                <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0 flex flex-row items-center justify-between space-y-0">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20">
                                            <FileJson className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-base font-semibold text-foreground">
                                                {asset.name}
                                            </DialogTitle>
                                            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                Schema Definition
                                                {selectedSchema && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-border" />
                                                        <span>Discovered {formatDistanceToNow(new Date(selectedSchema.discovered_at))} ago</span>
                                                    </>
                                                )}
                                            </DialogDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {selectedSchema && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopyJson}
                                                className="h-8 gap-2 text-xs border-border/50 bg-background/50 backdrop-blur-sm"
                                            >
                                                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                                {copied ? "Copied" : "Copy JSON"}
                                            </Button>
                                        )}
                                    </div>
                                </DialogHeader>

                                <div className="flex-1 overflow-auto p-0 relative group bg-[#09090b]">
                                    {/* Note: We keep the background dark (#09090b) for the code block specifically, 
                                        as developer tools usually favor dark mode for code readability even in light themes. */}
                                    {selectedSchema ? (
                                        <pre className="p-6 text-xs font-mono text-blue-300 leading-relaxed">
                                            {JSON.stringify(selectedSchema.json_schema, null, 2)}
                                        </pre>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                                            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                                                <Terminal className="h-8 w-8 opacity-20" />
                                            </div>
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

// Helper Icon for History Sidebar
const HistoryIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
    </svg>
);