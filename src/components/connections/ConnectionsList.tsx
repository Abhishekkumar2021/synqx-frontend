/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Plus, Trash2, ExternalLink, Server,
    RefreshCw, Settings2, Pencil, Plug
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { CONNECTOR_META, SafeIcon } from '@/lib/connector-definitions';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ConnectionsListProps {
    connections: any[];
    isLoading: boolean;
    viewMode: 'grid' | 'list';
    testingId: number | null;
    onTest: (id: number) => void;
    onEdit: (connection: any) => void;
    onDelete: (id: number) => void;
    onCreate: () => void;
}

export const ConnectionsList: React.FC<ConnectionsListProps> = ({
    connections,
    isLoading,
    viewMode,
    testingId,
    onTest,
    onEdit,
    onDelete,
    onCreate
}) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className={cn("grid gap-4", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-40 rounded-xl border border-border/40 bg-card p-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
                            </div>
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ))
                ) : connections.length === 0 ? (
                    <div className="col-span-full h-[400px] flex flex-col items-center justify-center text-center p-8">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                            <div className="relative h-20 w-20 bg-card border rounded-2xl flex items-center justify-center shadow-lg">
                                <Plug className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">No Connections</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            You haven't configured any data sources yet. Create one to start building pipelines.
                        </p>
                        <Button onClick={onCreate} className="gap-2">
                            <Plus className="h-4 w-4" /> Add First Connection
                        </Button>
                    </div>
                ) : (
                    connections.map((conn) => {
                        const meta = CONNECTOR_META[conn.type] || { 
                            icon: <Server />, name: conn.type, color: "bg-muted text-muted-foreground" 
                        };
                        const isTesting = testingId === conn.id;

                        return (
                            <div
                                key={conn.id}
                                className={cn(
                                    "group relative flex bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5",
                                    viewMode === 'grid' ? "flex-col rounded-xl p-5" : "flex-row items-center rounded-lg p-4 gap-6"
                                )}
                            >
                                <div className={cn("flex items-start justify-between", viewMode === 'list' && "w-[300px] shrink-0")}>
                                    <div className="flex items-center gap-3.5">
                                        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105", meta.color)}>
                                            {/* SAFE CLONE usage */}
                                            <SafeIcon icon={meta.icon} className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm text-foreground truncate max-w-40">{conn.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                <span className="capitalize">{meta.name || conn.type}</span>
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                <span className="font-mono opacity-70">ID: {conn.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={cn("flex-1", viewMode === 'grid' ? "mt-4 mb-4" : "px-4 border-l border-border/40")}>
                                    {viewMode === 'grid' ? (
                                        <p className="text-xs text-muted-foreground line-clamp-2 h-8 leading-relaxed">
                                            {conn.description || <span className="italic opacity-50">No description provided</span>}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground truncate">{conn.description}</p>
                                    )}
                                    
                                    {viewMode === 'grid' && (
                                        <div className="mt-4 flex items-center gap-2">
                                            <StatusBadge status={conn.status || 'active'} />
                                        </div>
                                    )}
                                </div>

                                <div className={cn("flex items-center gap-2", viewMode === 'grid' ? "pt-3 border-t border-border/40 mt-auto" : "ml-auto")}>
                                    <Button
                                        variant="outline" size="sm"
                                        className={cn("text-xs h-8 bg-transparent border-border/50 hover:bg-muted/50", viewMode === 'grid' && "flex-1")}
                                        onClick={() => onTest(conn.id)}
                                        disabled={isTesting}
                                    >
                                        {isTesting ? (
                                            <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin text-primary" />
                                        ) : (
                                            <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                        )}
                                        {isTesting ? "Testing..." : "Test"}
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                                                <Settings2 className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => onEdit(conn)}>
                                                <Pencil className="mr-2 h-3.5 w-3.5" /> Configure
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete(conn.id)}>
                                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
