/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, Download, Plus, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { CreateAssetsDialog } from '@/components/features/connections/CreateAssetsDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sparkles, Database } from 'lucide-react';
import { bulkCreateAssets, type Asset } from '@/lib/api';

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
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedDiscovered, setSelectedDiscovered] = useState<Set<string>>(new Set());
    
    const queryClient = useQueryClient();

    const filteredDiscovered = useMemo(() => {
        return discoveredAssets.filter(asset =>
            asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (asset.fully_qualified_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (asset.type || asset.asset_type)?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [discoveredAssets, searchQuery]);

    const handleSelectDiscovered = (name: string, checked: boolean) => {
        setSelectedDiscovered(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(name);
            } else {
                newSet.delete(name);
            }
            return newSet;
        });
    };

    const handleSelectAllDiscovered = (checked: boolean) => {
        if (checked) {
            setSelectedDiscovered(new Set(filteredDiscovered.map(a => a.name)));
        } else {
            setSelectedDiscovered(newSet());
        }
    };

    const bulkImportMutation = useMutation({
        mutationFn: async ({ assetNames, asDestination }: { assetNames: string[], asDestination: boolean }) => {
            const assetsToCreate = assetNames.map(name => {
                const discovered = discoveredAssets.find(a => a.name === name);
                return {
                    name,
                    fully_qualified_name: discovered?.fully_qualified_name || name,
                    asset_type: discovered?.type || discovered?.asset_type || 'table',
                    is_source: !asDestination,
                    is_destination: asDestination,
                };
            });
            return bulkCreateAssets(connectionId, { assets: assetsToCreate });
        },
        onSuccess: (data) => {
            if (data.successful_creates > 0) {
                toast.success("Bulk Import Successful", {
                    description: `${data.successful_creates} of ${data.total_requested} assets were created.`,
                });
            }
            if (data.failed_creates > 0) {
                toast.warning("Some assets failed to import", {
                    description: `${data.failed_creates} assets could not be created.`,
                });
            }
            queryClient.invalidateQueries({ queryKey: ['assets', connectionId] });
            const successfulNames = new Set(
                [...selectedDiscovered].filter(
                    name => !data.failures.some((f: { name: string; reason: string }) => f.name === name)
                )
            );
            setDiscoveredAssets(discoveredAssets.filter(a => !successfulNames.has(a.name)));
            setSelectedDiscovered(new Set());
        },
        onError: (err: any) => {
            toast.error("Bulk Import Failed", {
                description: err.response?.data?.detail?.message || "An unexpected error occurred."
            });
        }
    });

    return (
        <Card className="h-full flex flex-col glass-card border-border/60 shadow-lg overflow-hidden rounded-3xl">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-5 px-6 border-b border-border/40 bg-linear-to-b from-muted/30 to-transparent backdrop-blur-sm shrink-0 gap-4">
                <div className="space-y-1.5">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Layers className="h-4 w-4" />
                        </div>
                        Assets Registry
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">
                        <span className="text-foreground font-semibold">{assets?.length || 0}</span> managed assets • <span className="text-amber-600 dark:text-amber-500 font-semibold">{discoveredAssets.length}</span> discovered
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                            placeholder="Search by name or type..."
                            className="pl-10 h-10 glass-input border-border/50 rounded-xl shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                     <Button
                        onClick={onDiscover}
                        size="icon"
                        variant="outline"
                        className="rounded-xl border-border/50 shadow-sm shrink-0 hover:border-primary/30 hover:bg-primary/5 transition-all h-10 w-10"
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                    <Button 
                        size="sm" 
                        className="rounded-xl shadow-lg shadow-primary/20 h-10 px-4 gap-2" 
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Asset</span>
                    </Button>
                </div>
            </CardHeader>

            <CreateAssetsDialog 
                connectionId={connectionId}
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />

            <CardContent className="flex-1 p-0 overflow-hidden">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent">
                    <AnimatePresence>
                        {filteredDiscovered.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="relative"
                            >
                                <div className="sticky top-0 z-10 px-6 py-3 bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border-y border-amber-500/20 backdrop-blur-md flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500">
                                            <Sparkles className="h-4 w-4" />
                                        </div>
                                        <h3 className="text-sm font-bold text-amber-700 dark:text-amber-500">
                                            Discovered Assets
                                        </h3>
                                    </div>
                                    {selectedDiscovered.size > 0 ? (
                                         <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/30 font-semibold">
                                                {selectedDiscovered.size} selected
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        size="sm" 
                                                        className="h-8 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-500 border border-amber-500/30 shadow-sm gap-2" 
                                                        disabled={bulkImportMutation.isPending}
                                                    >
                                                        {bulkImportMutation.isPending ? (
                                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Download className="h-3.5 w-3.5" />
                                                        )}
                                                        Import
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl">
                                                    <DropdownMenuItem onClick={() => bulkImportMutation.mutate({ assetNames: Array.from(selectedDiscovered), asDestination: false })}>
                                                        <Database className="mr-2 h-3.5 w-3.5" />
                                                        As Source(s)
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => bulkImportMutation.mutate({ assetNames: Array.from(selectedDiscovered), asDestination: true })}>
                                                        <Download className="mr-2 h-3.5 w-3.5" />
                                                        As Destination(s)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                         </div>
                                    ) : (
                                        <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/5 font-semibold">
                                            {filteredDiscovered.length} Found
                                        </Badge>
                                    )}
                                </div>
                                <Table >
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-border/30">
                                            <TableHead className="w-12 pl-6">
                                                <Checkbox
                                                    checked={selectedDiscovered.size > 0 && selectedDiscovered.size === filteredDiscovered.length}
                                                    onCheckedChange={(checked) => handleSelectAllDiscovered(Boolean(checked))}
                                                    className="border-amber-500/30"
                                                />
                                            </TableHead>
                                            <TableHead className="w-[50%] font-bold text-xs">Asset Name</TableHead>
                                            <TableHead className="font-bold text-xs">Type</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDiscovered.map((asset, idx) => (
                                            <TableRow 
                                                key={idx} 
                                                className={cn(
                                                    "hover:bg-amber-500/5 transition-colors border-b border-border/20",
                                                    selectedDiscovered.has(asset.name) && "bg-amber-500/5"
                                                )}
                                            >
                                                <TableCell className="pl-6">
                                                    <Checkbox
                                                        checked={selectedDiscovered.has(asset.name)}
                                                        onCheckedChange={(checked) => handleSelectDiscovered(asset.name, Boolean(checked))}
                                                        className="border-amber-500/30"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">{asset.name}</span>
                                                        {asset.fully_qualified_name && asset.fully_qualified_name !== asset.name && (
                                                            <span className="text-[10px] text-muted-foreground/60 font-mono truncate max-w-[250px]">
                                                                {asset.fully_qualified_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize text-[10px] font-semibold bg-muted/50 border-border/40">
                                                        {asset.type || asset.asset_type}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
};

export default AssetsTabContent;
