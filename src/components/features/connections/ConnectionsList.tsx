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
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className={cn("grid gap-6", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 rounded-[2rem] border border-white/5 bg-white/5 p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
                            </div>
                            <Skeleton className="h-14 w-full rounded-xl" />
                        </div>
                    ))
                ) : connections.length === 0 ? (
                    <div className="col-span-full h-[400px] flex flex-col items-center justify-center text-center p-8">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                            <div className="relative h-20 w-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                                <Plug className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-foreground">No Connections</h3>
                        <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
                            You haven't configured any data sources yet. Create one to start building pipelines.
                        </p>
                        <Button onClick={onCreate} className="gap-2 rounded-full px-6 shadow-lg shadow-primary/20">
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
                                    "group relative flex bg-card/40 backdrop-blur-md border border-white/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 overflow-hidden",
                                    viewMode === 'grid' ? "flex-col rounded-[2rem] p-6" : "flex-row items-center rounded-3xl p-4 gap-6"
                                )}
                            >
                                {/* Decorative Glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent blur-3xl rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className={cn("flex items-start justify-between relative z-10", viewMode === 'list' && "w-[300px] shrink-0")}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner transition-transform duration-300 group-hover:scale-110", meta.color)}>
                                            {/* SAFE CLONE usage */}
                                            <SafeIcon icon={meta.icon} className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-foreground truncate max-w-48 group-hover:text-primary transition-colors">{conn.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <span className="capitalize font-medium opacity-80">{meta.name || conn.type}</span>
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                <span className="font-mono opacity-50">#{conn.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={cn("flex-1 relative z-10", viewMode === 'grid' ? "mt-5 mb-5" : "px-4 border-l border-white/5")}>
                                    {viewMode === 'grid' ? (
                                        <p className="text-sm text-muted-foreground/80 line-clamp-2 h-10 leading-relaxed">
                                            {conn.description || <span className="italic opacity-40">No description provided</span>}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground truncate">{conn.description}</p>
                                    )}
                                    
                                    {viewMode === 'grid' && (
                                        <div className="mt-5 flex items-center gap-2">
                                            <StatusBadge status={conn.status || 'active'} />
                                        </div>
                                    )}
                                </div>

                                <div className={cn("flex items-center gap-2 relative z-10", viewMode === 'grid' ? "pt-4 border-t border-white/5 mt-auto" : "ml-auto")}>
                                    <Button
                                        variant="outline" size="sm"
                                        className={cn("text-xs h-9 bg-white/5 border-white/10 hover:bg-white/10 hover:text-primary hover:border-primary/20", viewMode === 'grid' && "flex-1")}
                                        onClick={() => onTest(conn.id)}
                                        disabled={isTesting}
                                    >
                                        {isTesting ? (
                                            <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin text-primary" />
                                        ) : (
                                            <ExternalLink className="mr-2 h-3.5 w-3.5 opacity-70" />
                                        )}
                                        {isTesting ? "Testing..." : "Test Connection"}
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10">
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