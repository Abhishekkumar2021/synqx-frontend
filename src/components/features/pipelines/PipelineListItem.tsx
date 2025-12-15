import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    GitBranch, MoreVertical, Settings, History, Trash2,
    CheckCircle2, AlertCircle, Loader2, Play
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
    const isRunning = lastJob?.status === 'running' || lastJob?.status === 'pending';

    return (
        <div
            className="group grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-muted/30 transition-all duration-200 border-b border-border/40 last:border-0"
        >
            {/* --- Column 1: Identity --- */}
            <div className="col-span-12 md:col-span-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-300">
                    <GitBranch className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <Link
                        to={`/pipelines/${pipeline.id}`}
                        className="block font-semibold text-sm text-foreground hover:text-primary hover:underline decoration-dashed decoration-primary/30 underline-offset-4 truncate mb-0.5 transition-colors"
                    >
                        {pipeline.name}
                    </Link>
                    <div className="text-xs text-muted-foreground truncate max-w-[90%]">
                        {pipeline.description || <span className="italic opacity-50">No description provided</span>}
                    </div>
                </div>
            </div>

            {/* --- Column 2: Status Badge --- */}
            <div className="col-span-6 md:col-span-2 flex items-center mt-1 md:mt-0">
                <PipelineStatusBadge status={pipeline.status} />
            </div>

            {/* --- Column 3: Last Run Info --- */}
            <div className="col-span-6 md:col-span-3 flex items-center mt-1 md:mt-0">
                {lastJob ? (
                    <div className="flex flex-col gap-1">
                        <div className={cn(
                            "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide",
                            isSuccess ? "text-success" :
                                isFailed ? "text-destructive" :
                                    isRunning ? "text-info" : "text-muted-foreground"
                        )}>
                            {isSuccess ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                                isFailed ? <AlertCircle className="h-3.5 w-3.5" /> :
                                    isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            <span>{lastJob.status}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                            {formatDistanceToNow(new Date(lastJob.started_at!), { addSuffix: true })}
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground/50 italic pl-1 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-border" />
                        No runs yet
                    </span>
                )}
            </div>

            {/* --- Column 4: Actions --- */}
            <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2 mt-1 md:mt-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/40 text-xs font-medium px-4 hidden sm:flex"
                    onClick={() => onRun(pipeline.id)}
                    disabled={isRunningMutation}
                >
                    {isRunningMutation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 mr-1.5 fill-current" />}
                    Run
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/40 bg-background/80 backdrop-blur-xl shadow-xl">
                        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                            <Settings className="h-3.5 w-3.5 opacity-70" /> Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate(`/pipelines/${pipeline.id}?tab=runs`)}>
                            <History className="h-3.5 w-3.5 opacity-70" /> Run History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/40" />
                        <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => console.log('delete')}>
                            <Trash2 className="h-3.5 w-3.5 opacity-70" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};