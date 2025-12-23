import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConnectionSchemaMetadata } from '@/lib/api';
import { 
    Database, Search, ChevronRight, 
    Table as TableIcon, Columns, AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SchemaBrowserProps {
    connectionId: number | null;
    onTableClick: (table: string) => void;
}

export const SchemaBrowser: React.FC<SchemaBrowserProps> = ({ connectionId, onTableClick }) => {
    const { data: metadata, isLoading, isError, refetch } = useQuery({
        queryKey: ['schema-metadata', connectionId],
        queryFn: () => getConnectionSchemaMetadata(connectionId!),
        enabled: !!connectionId,
        retry: 1
    });

    const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState('');

    const filteredMetadata = useMemo(() => {
        if (!metadata) return null;
        if (!filter) return metadata.metadata;
        
        const filtered: Record<string, string[]> = {};
        Object.entries(metadata.metadata).forEach(([table, columns]) => {
            if (table.toLowerCase().includes(filter.toLowerCase()) || 
                columns.some(c => c.toLowerCase().includes(filter.toLowerCase()))) {
                filtered[table] = columns;
            }
        });
        return filtered;
    }, [metadata, filter]);

    const toggleTable = (table: string) => {
        const next = new Set(expandedTables);
        if (next.has(table)) next.delete(table);
        else next.add(table);
        setExpandedTables(next);
    };

    if (!connectionId) return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 opacity-30">
            <div className="p-4 rounded-3xl bg-muted/20">
                <Database className="h-10 w-10" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em]">Select Connection</p>
        </div>
    );

    if (isLoading) return (
        <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-full rounded-xl" />
            <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 flex-1 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );

    if (isError) return (
        <div className="p-6 text-center space-y-3 text-card-foreground">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto opacity-50" />
            <p className="text-xs font-semibold text-muted-foreground leading-relaxed">Failed to retrieve schema metadata.</p>
            <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-lg border-border/40"
                onClick={() => refetch()}
            >
                Retry Discovery
            </Button>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 text-card-foreground">
            <div className="p-3 border-b border-border/40 bg-muted/5 shrink-0">
                <div className="relative group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Filter schema..."
                        className="h-8 pl-8 rounded-lg bg-background/50 border-border/40 text-[11px] font-medium shadow-none focus:ring-4 focus:ring-primary/5 transition-all"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                    {filteredMetadata && Object.entries(filteredMetadata).map(([table, columns]) => (
                        <div key={table} className="space-y-0.5">
                            <button
                                onClick={() => toggleTable(table)}
                                onDoubleClick={() => onTableClick(table)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-bold transition-all hover:bg-muted/50 group/table text-left",
                                    expandedTables.has(table) ? "text-primary bg-primary/5" : "text-muted-foreground/80 hover:text-foreground"
                                )}
                            >
                                <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform duration-200", expandedTables.has(table) && "rotate-90 text-primary")} />
                                <TableIcon className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover/table:opacity-100 transition-opacity" />
                                <span className="truncate flex-1">{table}</span>
                                <Badge variant="outline" className="ml-auto h-4 text-[8px] px-1.5 font-bold bg-background/50 border-border/20 opacity-0 group-hover/table:opacity-100 transition-opacity">
                                    {columns.length}
                                </Badge>
                            </button>
                            <AnimatePresence initial={false}>
                                {expandedTables.has(table) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden pl-7 border-l ml-3.5 border-border/20 mt-0.5"
                                    >
                                        {columns.map(col => (
                                            <div 
                                                key={col} 
                                                className="flex items-center gap-2 px-2 py-1 text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors group/col cursor-pointer"
                                                onClick={() => onTableClick(col)}
                                            >
                                                <Columns className="h-2.5 w-2.5 opacity-20 group-hover/col:opacity-60" />
                                                <span className="truncate">{col}</span>
                                            </div>
                                        ))}
                                        {columns.length === 0 && (
                                            <span className="text-[10px] italic opacity-30 py-1 block pl-2 font-medium">No columns</span>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};
