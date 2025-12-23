/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { type QueryResponse } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal, Copy, ListFilter, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ResultsGridProps {
    data: QueryResponse | null;
    isLoading: boolean;
    isMaximized?: boolean;
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({ data, isLoading }) => {
    const [filter, setFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const processedData = useMemo(() => {
        if (!data) return [];
        let results = data.results.map((row, idx) => ({ ...row, __idx: idx }));
        
        if (filter) {
            results = results.filter(row => 
                Object.values(row).some(v => String(v).toLowerCase().includes(filter.toLowerCase()))
            );
        }

        if (sortConfig) {
            results.sort((a: any, b: any) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal === null) return 1;
                if (bVal === null) return -1;
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return results;
    }, [data, filter, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key && current.direction === 'asc') return { key, direction: 'desc' };
            return { key, direction: 'asc' };
        });
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col p-4 gap-4 animate-in fade-in duration-500">
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-24 rounded-md" />)}
                </div>
                <div className="space-y-2 flex-1 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-10 w-full rounded-md opacity-50" />)}
                </div>
            </div>
        );
    }

    if (!data || data.results.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/5 animate-in fade-in duration-500 min-h-[300px]">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
                    <div className="relative h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center border border-border/40">
                        <Terminal className="h-8 w-8 opacity-20" />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <p className="text-sm font-bold tracking-tight text-foreground/80">Ready for Execution</p>
                    <p className="text-[11px] font-medium opacity-60">Execute a query to see results in this high-performance grid.</p>
                </div>
            </div>
        );
    }

    const JsonPreview = ({ data }: { data: any }) => {
        const str = JSON.stringify(data, null, 2);
        return (
            <div className="group relative max-w-sm">
                <pre className="text-[10px] font-mono text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/5 p-2 rounded-lg border border-blue-200 dark:border-blue-500/10 max-h-24 overflow-auto scrollbar-none transition-colors leading-tight">
                    {str}
                </pre>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-background/80 backdrop-blur-sm border border-border/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(str);
                        toast.success("JSON copied");
                    }}
                >
                    <Copy className="h-3 w-3" />
                </Button>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-card/10 border-t border-border/20 overflow-hidden">
            {/* Results Filter Bar */}
            <div className="p-2 border-b border-border/10 flex items-center justify-between bg-muted/5 shrink-0">
                <div className="relative group flex-1 max-w-xs">
                    <ListFilter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Filter results..."
                        className="h-7 pl-8 rounded-md bg-background/50 border-border/40 text-[10px] font-bold shadow-none focus:ring-2 focus:ring-primary/10 transition-all"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-4">
                    Showing {processedData.length} of {data.results.length} records
                </div>
            </div>

            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
                <table className="w-full text-left border-collapse min-w-max">
                    <thead className="sticky top-0 bg-muted/95 backdrop-blur-xl z-20 shadow-xs border-b border-border/40">
                        <tr>
                            <th className="w-10 px-3 py-2.5 text-[9px] font-black text-muted-foreground/40 border-r border-border/20 bg-muted/30 text-center uppercase">#</th>
                            {data.columns.map((col) => (
                                <th 
                                    key={col} 
                                    onClick={() => handleSort(col)}
                                    className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 border-r border-border/20 last:border-r-0 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <ArrowUpDown className={cn(
                                            "h-2.5 w-2.5 transition-colors",
                                            sortConfig?.key === col ? "text-primary" : "opacity-20"
                                        )} />
                                        {col}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10 dark:divide-border/5">
                        {processedData.map((row: any, i) => (
                            <tr 
                                key={row.__idx} 
                                className={cn(
                                    "transition-colors group/row rounded-none",
                                    i % 2 === 0 ? "bg-transparent" : "bg-muted/30 dark:bg-muted/10",
                                    "hover:bg-primary/6 dark:hover:bg-primary/4"
                                )}
                            >
                                <td className="w-10 px-3 py-2 text-[10px] font-mono text-muted-foreground/40 dark:text-muted-foreground/30 text-center border-r border-border/10">
                                    {row.__idx + 1}
                                </td>
                                {data.columns.map((col) => {
                                    const val = row[col];
                                    return (
                                        <td key={col} className="px-4 py-2 text-xs font-medium border-r border-border/10 last:border-r-0 max-w-md truncate group-hover/row:border-border/20">
                                            {val === null ? (
                                                <span className="text-muted-foreground/40 dark:text-muted-foreground/20 italic text-[9px] uppercase tracking-widest font-bold">null</span>
                                            ) : typeof val === 'object' ? (
                                                <JsonPreview data={val} />
                                            ) : typeof val === 'boolean' ? (
                                                <Badge variant="outline" className={cn(
                                                    "text-[9px] px-1.5 h-4 font-black border-none tracking-widest",
                                                    val 
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                                                        : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                                                )}>
                                                    {String(val).toUpperCase()}
                                                </Badge>
                                            ) : typeof val === 'number' ? (
                                                <span className="text-indigo-700 dark:text-indigo-400 font-mono font-bold">{val}</span>
                                            ) : (
                                                <span className="text-foreground/80 dark:text-foreground/70 leading-relaxed font-medium">{String(val)}</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
