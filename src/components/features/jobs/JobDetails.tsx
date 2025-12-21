import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { JobLogViewer } from '@/components/features/jobs/JobLogViewer';
import { differenceInSeconds } from 'date-fns';
import {
    Calendar, Timer, ChevronRight, Terminal, RefreshCw, StopCircle
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { type Job, cancelJob, retryJob } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface JobDetailsProps {
    job: Job | undefined;
    onClose?: () => void; // Optional if we want to add a close button on mobile
}

const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'Running...';
    const seconds = differenceInSeconds(new Date(end), new Date(start));
    if (seconds < 60) return `${seconds}s`;
    
    // Simple M:SS format
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
};


export const JobDetails: React.FC<JobDetailsProps> = ({ job }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const cancelMutation = useMutation({
        mutationFn: cancelJob,
        onSuccess: () => {
            toast.success("Job cancellation requested");
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
        onError: () => toast.error("Failed to cancel job")
    });

    const retryMutation = useMutation({
        mutationFn: retryJob,
        onSuccess: () => {
            toast.success("Job retry initiated");
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
        onError: () => toast.error("Failed to retry job")
    });

    return (
        <div className="lg:col-span-8 flex flex-col h-full bg-transparent overflow-hidden relative">
            {job ? (
                <>
                    {/* Active Job Header (Theme-aware Glass Header) */}
                    <div className="px-6 py-4 border-b border-border/40 bg-muted/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20 shadow-sm">
                                <Terminal className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold tracking-tight text-foreground">
                                        Execution #{job.id}
                                    </h3>
                                    <StatusBadge status={job.status || 'Unknown'} />
                                </div>
                                <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3 opacity-70" />
                                        {job.started_at ? new Date(job.started_at).toLocaleString() : '-'}
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-border" />
                                    <span className="flex items-center gap-1.5">
                                        <Timer className="h-3 w-3 opacity-70" />
                                        {formatDuration(job.started_at!, job.completed_at!)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {job.status === 'running' && (
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="h-9 shadow-lg shadow-destructive/20 rounded-xl gap-2 px-4"
                                    onClick={() => cancelMutation.mutate(job.id)}
                                    disabled={cancelMutation.isPending}
                                >
                                    <StopCircle className="h-4 w-4" /> Stop
                                </Button>
                            )}
                            {(job.status === 'failed' || job.status === 'cancelled') && (
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-9 shadow-sm rounded-xl gap-2 px-4 border border-border/50"
                                    onClick={() => retryMutation.mutate(job.id)}
                                    disabled={retryMutation.isPending}
                                >
                                    <RefreshCw className={cn("h-4 w-4", retryMutation.isPending && "animate-spin")} /> Retry
                                </Button>
                            )}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate(`/pipelines/${job.pipeline_id}`)}
                                className="h-9 gap-2 border-border/70 hover:bg-muted/30 rounded-xl hover:border-primary/50 transition-all px-4"
                            >
                                View Pipeline <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>


                    {/* Job Log Viewer is passed the job ID, inheriting the active theme */}
                    <JobLogViewer jobId={job.id} />
                </>
            ) : (
                /* Empty State (Theme-aware) */
                <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative mb-8 group cursor-default">
                        <div 
                            // Theme-aware primary glow effect
                            className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" 
                        />
                        <div 
                            // Theme-aware Glass panel look
                            className="relative h-32 w-32 rounded-[2.5rem] bg-card/40 border border-border/60 shadow-2xl shadow-black/30 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-500 backdrop-blur-sm"
                        >
                            <Terminal className="h-14 w-14 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-foreground tracking-tight">Select an Execution</h3>
                    <p className="max-w-xs text-base text-muted-foreground leading-relaxed font-medium">
                        Click on a job from the list to view detailed logs, metadata, and error traces.
                    </p>
                </div>
            )}
        </div>
    );
};