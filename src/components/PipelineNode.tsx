import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Database, ArrowRightLeft, FileOutput, Server, Settings, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

// Node Types and their Icons
const NODE_ICONS: Record<string, React.ElementType> = {
  source: Database,
  transform: ArrowRightLeft,
  destination: FileOutput,
  api: Server,
  default: Settings,
};

// Colors mapping to our new theme variables and providing subtle glow classes
const NODE_STYLES: Record<string, { iconColor: string, badgeBg: string, glowColor: string }> = {
  source: { 
      iconColor: 'text-chart-1', // Primary chart color
      badgeBg: 'bg-chart-1/10',
      glowColor: 'shadow-chart-1/20' // Subtle glow
  },
  transform: { 
      iconColor: 'text-chart-2', // Secondary chart color
      badgeBg: 'bg-chart-2/10',
      glowColor: 'shadow-chart-2/20'
  },
  destination: { 
      iconColor: 'text-chart-3', // Tertiary chart color
      badgeBg: 'bg-chart-3/10',
      glowColor: 'shadow-chart-3/20'
  },
  api: { 
      iconColor: 'text-chart-4', // Another chart color
      badgeBg: 'bg-chart-4/10',
      glowColor: 'shadow-chart-4/20'
  },
  default: { 
      iconColor: 'text-muted-foreground',
      badgeBg: 'bg-muted-foreground/10',
      glowColor: 'shadow-muted-foreground/10'
  },
};

const PipelineNode = ({ data, selected }: NodeProps) => {
  const type = (data.type as string) || 'default';
  const Icon = NODE_ICONS[type] || NODE_ICONS.default;
  const style = NODE_STYLES[type] || NODE_STYLES.default;
  
  // Bulb Color Logic (subtle glow from glow-primary)
  const bulbColor = selected ? "bg-primary shadow-[0_0_8px_var(--glow-primary)] subtle-glow" : "bg-muted-foreground/30";

  return (
    <div
      className={cn(
        "group relative flex min-w-[220px] flex-col rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl p-0 transition-all duration-300 shadow-lg",
        selected ? "border-primary/70 ring-1 ring-primary/50 shadow-xl " + style.glowColor + " translate-y-[-2px] subtle-glow" : "hover:border-primary/30 hover:shadow-xl"
      )}
    >
      {/* Header / Top Bar */}
      <div className="flex items-center gap-3 p-3 border-b border-border/50 bg-gradient-to-b from-card/70 to-card/50 rounded-t-xl">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-background/20 shadow-inner", style.iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground truncate pr-2" title={data.label as string}>
                    {data.label as string}
                </span>
                {/* Bulb Effect */}
                <div className={cn("h-2.5 w-2.5 rounded-full transition-all duration-500", bulbColor)} />
            </div>
          <span className={cn("text-[10px] font-medium uppercase tracking-widest mt-0.5", style.iconColor)}>
            {type}
          </span>
        </div>
      </div>

      {/* Body / Content Area (Optional stats or status can go here later) */}
      <div className="p-3">
         <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 opacity-60">
                <Zap className="h-3 w-3" />
                <span>Ready</span>
            </span>
            <span className="font-mono opacity-40 text-[10px]">ID: {String(data.id || '---')}</span>
         </div>
      </div>

      {/* Handles - Styled as Ports */}
      {type !== 'source' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-4 !w-3 !rounded-sm !-translate-x-[50%] !border-none !bg-muted-foreground/30 transition-all hover:!bg-primary hover:!w-4 hover:!shadow-sm hover:!shadow-primary/40"
        />
      )}
      
      {type !== 'destination' && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-4 !w-3 !rounded-sm !translate-x-[50%] !border-none !bg-muted-foreground/30 transition-all hover:!bg-primary hover:!w-4 hover:!shadow-sm hover:!shadow-primary/40"
        />
      )}
    </div>
  );
};

export default memo(PipelineNode);
