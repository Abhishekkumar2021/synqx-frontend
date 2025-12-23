import React from 'react';
import { motion } from 'framer-motion';
import { Clock, X, Trash2, ArrowRight, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { type HistoryItem } from './types';

interface ExecutionHistoryProps {
    history: HistoryItem[];
    onClose: () => void;
    onRestore: (query: string) => void;
    onClear: () => void;
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({ history, onClose, onRestore, onClear }) => {
    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-background/95 backdrop-blur-3xl border-l border-border/60 shadow-2xl z-50 flex flex-col overflow-hidden m-0 rounded-none"
        >
            <div className="p-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Execution History
                </h3>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                    {history.map(item => (
                        <div 
                            key={item.id}
                            className="p-3 rounded-xl border border-border/40 bg-muted/5 hover:bg-muted/20 transition-all group cursor-pointer"
                            onClick={() => onRestore(item.query)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-[8px] font-black bg-background/50 border-none uppercase tracking-widest text-primary/70">
                                    {item.connectionName}
                                </Badge>
                                <span className="text-[9px] text-muted-foreground font-medium">
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <code className="text-[10px] font-mono text-muted-foreground line-clamp-3 block mb-2 bg-black/5 dark:bg-white/5 p-1.5 rounded-md leading-relaxed whitespace-pre-wrap">
                                {item.query}
                            </code>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/60">
                                    <ListFilter className="h-2.5 w-2.5" />
                                    {item.rowCount} rows
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRestore(item.query);
                                        toast.success("Query Restored");
                                    }}
                                >
                                    <ArrowRight className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                            <Clock className="h-10 w-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No recent history</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t border-border/40 bg-muted/5">
                <Button 
                    variant="outline" 
                    className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 h-9 border-border/40"
                    onClick={onClear}
                    disabled={history.length === 0}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear History
                </Button>
            </div>
        </motion.div>
    );
};
