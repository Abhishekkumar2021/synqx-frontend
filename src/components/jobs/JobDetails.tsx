import React from 'react';
import { Button } from '@/components/ui/button';
import { JobLogViewer } from '@/components/JobLogViewer';
import { differenceInSeconds } from 'date-fns';
import {
    Calendar, Timer, ChevronRight, Terminal
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { type Job } from '@/lib/api';

interface JobDetailsProps {
    job: Job | undefined;
    onClose?: () => void; // Optional if we want to add a close button on mobile
}

export const JobDetails: React.FC<JobDetailsProps> = ({ job }) => {
    return (
        <div className="lg:col-span-8 flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden relative">
            {job ? (
                <>
                    {/* Active Job Header */}
                    <div className="px-5 py-4 border-b border-border/50 bg-background/50 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    Execution #{job.id}
                                </h3>
                                <StatusBadge status={job.status || 'Unknown'} />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-primary/70" />
                                    {job.started_at ? new Date(job.started_at).toLocaleString() : '-'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Timer className="h-3.5 w-3.5 text-primary/70" />
                                    Duration: <span className="text-foreground">
                                        {job.finished_at && job.started_at
                                            ? `${differenceInSeconds(new Date(job.finished_at), new Date(job.started_at))}s`
                                            : 'Running...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {job.status === 'running' && (
                                <Button variant="destructive" size="sm" className="h-8 shadow-sm">
                                    Stop Execution
                                </Button>
                            )}
                            <Button variant="outline" size="sm" className="h-8 gap-2 border-border/50 hover:bg-muted">
                                View Pipeline <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>


                    <JobLogViewer initialJobId={job.id} hideControls={true} />
                </>
            ) : (
                /* Empty State */
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-muted/5 animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative mb-6 group cursor-default">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative h-24 w-24 rounded-2xl bg-linear-to-br from-muted to-muted/50 border border-border shadow-inner flex items-center justify-center">
                            <Terminal className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Select an Execution</h3>
                    <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
                        Click on a job from the list to view detailed logs, metadata, and error traces.
                    </p>
                </div>
            )}
        </div>
    );
};
