import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConnectionSchemaMetadata } from '@/lib/api';
import {
    Database, Search, ChevronRight,
    Columns, AlertCircle, RefreshCcw, Box,
    MoreHorizontal, Copy,
    FilePlus, PlayCircle, FileCode
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SchemaBrowserProps {
    connectionId: number | null;
    onAction: (type: 'run' | 'insert', sql: string) => void;
}

export const SchemaBrowser: React.FC<SchemaBrowserProps> = ({ connectionId, onAction }) => {
    const { data: metadata, isLoading, isError, refetch, isFetching } = useQuery({
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

        const lowFilter = filter.toLowerCase();
        const filtered: Record<string, string[]> = {};
        Object.entries(metadata.metadata).forEach(([table, columns]) => {
            if (table.toLowerCase().includes(lowFilter) ||
                columns.some(c => c.toLowerCase().includes(lowFilter))) {
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

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    if (!connectionId) return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6 isolate">
            <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-colors" />
                <div className="relative p-6 rounded-[2.5rem] bg-muted/10 border border-white/5 shadow-2xl backdrop-blur-md">
                    <Database className="h-10 w-10 text-muted-foreground/30" />
                </div>
            </div>
            <div className="space-y-1.5">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/60">Initialize Registry</p>
                <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">Select connection to browse</p>
            </div>
        </div>
    );

    if (isLoading) return (
        <div className="p-5 space-y-5 animate-in fade-in duration-500">
            <Skeleton className="h-9 w-full rounded-xl bg-muted/20" />
            <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="flex gap-3 px-2">
                        <Skeleton className="h-4 w-4 rounded-md bg-muted/20" />
                        <Skeleton className="h-4 flex-1 rounded-md bg-muted/10" />
                    </div>
                ))}
            </div>
        </div>
    );

    if (isError) return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-6 w-6 text-destructive/60" />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Metadata Blocked</p>
                <p className="text-[9px] font-medium text-muted-foreground leading-relaxed px-4 max-w-[200px]">The secure endpoint rejected the discovery request.</p>
            </div>
            <Button
                size="sm"
                variant="outline"
                className="h-8 px-5 font-black uppercase text-[9px] tracking-[0.2em] rounded-xl border-border/40 hover:bg-destructive/5 hover:text-destructive transition-all"
                onClick={() => refetch()}
            >
                Retry handshake
            </Button>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background/20 backdrop-blur-md relative overflow-hidden isolate">
            {/* Top Internal Light (Refractive Edge) */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/20 dark:bg-white/5 pointer-events-none z-20" />

            <div className="p-4 border-b border-border/40 bg-muted/10 backdrop-blur-xl shrink-0 flex items-center justify-between gap-3">
                <div className="relative group flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-all z-10" />
                    <Input
                        placeholder="Search Catalog..."
                        className="h-9 pl-9 rounded-xl bg-background/40 border-border/40 text-[11px] font-bold tracking-tight shadow-none focus:ring-4 focus:ring-primary/5 transition-all"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-9 w-9 rounded-xl transition-all border border-border/20", isFetching && "bg-primary/5")}
                            onClick={() => refetch()}
                        >
                            <RefreshCcw className={cn("h-3.5 w-3.5 text-muted-foreground", isFetching && "animate-spin text-primary")} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh Schema</TooltipContent>
                </Tooltip>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar select-none">
                <div className="p-3 space-y-1">
                    {filteredMetadata && Object.entries(filteredMetadata).map(([table, columns], idx) => (
                        <div key={table} className="relative group/wrapper">
                            <div className="relative flex items-center">
                                <motion.button
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.01 }}
                                    onClick={() => toggleTable(table)}
                                    onDoubleClick={() => onAction('run', `SELECT * FROM ${table} LIMIT 50;`)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all group/table text-left pr-10",
                                        expandedTables.has(table)
                                            ? "text-primary bg-primary/5 shadow-sm ring-1 ring-primary/10"
                                            : "text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground"
                                    )}
                                >
                                    <ChevronRight className={cn(
                                        "h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-in-out",
                                        expandedTables.has(table) && "rotate-90 text-primary"
                                    )} />
                                    <Box className={cn(
                                        "h-3.5 w-3.5 shrink-0 transition-opacity",
                                        expandedTables.has(table) ? "opacity-100" : "opacity-30 group-hover/table:opacity-100"
                                    )} />
                                    <span className="truncate flex-1 italic tracking-tighter">{table}</span>
                                    <span className="text-[9px] font-mono font-black opacity-20 group-hover/table:opacity-100 transition-opacity">
                                        {columns.length}
                                    </span>
                                </motion.button>
                                
                                <div className="absolute right-2 opacity-0 group-hover/wrapper:opacity-100 transition-opacity z-10">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-background/80">
                                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-48 glass-panel border-border/40 rounded-xl" align="end">
                                            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest opacity-40">Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => onAction('run', `SELECT * FROM ${table} LIMIT 100;`)} className="gap-2 text-[10px] font-bold uppercase tracking-wide">
                                                <PlayCircle size={12} className="text-primary" /> Select Top 100
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => onAction('insert', `INSERT INTO ${table} (${columns.join(', ')})\nVALUES (${columns.map(() => 'NULL').join(', ')});`)} 
                                                className="gap-2 text-[10px] font-bold uppercase tracking-wide"
                                            >
                                                <FilePlus size={12} className="text-muted-foreground" /> Generate INSERT
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onAction('insert', `SELECT * FROM ${table}`)} className="gap-2 text-[10px] font-bold uppercase tracking-wide">
                                                <FileCode size={12} className="text-muted-foreground" /> Generate SELECT
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleCopy(table)} className="gap-2 text-[10px] font-bold uppercase tracking-wide">
                                                <Copy size={12} className="text-muted-foreground" /> Copy Name
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <AnimatePresence initial={false}>
                                {expandedTables.has(table) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                        className="overflow-hidden relative pl-6 ml-4.5 border-l border-primary/20 mt-1 space-y-0.5"
                                    >
                                        {/* Guide highlight line (Visual Anchor) */}
                                        <div className="absolute left-0 top-0 bottom-2 w-px bg-primary shadow-[0_0_10px_var(--color-primary)] opacity-20" />

                                        {columns.map((col) => (
                                            <div
                                                key={col}
                                                className="flex items-center gap-3 px-3 py-1.5 text-[10px] font-bold text-muted-foreground/50 hover:text-foreground hover:bg-primary/3 rounded-lg transition-all group/col cursor-pointer justify-between group/cell"
                                                onClick={() => onAction('insert', col)}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <Columns className="h-3 w-3 opacity-20 group-hover/col:opacity-80 group-hover/col:text-primary transition-all shrink-0" />
                                                    <span className="truncate font-mono tracking-tight">{col}</span>
                                                </div>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-4 w-4 opacity-0 group-hover/cell:opacity-100 transition-opacity"
                                                            onClick={(e) => { e.stopPropagation(); handleCopy(col); }}
                                                        >
                                                            <Copy className="h-2.5 w-2.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="left">Copy Column</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        ))}
                                        {columns.length === 0 && (
                                            <span className="text-[9px] font-black uppercase opacity-20 py-2 block pl-3 tracking-widest italic">Node Empty</span>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            {/* Catalog Info Footer */}
            <div className="px-5 py-3 border-t border-border/40 bg-muted/5 backdrop-blur-sm shrink-0 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-muted-foreground/30 tracking-[0.2em]">Registry Schema</span>
                <span className="text-[9px] font-mono font-black text-primary/40 italic">
                    {Object.keys(filteredMetadata || {}).length} TABLES LOADED
                </span>
            </div>
        </div>
    );
};