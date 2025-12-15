import React from 'react';
import { Button } from '@/components/ui/button';
import { JobLogViewer } from '@/components/features/jobs/JobLogViewer';
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
        <div className="lg:col-span-8 flex flex-col h-full bg-transparent overflow-hidden relative">
            {job ? (
                <>
                    {/* Active Job Header */}
                    <div className="px-6 py-5 border-b border-white/5 bg-white/5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                    Execution #{job.id}
                                </h3>
                                <StatusBadge status={job.status || 'Unknown'} />
                            </div>
                            <div className="flex items-center gap-5 text-xs text-muted-foreground font-medium">
                                <div className="flex items-center gap-2 bg-black/20 px-2.5 py-1 rounded-lg border border-white/5">
                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                    {job.started_at ? new Date(job.started_at).toLocaleString() : '-'}
                                </div>
                                <div className="flex items-center gap-2 bg-black/20 px-2.5 py-1 rounded-lg border border-white/5">
                                    <Timer className="h-3.5 w-3.5 text-primary" />
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
                                <Button variant="destructive" size="sm" className="h-9 shadow-sm rounded-full">
                                    Stop Execution
                                </Button>
                            )}
                            <Button variant="outline" size="sm" className="h-9 gap-2 border-white/10 hover:bg-white/10 rounded-full hover:border-primary/30 transition-all">
                                View Pipeline <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>


                    <JobLogViewer initialJobId={job.id} hideControls={true} />
                </>
            ) : (
                /* Empty State */
                <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative mb-8 group cursor-default">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="relative h-32 w-32 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-500 backdrop-blur-sm">
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