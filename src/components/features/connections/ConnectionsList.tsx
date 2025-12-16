/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card'; // Import Card
import {
    Plus, Trash2, ExternalLink, Server,
    RefreshCw, Settings2, Pencil, Plug, ArrowRight
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
        <div className="flex-1 min-h-0 w-full">
            <ScrollArea className="h-full w-full">
                <div className="p-6 pb-20">
                    <div className={cn(
                        "grid gap-6",
                        viewMode === 'grid'
                            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "grid-cols-1"
                    )}>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <Card key={i} className="h-52 rounded-[2rem] border-border/40 bg-card/40 p-6 space-y-4 shadow-none">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-14 w-14 rounded-2xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                </Card>
                            ))
                        ) : connections.length === 0 ? (
                            <Card className="col-span-full h-[50vh] flex flex-col items-center justify-center text-center p-8 rounded-[2rem] border-dashed border-border/50 bg-card/30">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                    <div className="relative h-24 w-24 bg-muted/50 border border-border rounded-[2rem] flex items-center justify-center shadow-lg backdrop-blur-sm">
                                        <Plug className="h-10 w-10 text-muted-foreground/50" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-foreground">No Connections</h3>
                                <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
                                    You haven't configured any data sources yet. Create one to start building pipelines.
                                </p>
                                <Button onClick={onCreate} className="gap-2 rounded-full px-8 h-10 shadow-lg shadow-primary/20">
                                    <Plus className="h-4 w-4" /> Add First Connection
                                </Button>
                            </Card>
                        ) : (
                            connections.map((conn) => {
                                const meta = CONNECTOR_META[conn.type] || {
                                    icon: <Server />, name: conn.type, color: "bg-muted text-muted-foreground"
                                };
                                const isTesting = testingId === conn.id;

                                return (
                                    <Card
                                        key={conn.id}
                                        className={cn(
                                            "group relative flex transition-all duration-300",
                                            "border-border/50 bg-card/50 backdrop-blur-sm",
                                            // Hover effects
                                            "hover:bg-card/80 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
                                            viewMode === 'grid'
                                                ? "flex-col rounded-[2rem] p-6"
                                                : "flex-row items-center rounded-3xl p-4 gap-6"
                                        )}
                                    >
                                        {/* Link Overlay for Card Click */}
                                        <Link
                                            to={`/connections/${conn.id}`}
                                            className="absolute inset-0 z-0 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            aria-label={`View ${conn.name}`}
                                        />

                                        {/* Header Section */}
                                        <div className={cn(
                                            "flex items-start justify-between relative z-10 pointer-events-none",
                                            viewMode === 'list' && "w-[300px] shrink-0"
                                        )}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-14 w-14 rounded-2xl flex items-center justify-center border border-border/10 shadow-inner transition-transform duration-300 group-hover:scale-110",
                                                    meta.color
                                                )}>
                                                    <SafeIcon icon={meta.icon} className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-base text-foreground truncate max-w-48 group-hover:text-primary transition-colors">
                                                        {conn.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <span className="capitalize font-medium opacity-80">{meta.name || conn.type}</span>
                                                        <span className="w-1 h-1 rounded-full bg-border" />
                                                        <span className="font-mono opacity-50">#{conn.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content/Description Section */}
                                        <div className={cn(
                                            "flex-1 relative z-10 pointer-events-none",
                                            viewMode === 'grid' ? "mt-5 mb-5" : "px-4 border-l border-border/50"
                                        )}>
                                            {viewMode === 'grid' ? (
                                                <p className="text-sm text-muted-foreground/80 line-clamp-2 h-10 leading-relaxed">
                                                    {conn.description || <span className="italic opacity-40">No description provided</span>}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground truncate max-w-md">{conn.description}</p>
                                            )}

                                            {viewMode === 'grid' && (
                                                <div className="mt-5 flex items-center justify-between">
                                                    <StatusBadge status={conn.status || 'active'} />

                                                    {/* Hover Action Indicator */}
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-semibold text-primary">
                                                        Details <ArrowRight className="h-3 w-3" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions Section */}
                                        <div className={cn(
                                            "flex items-center gap-2 relative z-20", // z-20 ensures buttons are above the Link overlay
                                            viewMode === 'grid' ? "pt-4 border-t border-border/40 mt-auto" : "ml-auto"
                                        )}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "text-xs h-9 bg-background/50 border-border/50 hover:bg-background hover:text-primary hover:border-primary/30 shadow-sm",
                                                    viewMode === 'grid' && "flex-1"
                                                )}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onTest(conn.id);
                                                }}
                                                disabled={isTesting}
                                            >
                                                {isTesting ? (
                                                    <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin text-primary" />
                                                ) : (
                                                    <ExternalLink className="mr-2 h-3.5 w-3.5 opacity-70" />
                                                )}
                                                {isTesting ? "Testing..." : "Test"}
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                    >
                                                        <Settings2 className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/60 bg-background/95 backdrop-blur-md shadow-xl">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(conn); }}>
                                                        <Pencil className="mr-2 h-3.5 w-3.5" /> Configure
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border/50" />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                        onClick={(e) => { e.stopPropagation(); onDelete(conn.id); }}
                                                    >
                                                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};