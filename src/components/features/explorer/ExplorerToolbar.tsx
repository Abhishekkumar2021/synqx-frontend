import React from 'react';
import { 
    Binary, Loader2, Play, Eraser, AlignLeft, Clock, AlertCircle 
} from 'lucide-react';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type Connection } from '@/lib/api';
import { cn } from '@/lib/utils';
import { SUPPORTED_EXPLORER_TYPES } from './types';

interface ExplorerToolbarProps {
    connections: Connection[] | undefined;
    isLoadingConnections: boolean;
    selectedConnectionId: string | null;
    onConnectionChange: (id: string) => void;
    onExecute: () => void;
    isExecuting: boolean;
    onClearEditor: () => void;
    onFormatQuery: () => void;
    isSql: boolean;
    showHistory: boolean;
    onToggleHistory: () => void;
}

export const ExplorerToolbar: React.FC<ExplorerToolbarProps> = ({
    connections,
    isLoadingConnections,
    selectedConnectionId,
    onConnectionChange,
    onExecute,
    isExecuting,
    onClearEditor,
    onFormatQuery,
    isSql,
    showHistory,
    onToggleHistory
}) => {
    return (
        <div className="flex items-center justify-between gap-4 shrink-0 px-1 bg-muted/10 rounded-2xl p-2 border border-border/20 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl ring-1 ring-border/50 shadow-xs text-primary">
                    <Binary className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Explorer</h2>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-primary/40" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Workspace</span>
                    </div>
                </div>
                
                <div className="h-8 w-px bg-border/40 mx-2" />

                <Select value={selectedConnectionId || ''} onValueChange={onConnectionChange}>
                    <SelectTrigger className="w-64 h-9 rounded-lg glass-card border-border/40 shadow-none transition-all focus:ring-4 focus:ring-primary/5 font-bold text-xs">
                        <SelectValue placeholder="Select Data Source" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60 glass-panel shadow-2xl">
                        {isLoadingConnections ? (
                            <div className="p-2 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : connections?.map(conn => {
                            const isSupported = SUPPORTED_EXPLORER_TYPES.includes(conn.connector_type.toLowerCase());
                            return (
                                <SelectItem 
                                    key={conn.id} 
                                    value={conn.id.toString()} 
                                    disabled={!isSupported}
                                    className={cn("rounded-lg cursor-pointer py-2", !isSupported && "opacity-50")}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "h-2 w-2 rounded-full",
                                            conn.health_status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30"
                                        )} />
                                        <span className="font-bold text-xs tracking-tight">{conn.name}</span>
                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0 bg-muted/50 border-none opacity-60">
                                            {conn.connector_type}
                                        </Badge>
                                        {!isSupported && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AlertCircle className="h-3 w-3 text-muted-foreground ml-auto" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Explorer not supported</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <TooltipProvider>
                    <div className="flex items-center gap-1.5 bg-background/40 p-1 rounded-xl border border-border/40 shadow-inner">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg hover:bg-muted"
                                    onClick={onClearEditor}
                                >
                                    <Eraser className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Clear Editor</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg hover:bg-muted"
                                    onClick={onFormatQuery}
                                    disabled={!isSql}
                                >
                                    <AlignLeft className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Format Query (Shift+Alt+F)</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={cn("h-8 w-8 rounded-lg transition-colors", showHistory ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground")}
                                    onClick={onToggleHistory}
                                >
                                    <Clock className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Execution History</TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>

                <Button 
                    onClick={onExecute}
                    disabled={isExecuting || !selectedConnectionId}
                    className="h-9 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2 border-none"
                >
                    {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                    Execute
                </Button>
            </div>
        </div>
    );
};
