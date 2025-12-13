/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConnections, deleteConnection, testConnection } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus, XCircle, ShieldCheck, Search,
    LayoutGrid, List, Link as LinkIcon} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    Dialog, DialogContent
} from "@/components/ui/dialog";
import { CreateConnectionDialog } from '@/components/connections/CreateConnectionDialog';
import { ConnectionsList } from '@/components/connections/ConnectionsList';

export const ConnectionsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
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

    const handleEdit = (connection: any) => {
        setEditingConnection(connection);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingConnection(null);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        toast('Delete this connection?', {
            description: "Pipelines using this connection may break.",
            action: {
                label: 'Delete',
                onClick: () => deleteMutation.mutate(id)
            },
            cancel: { label: 'Cancel', onClick: () => { } },
        });
    };

    const handleTest = async (id: number) => {
        setTestingId(id);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const res = await testConnection(id, {});
            if (res.success) toast.success("Connection Healthy", { icon: <ShieldCheck className="h-4 w-4 text-emerald-500" /> });
            else toast.error("Connection Failed", { description: res.message });
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
            c.type.toLowerCase().includes(filter.toLowerCase())
        );
    }, [connections, filter]);

    if (error) return (
        <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-2">
                <XCircle className="h-8 w-8 text-destructive mx-auto" />
                <h3 className="text-lg font-semibold">Failed to load connections</h3>
                <p className="text-muted-foreground">Please check your network settings.</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg ring-1 ring-primary/20">
                            <LinkIcon className="h-5 w-5 text-primary" />
                        </div>
                        Connections
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage authentication and configuration for your data sources.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Button size="sm" onClick={handleCreate} className="shadow-[0_0_15px_-5px_var(--color-primary)]">
                        <Plus className="mr-2 h-4 w-4" /> New Connection
                    </Button>
                    <DialogContent className="max-w-5xl h-[700px] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl">
                        <CreateConnectionDialog
                            initialData={editingConnection}
                            onClose={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 min-h-0 flex flex-col bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 border-b border-border/50 bg-muted/5 flex gap-4 items-center justify-between shrink-0">
                    <div className="relative w-full max-w-sm group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Filter connections..."
                            className="pl-9 h-9 bg-background/50 focus:bg-background border-muted-foreground/20 focus:border-primary/50"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg p-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-7 w-7 rounded-md transition-all", viewMode === 'grid' ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-muted")} 
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-7 w-7 rounded-md transition-all", viewMode === 'list' ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-muted")} 
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Connection List */}
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
        </div>
    );
};