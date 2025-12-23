import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
    Database,
    ArrowRightLeft,
    HardDriveUpload,
    Server,
    Settings2,
    MoreHorizontal,
    Loader2,
    Play,
    Copy,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Layers,
    ShieldCheck,
    Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Types ---
interface PipelineNodeData extends Record<string, unknown> {
    label: string;
    type?: string;
    status?: 'idle' | 'running' | 'success' | 'error';
    rowsProcessed?: number;
    error?: string;
}

// --- Visual Configuration ---
const NODE_CONFIG: Record<string, { icon: React.ElementType, colorVar: string, label: string }> = {
    source: {
        icon: Database,
        colorVar: "chart-1", // Blue
        label: "Source"
    },
    transform: {
        icon: ArrowRightLeft,
        colorVar: "chart-3", // Purple
        label: "Transform"
    },
    join: {
        icon: Layers,
        colorVar: "chart-5", // Dark Red/Brown
        label: "Set Op"
    },
    union: {
        icon: Layers,
        colorVar: "chart-5",
        label: "Set Op"
    },
    merge: {
        icon: Layers,
        colorVar: "chart-5",
        label: "Set Op"
    },
    validate: {
        icon: ShieldCheck,
        colorVar: "chart-4", // Orange
        label: "Quality"
    },
    noop: {
        icon: Square,
        colorVar: "chart-3", // Purple (Reuse)
        label: "No-Op"
    },
    destination: {
        icon: HardDriveUpload,
        colorVar: "chart-2", // Green
        label: "Sink"
    },
    sink: {
        icon: HardDriveUpload,
        colorVar: "chart-2",
        label: "Sink"
    },
    api: {
        icon: Server,
        colorVar: "chart-4", // Orange
        label: "API"
    },
    default: {
        icon: Settings2,
        colorVar: "primary",
        label: "Node"
    },
};

