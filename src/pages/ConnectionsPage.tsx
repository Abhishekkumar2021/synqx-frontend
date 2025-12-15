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
import { CreateConnectionDialog } from '@/components/features/connections/CreateConnectionDialog';
import { ConnectionsList } from '@/components/features/connections/ConnectionsList';
import { PageMeta } from '@/components/common/PageMeta';

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
            <div className="text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                     <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <h3 className="text-xl font-bold">Failed to load connections</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">Please check your network settings and try again.</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-9rem)] gap-8 animate-in fade-in duration-700">
            <PageMeta title="Connections" description="Manage data sources and destinations." />

            {/* Header */}
            <div className="flex items-center justify-between shrink-0 px-1">
                <div className="space-y-2">
                    <h2 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-foreground to-foreground/50 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-2xl ring-1 ring-white/10 backdrop-blur-md">
                            <LinkIcon className="h-6 w-6 text-primary" />
                        </div>
                        Connections
                    </h2>
                    <p className="text-base text-muted-foreground/80 font-medium pl-1">
                        Manage authentication and configuration for your data sources.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Button size="lg" onClick={handleCreate} className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105">
                        <Plus className="mr-2 h-5 w-5" /> New Connection
                    </Button>
                    <DialogContent className="max-w-5xl h-[700px] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-[2rem] border-white/10 bg-background/80 backdrop-blur-3xl shadow-2xl">
                        <CreateConnectionDialog
                            initialData={editingConnection}
                            onClose={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main Content Pane (Glass) */}
            <div className="flex-1 min-h-0 flex flex-col bg-card/40 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative">

                {/* Toolbar */}
                <div className="p-6 border-b border-white/5 bg-white/5 flex gap-6 items-center justify-between shrink-0">
                    <div className="relative w-full max-w-md group">
                        <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Filter connections..."
                            className="pl-11 h-11 rounded-2xl bg-black/5 dark:bg-white/5 border-transparent focus:bg-background focus:border-primary/30 transition-all"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 border border-white/5 rounded-2xl p-1.5">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-8 w-8 rounded-xl transition-all", viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-white/5")} 
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-8 w-8 rounded-xl transition-all", viewMode === 'list' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-white/5")} 
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
