import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Trash2, ArrowRight, ListFilter, History, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { type HistoryItem } from './types';

interface ExecutionHistoryProps {
    history: HistoryItem[];
    onClose: () => void;
    onRestore: (query: string) => void;
    onClear: () => void;
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({ history, onClose, onRestore, onClear }) => {
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    const handleCopy = (e: React.MouseEvent, query: string, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(query);
        setCopiedId(id);
        toast.success("Query copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 380, damping: 35 }}
            className={cn(
                "absolute right-0 top-0 bottom-0 w-96 z-100 flex flex-col overflow-hidden shadow-[-20px_0_50px_rgba(0,0,0,0.2)] isolate",
                "bg-background/40 backdrop-blur-3xl border-l border-white/10"
            )}
        >
            {/* Refractive Edge & Internal Shadow */}
            <div className="absolute inset-y-0 left-0 w-0.5 bg-linear-to-b from-white/20 via-white/5 to-white/20 pointer-events-none z-20" />
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

            {/* Header: Industrial Layout */}
            <header className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5">
                        <History size={18} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-foreground leading-none">
                            Registry Audit
                        </h3>
                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-success animate-pulse" />
                            Session Archive
                        </span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-2xl hover:bg-white/10 hover:text-foreground transition-all active:scale-95"
                    onClick={onClose}
                >
                    <X size={18} />
                </Button>
            </header>

            {/* History List: Staggered Interaction */}
            <ScrollArea className="flex-1 px-4">
                <div className="py-6 space-y-4">
                    <AnimatePresence mode="popLayout">
                        {history.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.04 }}
                                className="group relative p-5 rounded-[2rem] border border-white/5 bg-white/3 hover:bg-white/[0.07] hover:border-primary/30 transition-all cursor-pointer overflow-hidden active:scale-[0.98]"
                                onClick={() => onRestore(item.query)}
                            >
                                {/* Card Subtle Glow */}
                                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <Badge variant="outline" className="text-[9px] font-black bg-primary/10 border-primary/20 text-primary uppercase tracking-tighter px-2.5 h-5 rounded-lg">
                                        {item.connectionName}
                                    </Badge>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/40 italic">
                                        <Clock size={11} />
                                        {new Date(item.timestamp).toLocaleTimeString([], { hour12: false })}
                                    </div>
                                </div>

                                <div className="relative group/code mb-4">
                                    <code className={cn(
                                        "block p-4 rounded-2xl border transition-all duration-300",
                                        "text-[11px] font-mono leading-relaxed line-clamp-4 select-all",
                                        // Light Mode: Subtle grey recessed look
                                        "bg-neutral-100/50 text-neutral-800 border-neutral-200/50",
                                        // Dark Mode: Deep obsidian recessed look
                                        "dark:bg-black/40 dark:text-neutral-300 dark:border-white/5",
                                        // Hover State
                                        "group-hover/code:border-primary/30 group-hover/code:shadow-inner"
                                    )}>
                                        {item.query}
                                    </code>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover/code:opacity-100 bg-background/80 backdrop-blur-md rounded-xl transition-all"
                                        onClick={(e) => handleCopy(e, item.query, item.id)}
                                    >
                                        {copiedId === item.id ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                            <ListFilter size={12} className="text-primary" />
                                            {item.rowCount?.toLocaleString() ?? 0} <span className="opacity-40 font-bold">Rows</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                        Restore <ArrowRight size={14} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {history.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-32 flex flex-col items-center justify-center gap-6"
                        >
                            <div className="p-8 rounded-[2.5rem] bg-white/2 border-2 border-dashed border-white/5 text-muted-foreground/20">
                                <History size={48} strokeWidth={1} />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40">Archive Empty</p>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground/20">No execution logs found</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer: Adaptive Tactical Action */}
            <footer className={cn(
                "p-8 shrink-0 relative isolate",
                "border-t border-border/40",
                "bg-background/80 dark:bg-black/40 backdrop-blur-2xl backdrop-saturate-150"
            )}>
                {/* Internal Refractive Edge - Provides depth in both modes */}
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent opacity-50" />

                <Button
                    variant="outline"
                    disabled={history.length === 0}
                    onClick={onClear}
                    className={cn(
                        "w-full h-14 rounded-[1.5rem] transition-all duration-300 group",
                        "text-[10px] font-black uppercase tracking-[0.25em] gap-3",
                        // Light Mode: Subtle grey border with soft shadow
                        "border-border/60 bg-background shadow-sm hover:shadow-md",
                        // Dark Mode: Transparent obsidian with glow
                        "dark:bg-transparent dark:border-white/10 dark:hover:border-destructive/40",
                        // Hover States
                        "hover:bg-destructive/5 hover:text-destructive active:scale-[0.98] disabled:opacity-30"
                    )}
                >
                    <div className="relative">
                        <Trash2
                            size={16}
                            className="transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
                        />
                        {/* Subtle ping animation on hover for extra tactical feel */}
                        <span className="absolute inset-0 rounded-full bg-destructive/20 animate-ping opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span>Purge Registry</span>
                </Button>
            </footer>
        </motion.div>
    );
};