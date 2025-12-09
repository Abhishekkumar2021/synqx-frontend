import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Database, ArrowRightLeft, FileOutput, Server, Settings } from 'lucide-react';
import { cn } from '../lib/utils'; // Assuming this utility exists, otherwise I'll use simple string concat

// Node Types and their Icons
const NODE_ICONS: Record<string, React.ElementType> = {
  source: Database,
  transform: ArrowRightLeft,
  destination: FileOutput,
  api: Server,
  default: Settings,
};

const NODE_COLORS: Record<string, string> = {
  source: 'border-blue-500 bg-blue-50/10 text-blue-500',
  transform: 'border-yellow-500 bg-yellow-50/10 text-yellow-500',
  destination: 'border-green-500 bg-green-50/10 text-green-500',
  api: 'border-purple-500 bg-purple-50/10 text-purple-500',
  default: 'border-border bg-card text-foreground',
};

const PipelineNode = ({ data, selected }: NodeProps) => {
  // Determine type from data or default
  const type = (data.type as string) || 'default';
  const Icon = NODE_ICONS[type] || NODE_ICONS.default;
  const colorClass = NODE_COLORS[type] || NODE_COLORS.default;
  
  return (
    <div
      className={cn(
        "group relative flex min-w-[180px] flex-col rounded-lg border-2 bg-card p-3 shadow-sm transition-all hover:shadow-md",
        selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "",
        colorClass
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-md border bg-background/50 backdrop-blur-sm", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground line-clamp-1">
            {data.label as string}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
            {type}
          </span>
        </div>
      </div>

      {/* Handles */}
      {/* Source only has Output */}
      {type !== 'source' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !-translate-x-[50%] !border-2 !border-background !bg-muted-foreground transition-colors hover:!bg-primary"
        />
      )}
      
      {/* Destination only has Input (but we usually allow chaining so maybe not strictly) */}
      {/* For now, let's say Destination can still be an input for logging? No, strictly: */}
      {type !== 'destination' && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !translate-x-[50%] !border-2 !border-background !bg-muted-foreground transition-colors hover:!bg-primary"
        />
      )}
    </div>
  );
};

export default memo(PipelineNode);
