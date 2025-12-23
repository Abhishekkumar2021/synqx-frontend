/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { type QueryResponse } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Terminal, ListFilter, ArrowUpDown, Copy, Hash,
    Database, Download, FileJson, FileText
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/ui/docs/CodeBlock';
import { toast } from 'sonner';

interface ResultsGridProps {
    data: QueryResponse | null;
    isLoading: boolean;
    isMaximized?: boolean;
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({ data, isLoading }) => {
    const [filter, setFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // --- Data Processing (Untouched) ---
    const processedData = useMemo(() => {
        if (!data) return [];
        let results = data.results.map((row, idx) => ({ ...row, __idx: idx }));

        if (filter) {
            const lowerFilter = filter.toLowerCase();
            results = results.filter(row =>
                Object.values(row).some(v => String(v).toLowerCase().includes(lowerFilter))
            );
        }

        if (sortConfig) {
            results.sort((a: any, b: any) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal === null) return 1;
                if (bVal === null) return -1;
                const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }
        return results;
    }, [data, filter, sortConfig]);

    // --- Export Logic ---
    const downloadFile = (content: string, fileName: string, contentType: string) => {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        toast.success(`Exported to ${fileName}`);
    };

    const handleExport = (format: 'json' | 'csv') => {
        if (!data || data.results.length === 0) return;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const exportSet = processedData.map(({ __idx, ...cleanRow }) => cleanRow);

        switch (format) {
            case 'json':
                downloadFile(JSON.stringify(exportSet, null, 2), `export_${timestamp}.json`, 'application/json');
                break;
            case 'csv': {
                const headers = data.columns.join(',');
                const rows = exportSet.map(row =>
                    data.columns.map(col => {
                        let val = row[col];

                        // Handle JSON/Object data: Stringify if it's an object or array
                        if (val !== null && typeof val === 'object') {
                            try {
                                val = JSON.stringify(val);
                            } catch (e) {
                                val = '[Complex Object]';
                            }
                        } else if (val === null || val === undefined) {
                            val = '';
                        }
                        return `"${String(val).replace(/"/g, '""')}"`;
                    }).join(',')
                ).join('\n');

                downloadFile(`${headers}\n${rows}`, `export_${timestamp}.csv`, 'text/csv');
                break;
            }

        }
    };

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key && current.direction === 'asc') return { key, direction: 'desc' };
            return { key, direction: 'asc' };
        });
    };

    if (isLoading) return <LoadingSkeleton />;
    if (!data) return <EmptyState />;

    if (data.results.length === 0 && data.columns.length === 0) {
        return (
             <div className="flex-1 h-full flex flex-col items-center justify-center text-muted-foreground gap-4 bg-card/5 animate-in fade-in duration-500">
                <div className="p-4 rounded-full bg-success/10 text-success">
                    <Terminal size={32} />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-foreground">Command Executed</h3>
                    <p className="text-xs text-muted-foreground">No data returned.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 h-full bg-background/60 dark:bg-background/40 backdrop-blur-2xl backdrop-saturate-150 relative overflow-hidden isolate">
            <div className="absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10 pointer-events-none z-50" />

            {/* Header Control Bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-muted/20 border-b border-border/40 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="relative w-64 group">
                        <ListFilter className="z-20 absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search results..."
                            className="h-9 pl-10 rounded-xl bg-background/50 border-border/40 text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all shadow-none"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <Badge variant="outline" className="h-6 px-3 rounded-full border-border/50 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 bg-muted/20">
                        {processedData.length} Nodes
                    </Badge>
                </div>

                <div className="flex items-center gap-3">
                    {/* --- EXPORT DROP-DOWN --- */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest bg-primary/5 hover:bg-primary/10 text-primary transition-all">
                                <Download size={14} />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 glass-panel border-border/40 rounded-2xl shadow-2xl p-2" align="end">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40 px-3 py-2">Data Formats</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleExport('json')} className="rounded-lg gap-3 py-2.5 cursor-pointer">
                                <FileJson className="h-4 w-4 text-orange-500" />
                                <span className="font-bold text-xs uppercase italic">JSON Registry</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')} className="rounded-lg gap-3 py-2.5 cursor-pointer">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span className="font-bold text-xs uppercase italic">CSV Spreadsheet</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Main Grid Area (Untouched Sticky Logic) */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-card/5 relative min-h-0">
                <table className="w-full text-left border-separate border-spacing-0 min-w-max relative">
                    <thead className="sticky top-0 z-40">
                        <tr className="bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-sm">
                            <th className="sticky left-0 top-0 z-60 w-14 px-4 py-3 text-center border-r border-b border-border/40 bg-muted/50 backdrop-blur-2xl">
                                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Idx</span>
                            </th>
                            {data.columns.map((col) => (
                                <th
                                    key={col}
                                    onClick={() => handleSort(col)}
                                    className="sticky top-0 z-40 px-6 py-4 cursor-pointer group hover:bg-primary/3 transition-all border-r border-b border-border/40 last:border-r-0 bg-background/90 backdrop-blur-xl"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                                                {typeof data.results[0]?.[col] === 'number' ? <Hash size={12} className="text-primary" /> : <Database size={12} className="text-primary" />}
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest text-foreground/80 italic">{col}</span>
                                        </div>
                                        <ArrowUpDown className={cn(
                                            "h-3.5 w-3.5 transition-all",
                                            sortConfig?.key === col ? "text-primary opacity-100 scale-110" : "opacity-10 scale-90"
                                        )} />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                        {processedData.map((row: any) => (
                            <tr key={row.__idx} className="group/row hover:bg-primary/2 transition-colors">
                                <td className="sticky left-0 z-30 w-14 px-4 py-3 text-[10px] font-mono font-bold text-muted-foreground/30 text-center border-r border-b border-border/10 bg-background/95 backdrop-blur-sm group-hover/row:text-primary transition-colors">
                                    {row.__idx + 1}
                                </td>
                                {data.columns.map((col) => {
                                    const val = row[col];
                                    return (
                                        <td key={col} className="px-6 py-3 border-r border-b border-border/10 last:border-r-0 max-w-md">
                                            <div className="flex items-center gap-3 group/cell">
                                                <div className="flex-1 min-w-0">
                                                    {val === null ? (
                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 italic">NULL</span>
                                                    ) : typeof val === 'object' ? (
                                                        <div className="max-w-sm border border-border/20 bg-background/50 rounded-lg overflow-hidden">
                                                            <CodeBlock code={JSON.stringify(val, null, 2)} language="json" maxHeight='128px' editable={false} />
                                                        </div>
                                                    ) : typeof val === 'boolean' ? (
                                                        <Badge variant="outline" className={cn(
                                                            "text-[9px] px-2.5 h-5 font-black uppercase border-0 tracking-widest",
                                                            val ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                                                        )}>
                                                            {String(val)}
                                                        </Badge>
                                                    ) : typeof val === 'number' ? (
                                                        <span className="text-[13px] font-mono font-bold text-indigo-500/90 tracking-tighter">{val.toLocaleString()}</span>
                                                    ) : (
                                                        <span className="text-[13px] font-medium text-foreground/70 tracking-tight leading-relaxed line-clamp-2">{String(val)}</span>
                                                    )}
                                                </div>
                                                {val !== null && typeof val !== 'object' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(String(val));
                                                            toast.success("Copied to clipboard");
                                                        }}
                                                        className="opacity-0 group-hover/cell:opacity-100 p-2 rounded-xl bg-primary/10 text-primary transition-all hover:scale-110 active:scale-95"
                                                    >
                                                        <Copy size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Summary Bar (Untouched) */}
            <footer className="px-5 py-2.5 bg-muted/20 border-t border-border/40 flex items-center justify-between shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">Registry Archive</span>
                    <div className="h-3 w-px bg-border/40" />
                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{data.columns.length} Fields Detected</span>
                </div>
                <span className="text-[10px] font-mono font-black text-primary/40 italic">
                    {data.results.length.toLocaleString()} ROWS RETURNED
                </span>
            </footer>
        </div>
    );
};
const LoadingSkeleton = () => (
    <div className="flex-1 h-full flex flex-col p-6 gap-6 bg-background/50 animate-pulse overflow-hidden">
        <div className="flex gap-4 border-b border-border pb-6 shrink-0">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-32 rounded-xl bg-muted/40" />)}
        </div>
        <div className="space-y-4 flex-1 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 flex-1 rounded-2xl bg-muted/20" />
                    <Skeleton className="h-12 w-24 rounded-2xl bg-muted/10" />
                </div>
            ))}
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex-1 h-full flex flex-col items-center justify-center text-muted-foreground gap-8 bg-card/5 animate-in fade-in duration-1000">
        <div className="relative group">
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all duration-700" />
            <div className="relative h-24 w-24 rounded-[2.5rem] glass-card flex items-center justify-center border-0 shadow-2xl">
                <Terminal className="h-12 w-12 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
        <div className="text-center space-y-3">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Waiting for Execution</h3>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40 max-w-xs leading-loose">
                Execute a command to populate the grid
            </p>
        </div>
    </div>
);