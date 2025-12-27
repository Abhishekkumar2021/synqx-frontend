import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
    Database,
    ArrowRightLeft,
    HardDriveUpload,
    Server,
    Settings2,
    Loader2,
    Layers,
    ShieldCheck,
    Square} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

// --- Types ---
interface PipelineNodeData extends Record<string, unknown> {
    label: string;
    type?: string;
    status?: 'idle' | 'pending' | 'running' | 'success' | 'completed' | 'failed' | 'error' | 'skipped' | 'warning';
    rowsProcessed?: number;
    error?: string;
    readOnly?: boolean;
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
    const isError = status === 'failed' || status === 'error';
    const isSuccess = status === 'success' || status === 'completed';
    const isPending = status === 'pending' || status === 'idle';
    const isSkipped = status === 'skipped';
    const isWarning = status === 'warning';

    // Theme Styles Helper - Using Solid Theme-Aware Variables
    const getThemeStyles = (colorVar: string) => {
        switch (colorVar) {
            case 'chart-1': return { text: "text-chart-1", border: "border-chart-1", bg: "bg-chart-1" };
            case 'chart-2': return { text: "text-chart-2", border: "border-chart-2", bg: "bg-chart-2" };
            case 'chart-3': return { text: "text-chart-3", border: "border-chart-3", bg: "bg-chart-3" };
            case 'chart-4': return { text: "text-chart-4", border: "border-chart-4", bg: "bg-chart-4" };
            case 'chart-5': return { text: "text-chart-5", border: "border-chart-5", bg: "bg-chart-5" };
            default: return { text: "text-primary", border: "border-primary", bg: "bg-primary" };
        }
    };

    const themeStyles = getThemeStyles(config.colorVar);

    return (
        <div
            className={cn(
                "group relative flex min-w-[280px] flex-col rounded-[3rem] transition-all duration-300 ease-out border-2 overflow-hidden",
                // Base Surface: Glassmorphism consistent with dashboard
                "bg-background/70 dark:bg-card/50 backdrop-blur-xl text-foreground shadow-xl",
                themeStyles.border,

                // Selection State
                selected ? "ring-2 ring-primary ring-offset-4 ring-offset-background scale-[1.02] z-50 shadow-2xl" : "hover:scale-[1.01] hover:shadow-2xl hover:bg-background/80 dark:hover:bg-card/60",
                
                // Status Specific Overrides
                isError && "border-destructive/60 bg-destructive/[0.02]",
                isRunning && "border-primary/60 bg-primary/[0.02] scale-[1.02] z-50",
                isPending && "grayscale-[0.5] opacity-80"
            )}
        >
            {/* Ambient inner shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            {/* --- Header --- */}
            <div className="flex items-start justify-between p-7 pb-4 relative z-10">
                <div className="flex items-center gap-4 min-w-0">
                    {/* Icon Box - Solid Background for contrast */}
                    <div className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.5rem] border-2 transition-all duration-300 shadow-lg relative",
                        themeStyles.bg,
                        "text-white dark:text-background", 
                        themeStyles.border,
                        isRunning && "animate-pulse ring-4 ring-primary/20"
                    )}>
                        {isRunning ? (
                            <Loader2 className={cn("h-6 w-6 animate-spin")}/>
                        ) : (
                            <Icon className={cn("h-6 w-6")}/>
                        )}
                    </div>

                    {/* Labels */}
                    <div className="flex flex-col min-w-0 gap-1">
                        <span className="text-sm font-black tracking-tight truncate pr-2 leading-tight text-foreground">
                            {nodeData.label}
                        </span>
                        <div className="flex">
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-xl bg-muted/50 border border-border/20 shadow-sm", themeStyles.text)}>
                                {config.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Body / Metrics --- */}
            {(status !== 'idle' || typeof nodeData.rowsProcessed === 'number') && (
                <div className="px-7 pb-7 pt-0 relative z-10">
                    <div className="flex items-center justify-between pt-4 border-t border-border/20">

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "h-2 w-2 rounded-full ring-2 ring-background/20",
                                isRunning && "bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]",
                                isSuccess && "bg-emerald-500 shadow-[0_0_8px_#10b981]",
                                isError && "bg-destructive shadow-[0_0_8px_#ef4444]",
                                isSkipped && "bg-muted-foreground",
                                isWarning && "bg-amber-500 shadow-[0_0_8px_#f59e0b]"
                            )} />

                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.15em]",
                                isRunning && "text-primary animate-pulse",
                                isSuccess && "text-emerald-500",
                                isError && "text-destructive",
                                isSkipped && "text-muted-foreground",
                                isWarning && "text-amber-500",
                                isPending && "text-muted-foreground"
                            )}>
                                {isRunning ? "Processing" : status}
                            </span>
                        </div>

                        {/* Data Metric */}
                        {typeof nodeData.rowsProcessed === 'number' && (
                            <div className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-xl border border-border/10 shadow-inner">
                                <Layers className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] font-black tabular-nums text-foreground/80 tracking-tight">
                                    {formatNumber(nodeData.rowsProcessed)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {isError && nodeData.error && (
                        <div className="mt-4 text-[10px] text-destructive bg-destructive/10 p-4 rounded-[1.5rem] border border-destructive/20 font-bold leading-relaxed shadow-inner">
                            {nodeData.error}
                        </div>
                    )}
                </div>
            )}

            {/* --- Connection Ports (Standardized) --- */}
            
            {type !== 'source' && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className={cn(
                        "w-3 h-3 rounded-full border-2 z-50 transition-all duration-300",
                        "bg-background shadow-md hover:scale-125 hover:border-primary",
                        "border-border"
                    )}
                    style={{ left: -7 }} 
                />
            )}

            {type !== 'destination' && type !== 'sink' && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className={cn(
                        "w-3 h-3 rounded-full border-2 z-50 transition-all duration-300",
                        "bg-background shadow-md hover:scale-125 hover:border-primary",
                        "border-border"
                    )}
                    style={{ right: -7 }}
                />
            )}
        </div>
    );
};

export default memo(PipelineNode);
