import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
    GitBranch, MoreVertical, Play, Settings, 
    Workflow, Clock, CheckCircle2, XCircle 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { PipelineStatusBadge } from './PipelineStatusBadge';
import { type Pipeline, type Job } from '@/lib/api';

interface PipelineGridItemProps {
    pipeline: Pipeline & { lastJob?: Job };
    onRun: (id: number) => void;
    onOpenSettings: (pipeline: Pipeline) => void;
}

export const PipelineGridItem: React.FC<PipelineGridItemProps> = ({ pipeline, onRun, onOpenSettings }) => {
    const navigate = useNavigate();
    const lastJob = pipeline.lastJob;
    const isRunning = lastJob?.status === 'running';

    return (
        <div 
            className="group relative flex flex-col glass-card glass-card-hover rounded-[2rem] p-6 backdrop-blur-md overflow-hidden"
        >
            {/* Glow Effect */}
            <div className="absolute -right-10 -top-10 h-32 w-32 bg-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-start justify-between mb-5 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center border shadow-inner transition-all duration-300",
                        isRunning 
                            ? "bg-blue-500/20 border-blue-500/30 text-blue-500 animate-pulse shadow-[0_0_15px_-5px_var(--color-blue-500)]" 
                            : "bg-black/5 dark:bg-white/5 border-white/5 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20"
                    )}>
                        <GitBranch className="h-7 w-7" />
                    </div>
                    <div>
                        <Link to={`/pipelines/${pipeline.id}`} className="font-bold text-lg hover:text-primary transition-colors block mb-1">
                            {pipeline.name}
                        </Link>
                        <PipelineStatusBadge status={pipeline.status} />
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => onRun(pipeline.id)}>
                            <Play className="mr-2 h-4 w-4" /> Run Now
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                            <Settings className="mr-2 h-4 w-4" /> Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onOpenSettings(pipeline)}>
                            <Workflow className="mr-2 h-4 w-4" /> Properties
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Card Body */}
            <p className="text-sm text-muted-foreground/80 line-clamp-2 h-10 mb-6 leading-relaxed font-medium relative z-10">
                {pipeline.description || <span className="italic opacity-50">No description provided.</span>}
            </p>

            {/* Card Footer */}
            <div className="mt-auto pt-5 border-t border-white/5 flex items-center justify-between text-xs font-medium relative z-10">
                <div className="flex items-center gap-2 text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-mono">{pipeline.schedule_cron || 'Manual'}</span>
                </div>
                
                {lastJob ? (
                    <div className="flex items-center gap-2">
                        {lastJob.status === 'success' || lastJob.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <XCircle className="h-4 w-4 text-rose-500" />
                        )}
                        <span className="text-muted-foreground">
                            {formatDistanceToNow(new Date(lastJob.started_at!), { addSuffix: true })}
                        </span>
                    </div>
                ) : (
                    <span className="text-muted-foreground italic opacity-70">No runs yet</span>
                )}
            </div>
        </div>
    );
};