const PipelineNode = ({ data, selected }: NodeProps) => {
    const nodeData = data as PipelineNodeData;
    const type = nodeData.type || 'default';
    const config = NODE_CONFIG[type] || NODE_CONFIG.default;
    const Icon = config.icon;

    const status = nodeData.status || 'idle';
    const isRunning = status === 'running';
    const isError = status === 'error';
    const isSuccess = status === 'success';

    // Theme Styles Helper
    const getThemeStyles = (color: string) => {
        switch (color) {
            case 'chart-1': return {
                bg: "bg-chart-1/10", text: "text-chart-1", border: "border-chart-1/20", ring: "ring-chart-1/30",
                handle: "hover:border-chart-1 hover:bg-chart-1/10 hover:shadow-[0_0_8px_rgba(var(--chart-1),0.4)]"
            };
            case 'chart-2': return {
                bg: "bg-chart-2/10", text: "text-chart-2", border: "border-chart-2/20", ring: "ring-chart-2/30",
                handle: "hover:border-chart-2 hover:bg-chart-2/10 hover:shadow-[0_0_8px_rgba(var(--chart-2),0.4)]"
            };
            case 'chart-3': return {
                bg: "bg-chart-3/10", text: "text-chart-3", border: "border-chart-3/20", ring: "ring-chart-3/30",
                handle: "hover:border-chart-3 hover:bg-chart-3/10 hover:shadow-[0_0_8px_rgba(var(--chart-3),0.4)]"
            };
            case 'chart-4': return {
                bg: "bg-chart-4/10", text: "text-chart-4", border: "border-chart-4/20", ring: "ring-chart-4/30",
                handle: "hover:border-chart-4 hover:bg-chart-4/10 hover:shadow-[0_0_8px_rgba(var(--chart-4),0.4)]"
            };
            case 'chart-5': return {
                bg: "bg-chart-5/10", text: "text-chart-5", border: "border-chart-5/20", ring: "ring-chart-5/30",
                handle: "hover:border-chart-5 hover:bg-chart-5/10 hover:shadow-[0_0_8px_rgba(var(--chart-5),0.4)]"
            };
            default: return {
                bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", ring: "ring-primary/30",
                handle: "hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(var(--primary),0.4)]"
            };
        }
    };

    const themeStyles = getThemeStyles(config.colorVar);

    return (
        <div
            className={cn(
                "group relative flex min-w-[280px] flex-col rounded-3xl glass-card transition-all duration-500 ease-out border",
                // Base Border & Glass
                "border-border/60 bg-background/40 backdrop-blur-xl",

                // Selection State (Subtle scale + Shadow bloom)
                selected
                    ? cn("ring-1 ring-offset-0 scale-[1.01] shadow-2xl", themeStyles.ring, themeStyles.border)
                    : "hover:border-primary/30 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5",

                // Error State
                isError && "border-destructive/50 ring-destructive/20 shadow-destructive/10 bg-destructive/5"
            )}
        >
            {/* --- Header --- */}
            <div className="flex items-start justify-between p-4 pb-3">
                <div className="flex items-center gap-3.5 min-w-0">
                    {/* Icon Box */}
                    <div className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 shadow-sm",
                        themeStyles.bg,
                        themeStyles.border,
                        selected ? "border-current/40 shadow-inner" : "",
                        isRunning && "animate-pulse"
                    )}>
                        {isRunning ? (
                            <Loader2 className={cn("h-5 w-5 animate-spin", themeStyles.text)} />
                        ) : (
                            <Icon className={cn("h-5 w-5", themeStyles.text)} />
                        )}
                    </div>

                    {/* Labels */}
                    <div className="flex flex-col min-w-0 gap-0.5">
                        <span className="text-sm font-bold text-foreground truncate pr-2 leading-none" title={nodeData.label}>
                            {nodeData.label}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                            {config.label}
                        </span>
                    </div>
                </div>

                {/* Action Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mr-1.5 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 data-[state=open]:bg-muted/50 data-[state=open]:text-foreground transition-colors"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/40 bg-background/80 backdrop-blur-2xl shadow-xl">
                        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-widest px-3 py-2">Node Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/40" />
                        <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-accent focus:text-accent-foreground rounded-lg mx-1">
                            <Settings2 className="h-3.5 w-3.5 opacity-70" /> Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-accent focus:text-accent-foreground rounded-lg mx-1">
                            <Play className="h-3.5 w-3.5 opacity-70" /> Run Node
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/40" />
                        <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-accent focus:text-accent-foreground rounded-lg mx-1">
                            <Copy className="h-3.5 w-3.5 opacity-70" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg mx-1">
                            <Trash2 className="h-3.5 w-3.5 opacity-70" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* --- Body / Metrics --- */}
            {(status !== 'idle' || typeof nodeData.rowsProcessed === 'number') && (
                <div className="px-4 pb-4 pt-0">
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">

                        {/* Status Badge */}
                        <div className="flex items-center gap-1.5">
                            {isRunning && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                            {isSuccess && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                            {isError && <AlertCircle className="h-3 w-3 text-destructive" />}

                            <span className={cn(
                                "text-[10px] font-semibold uppercase tracking-wide",
                                isRunning && "text-muted-foreground",
                                isSuccess && "text-emerald-500",
                                isError && "text-destructive"
                            )}>
                                {isRunning ? "Processing..." : status}
                            </span>
                        </div>

                        {/* Data Metric */}
                        {typeof nodeData.rowsProcessed === 'number' && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono tracking-tight bg-muted/50 text-muted-foreground border-transparent hover:bg-muted/70 shadow-none">
                                {nodeData.rowsProcessed.toLocaleString()} rows
                            </Badge>
                        )}
                    </div>

                    {/* Error Message */}
                    {isError && nodeData.error && (
                        <div className="mt-3 text-[10px] text-destructive-foreground bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 font-medium leading-relaxed">
                            {nodeData.error}
                        </div>
                    )}
                </div>
            )}

            {/* --- Connection Ports (Glass Handles) --- */}
            
            {type !== 'source' && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className={cn(
                        "w-3.5! h-7! rounded-full! border-2! z-50 transition-all duration-300",
                        "bg-background/80! backdrop-blur-md shadow-sm",
                        "border-border/60",
                        themeStyles.handle,
                        selected && cn(themeStyles.border.replace('/20', '!'), "bg-background!")
                    )}
                    style={{ left: -14 }} 
                />
            )}

            {type !== 'destination' && type !== 'sink' && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className={cn(
                        "w-3.5! h-7! rounded-full! border-2! z-50 transition-all duration-300",
                        "bg-background/80! backdrop-blur-md shadow-sm",
                        "border-border/60",
                        themeStyles.handle,
                        selected && cn(themeStyles.border.replace('/20', '!'), "bg-background!")
                    )}
                    style={{ right: -14 }}
                />
            )}
        </div>
    );
};

export default memo(PipelineNode);