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
  Trash2
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
const NODE_CONFIG: Record<string, { icon: React.ElementType, color: string, label: string }> = {
  source: { 
      icon: Database, 
      color: "blue", 
      label: "Source" 
  },
  transform: { 
      icon: ArrowRightLeft, 
      color: "purple", 
      label: "Transform" 
  },
  destination: { 
      icon: HardDriveUpload, 
      color: "emerald", 
      label: "Sink" 
  },
  sink: { 
      icon: HardDriveUpload, 
      color: "emerald", 
      label: "Sink" 
  },
  api: { 
      icon: Server, 
      color: "amber", 
      label: "API" 
  },
  default: { 
      icon: Settings2, 
      color: "primary", 
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

  // Dynamic Styles
  const colorStyles = {
      blue: {
          border: "border-blue-500/50",
          ring: "ring-blue-500/40",
          text: "text-blue-500",
          bg: "bg-blue-500/10",
          shadow: "shadow-blue-500/20"
      },
      purple: {
          border: "border-purple-500/50",
          ring: "ring-purple-500/40",
          text: "text-purple-500",
          bg: "bg-purple-500/10",
          shadow: "shadow-purple-500/20"
      },
      emerald: {
          border: "border-emerald-500/50",
          ring: "ring-emerald-500/40",
          text: "text-emerald-500",
          bg: "bg-emerald-500/10",
          shadow: "shadow-emerald-500/20"
      },
      amber: {
          border: "border-amber-500/50",
          ring: "ring-amber-500/40",
          text: "text-amber-500",
          bg: "bg-amber-500/10",
          shadow: "shadow-amber-500/20"
      },
      primary: {
          border: "border-primary/50",
          ring: "ring-primary/40",
          text: "text-primary",
          bg: "bg-primary/10",
          shadow: "shadow-primary/20"
      }
  }[config.color] || { 
      border: "border-border", ring: "ring-primary", text: "text-foreground", bg: "bg-muted", shadow: "" 
  };

  return (
    <div
      className={cn(
        "group relative flex min-w-[260px] flex-col rounded-[20px] glass-card transition-all duration-300",
        // Selection State
        selected 
            ? cn("ring-2 ring-offset-2 ring-offset-background scale-[1.02]", colorStyles.border, colorStyles.ring, colorStyles.shadow) 
            : "hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1",
        // Error State Override
        isError && "border-destructive/60 shadow-destructive/10 ring-destructive/20"
      )}
    >
      {/* --- Header --- */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex items-center gap-3.5 min-w-0">
            {/* Icon Box */}
            <div className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-transparent transition-all duration-300 shadow-inner",
                colorStyles.bg,
                selected ? "border-current/20" : "",
                isRunning && "animate-pulse"
            )}>
                {isRunning ? (
                    <Loader2 className={cn("h-5 w-5 animate-spin", colorStyles.text)} />
                ) : (
                    <Icon className={cn("h-5 w-5", colorStyles.text)} />
                )}
            </div>
            
            {/* Labels */}
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground truncate pr-1" title={nodeData.label}>
                    {nodeData.label}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
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
                    className="h-8 w-8 -mr-2 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-white/10 data-[state=open]:text-foreground"
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-white/10 bg-background/80 backdrop-blur-xl">
                <DropdownMenuLabel>Node Actions</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem>
                    <Settings2 className="mr-2 h-3.5 w-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Play className="mr-2 h-3.5 w-3.5" /> Run Node
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- Body / Metrics --- */}
      {(status !== 'idle' || nodeData.rowsProcessed) && (
          <div className="px-4 pb-4 pt-2">
             <div className="flex items-center justify-between pt-3 border-t border-white/5">
                
                {/* Status Badge */}
                <Badge variant="outline" className={cn(
                    "h-5 text-[9px] px-2 rounded-full border-0 font-bold tracking-wide uppercase bg-muted/50",
                    isRunning && "bg-blue-500/10 text-blue-500 animate-pulse border-blue-500/20",
                    isSuccess && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                    isError && "bg-destructive/10 text-destructive border-destructive/20"
                )}>
                    {isRunning && "Running"}
                    {isSuccess && "Success"}
                    {isError && "Failed"}
                </Badge>

                {/* Data Metric */}
                {typeof nodeData.rowsProcessed === 'number' && (
                    <span className="text-[10px] font-mono font-medium text-muted-foreground flex items-center gap-1">
                        {nodeData.rowsProcessed.toLocaleString()} rows
                    </span>
                )}
             </div>
             
             {/* Error Message (if failed) */}
             {isError && nodeData.error && (
                 <div className="mt-2 text-[10px] text-destructive bg-destructive/5 p-2 rounded-lg border border-destructive/10 truncate font-medium">
                     {nodeData.error}
                 </div>
             )}
          </div>
      )}

      {/* --- Connection Ports --- */}
      
      {type !== 'source' && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            "w-3! h-6! rounded-[4px]! border-2! bg-background! transition-all z-50",
            selected 
                ? "border-primary! bg-primary!" 
                : "border-white/20! hover:border-primary! hover:bg-primary/50!"
          )}
          style={{ left: -10 }}
        />
      )}
      
      {type !== 'destination' && type !== 'sink' && (
        <Handle
          type="source"
          position={Position.Right}
          className={cn(
            "w-3! h-6! rounded-[4px]! border-2! bg-background! transition-all z-50",
            selected 
                ? "border-primary! bg-primary!" 
                : "border-white/20! hover:border-primary! hover:bg-primary/50!"
          )}
          style={{ right: -10 }}
        />
      )}
    </div>
  );
};

export default memo(PipelineNode);
