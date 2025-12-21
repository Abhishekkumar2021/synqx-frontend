/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConnections, getConnection, deleteConnection, testConnection } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus, XCircle, ShieldCheck, Search,
    LayoutGrid, List, Link as LinkIcon, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    Dialog, DialogContent
} from "@/components/ui/dialog";
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
import { CreateConnectionDialog } from '@/components/features/connections/CreateConnectionDialog';
import { ConnectionsList } from '@/components/features/connections/ConnectionsList';
import { PageMeta } from '@/components/common/PageMeta';

export const ConnectionsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [connectionToDelete, setConnectionToDelete] = useState<number | null>(null);
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
            toast.success('Connection deleted successfully');
        },
    });

    const handleEdit = async (connection: any) => {
        try {
            // Fetch full details including config
            const fullConnection = await getConnection(connection.id);
            setEditingConnection(fullConnection);
            setIsDialogOpen(true);
        } catch (e) {
            toast.error("Failed to load connection details");
        }
    };

    const handleCreate = () => {
        setEditingConnection(null);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setConnectionToDelete(id);
        setIsDeleteAlertOpen(true);
    };

    const confirmDelete = () => {
        if (connectionToDelete) {
            deleteMutation.mutate(connectionToDelete);
            setConnectionToDelete(null);
            setIsDeleteAlertOpen(false);
        }
    };

    const handleTest = async (id: number) => {
        setTestingId(id);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Min loader time
            const res = await testConnection(id, {});
            if (res.success) {
                toast.success("Connection Healthy", {
                    icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />
                });
            } else {
                toast.error("Connection Failed", { description: res.message });
            }
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
            c.connector_type.toLowerCase().includes(filter.toLowerCase())
        );
    }, [connections, filter]);

    // Error State
    if (error) return (
        <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto ring-1 ring-destructive/20 shadow-lg">
                    <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <h3 className="text-xl font-bold">Failed to load connections</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                    Please check your network settings and try again.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
                    <Loader2 className="h-4 w-4" /> Retry
                </Button>
            </div>
        </div>
    );

    return (
        // Root container with fixed height constraints to force inner scrolling
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-700">
            <PageMeta title="Connections" description="Manage data sources and destinations." />

            {/* --- Header Section --- */}
            <div className="flex items-center justify-between shrink-0 px-1">
                <div className="space-y-1.5">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 backdrop-blur-md shadow-sm">
                            <LinkIcon className="h-5 w-5 text-primary" />
                        </div>
                        Connections
                    </h2>
                    <p className="text-base text-muted-foreground font-medium pl-1">
                        Manage authentication and configuration for your data sources.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Button
                        size="sm"
                        onClick={handleCreate}
                        className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Connection
                    </Button>
                    <DialogContent className="max-w-5xl h-[700px] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-[2rem] border-border/60 bg-background/80 backdrop-blur-3xl shadow-2xl">
                        <CreateConnectionDialog
                            initialData={editingConnection}
                            onClose={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* --- Main Content Pane (Glass/Ceramic) --- */}
            {/* flex-1 min-h-0 is CRITICAL for nested scrolling */}
            <div className="flex-1 min-h-0 flex flex-col bg-card/40 backdrop-blur-2xl rounded-[2rem] border border-border/60 shadow-xl overflow-hidden relative">

                {/* Toolbar */}
                <div className="p-4 border-b border-border/40 bg-muted/20 flex gap-4 items-center justify-between shrink-0">
                    <div className="relative w-full max-w-sm group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                        <Input
                            placeholder="Filter connections..."
                            className="pl-9 h-10 rounded-xl bg-background/50 border-transparent focus:bg-background focus:border-primary/30 transition-all"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-background/50 border border-border/40 rounded-xl p-1 shadow-sm">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-lg transition-all",
                                viewMode === 'grid' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:bg-muted"
                            )}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-lg transition-all",
                                viewMode === 'list' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:bg-muted"
                            )}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>


                <ConnectionsList
                    connections={filteredConnections}
                    isLoading={isLoading}
                    viewMode={viewMode}
                    testingId={testingId}
                    onTest={handleTest}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCreate={handleCreate}
                />
            </div>

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Connection?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this connection? Pipelines using this connection may fail immediately. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setConnectionToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};