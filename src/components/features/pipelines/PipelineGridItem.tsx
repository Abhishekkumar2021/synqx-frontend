import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
    GitBranch, MoreVertical, Play, Settings, 
    Workflow, CalendarClock, CheckCircle2, AlertCircle, Loader2,
    History as HistoryIcon, Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { PipelineStatusBadge } from './PipelineStatusBadge';
import { type Pipeline, type Job, getPipelineStats, deletePipeline } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PipelineGridItemProps {
    pipeline: Pipeline & { lastJob?: Job };
    onRun: (id: number) => void;
    onOpenSettings: (pipeline: Pipeline) => void;
    onViewVersions: (pipeline: Pipeline) => void;
}

export const PipelineGridItem: React.FC<PipelineGridItemProps> = ({ pipeline, onRun, onOpenSettings, onViewVersions }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const lastJob = pipeline.lastJob;

    // Fetch pipeline stats
    const { data: stats } = useQuery({
        queryKey: ['pipeline-stats', pipeline.id],
        queryFn: () => getPipelineStats(pipeline.id),
        staleTime: 30000
    });

    const deleteMutation = useMutation({
        mutationFn: deletePipeline,
        onSuccess: () => {
            toast.success("Pipeline deleted");
            queryClient.invalidateQueries({ queryKey: ['pipelines'] });
            setIsDeleteDialogOpen(false);
        },
        onError: () => toast.error("Failed to delete pipeline")
    });
    
    // Status Logic
    const isRunning = lastJob?.status === 'running' || lastJob?.status === 'pending';
    const isSuccess = lastJob?.status === 'success';
    const isFailed = lastJob?.status === 'failed';

    const successRate = stats && stats.total_runs > 0 
        ? Math.round((stats.successful_runs / stats.total_runs) * 100) 
        : null;

    return (
        <>
            <div 
                className="group relative flex flex-col rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-sm p-6 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
            >
                {/* Hover Glow Effect */}
                <div className="absolute -right-20 -top-20 h-64 w-64 bg-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* --- Header --- */}
                <div className="flex items-start justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-4">
                        {/* Icon Box */}
                        <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center border shadow-sm transition-all duration-300",
                            isRunning 
                                ? "bg-info/10 border-info/20 text-info animate-pulse" 
                                : "bg-muted/50 border-border/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 group-hover:border-primary/20"
                        )}>
                            {isRunning ? <Loader2 className="h-7 w-7 animate-spin" /> : <GitBranch className="h-7 w-7" />}
                        </div>
                        
                        {/* Title & Badge */}
                        <div className="flex flex-col gap-1">
                            <Link 
                                to={`/pipelines/${pipeline.id}`} 
                                className="font-bold text-lg text-foreground hover:text-primary transition-colors line-clamp-1"
                            >
                                {pipeline.name}
                            </Link>
                            <div className="flex items-center gap-2">
                                <PipelineStatusBadge status={pipeline.status} />
                                {successRate !== null && (
                                    <span className={cn(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                                        successRate > 90 ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                                        successRate > 70 ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                                        "text-destructive border-destructive/20 bg-destructive/5"
                                    )}>
                                        {successRate}% Success
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/40 bg-background/80 backdrop-blur-xl shadow-xl">
                            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => onRun(pipeline.id)}>
                                <Play className="h-3.5 w-3.5 opacity-70" /> Run Now
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => onViewVersions(pipeline)}>
                                <HistoryIcon className="h-3.5 w-3.5 opacity-70" /> Versions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/40" />
                            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                                <Settings className="h-3.5 w-3.5 opacity-70" /> Configure
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => onOpenSettings(pipeline)}>
                                <Workflow className="h-3.5 w-3.5 opacity-70" /> Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/40" />
                            <DropdownMenuItem 
                                className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10" 
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5 opacity-70" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* --- Body (Description) --- */}
                <div className="relative z-10 flex-1 min-h-12 flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed font-medium">
                        {pipeline.description || <span className="italic opacity-50">No description provided for this pipeline.</span>}
                    </p>
                    
                    {stats && stats.total_runs > 0 && (
                        <div className="flex gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg. Duration</span>
                                <span className="text-xs font-mono font-bold">
                                    {stats.average_duration_seconds ? `${stats.average_duration_seconds.toFixed(1)}s` : '—'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Runs</span>
                                <span className="text-xs font-mono font-bold">{stats.total_runs}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Footer --- */}
                <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-medium relative z-10">
                    
                    {/* Schedule Chip */}
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border border-border/30">
                        <CalendarClock className="h-3.5 w-3.5 opacity-70" />
                        <span className="font-mono tracking-tight">{pipeline.schedule_cron || 'Manual Trigger'}</span>
                    </div>
                    
                    {/* Last Run Status */}
                    {lastJob ? (
                        <div className="flex items-center gap-1.5">
                            {isSuccess ? <CheckCircle2 className="h-4 w-4 text-success" /> : 
                            isFailed ? <AlertCircle className="h-4 w-4 text-destructive" /> : 
                            <Loader2 className="h-4 w-4 text-info animate-spin" />}
                            
                            <span className="text-muted-foreground">
                                {formatDistanceToNow(new Date(lastJob.started_at!), { addSuffix: true })}
                            </span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground/50 italic pr-1">Never ran</span>
                    )}
                </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the pipeline 
                            <span className="font-semibold text-foreground"> "{pipeline.name}" </span>
                            and all its run history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(pipeline.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};