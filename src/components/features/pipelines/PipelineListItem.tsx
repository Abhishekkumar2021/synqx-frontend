import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
    GitBranch, MoreVertical, Settings, History, XCircle, 
    CheckCircle2, Activity 
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

interface PipelineListItemProps {
    pipeline: Pipeline & { lastJob?: Job };
    onRun: (id: number) => void;
    isRunningMutation: boolean;
}

export const PipelineListItem: React.FC<PipelineListItemProps> = ({ pipeline, onRun, isRunningMutation }) => {
    const navigate = useNavigate();
    const lastJob = pipeline.lastJob;
    const isSuccess = lastJob?.status === 'completed' || lastJob?.status === 'success';
    const isFailed = lastJob?.status === 'failed' || lastJob?.status === 'error';

    return (
        <div 
            className="group grid grid-cols-12 gap-4 items-center px-8 py-5 hover:bg-white/5 transition-all duration-200 border-b border-white/5 last:border-0"
        >
            {/* Column 1 */}
            <div className="col-span-12 md:col-span-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-colors">
                    <GitBranch className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <Link 
                        to={`/pipelines/${pipeline.id}`} 
                        className="block font-bold text-sm text-foreground hover:text-primary truncate mb-1"
                    >
                        {pipeline.name}
                    </Link>
                    <div className="text-xs text-muted-foreground truncate max-w-60">
                        {pipeline.description || "No description"}
                    </div>
                </div>
            </div>

            {/* Column 2 */}
            <div className="col-span-6 md:col-span-2 flex items-center mt-2 md:mt-0">
                <PipelineStatusBadge status={pipeline.status} />
            </div>

            {/* Column 3 */}
            <div className="col-span-6 md:col-span-3 flex items-center mt-2 md:mt-0">
                {lastJob ? (
                    <div className="flex flex-col gap-1">
                        <div className={cn(
                            "flex items-center gap-2 text-xs font-bold",
                            isSuccess ? "text-emerald-500" :
                            isFailed ? "text-rose-500" : "text-blue-500"
                        )}>
                            {isSuccess ? <CheckCircle2 className="h-3.5 w-3.5"/> : 
                                isFailed ? <XCircle className="h-3.5 w-3.5"/> : <Activity className="h-3.5 w-3.5 animate-pulse"/>}
                            <span className="capitalize">{lastJob.status}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums font-mono opacity-80">
                            {formatDistanceToNow(new Date(lastJob.started_at!), { addSuffix: true })}
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground italic pl-1 opacity-50">Never ran</span>
                )}
            </div>

            {/* Column 4 */}
            <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2 mt-2 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs hidden lg:flex rounded-full bg-white/5 hover:bg-primary/20 hover:text-primary text-muted-foreground" 
                    onClick={() => onRun(pipeline.id)}
                    disabled={isRunningMutation}
                >
                    {isRunningMutation ? "..." : "Run"}
                </Button>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                            <Settings className="mr-2 h-4 w-4" /> Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}?tab=runs`)}>
                            <History className="mr-2 h-4 w-4" /> Run History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => console.log('delete')}>
                            <XCircle className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};
