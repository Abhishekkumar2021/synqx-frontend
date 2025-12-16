import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJobs, type Job } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    History, RefreshCw, Terminal, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { JobsList } from '@/components/features/jobs/JobsList';
import { JobDetails } from '@/components/features/jobs/JobDetails';
import { PageMeta } from '@/components/common/PageMeta';

export const JobsPage: React.FC = () => {
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
    const [filter, setFilter] = useState('');

    const { data: jobs, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => getJobs(),
        refetchInterval: 3000,
    });

    const selectedJob = useMemo(() => jobs?.find((j: Job) => j.id === selectedJobId), [jobs, selectedJobId]);

    const filteredJobs = useMemo(() => {
        if (!jobs) return [];
        if (!filter) return jobs;
        return jobs.filter((j: Job) =>
            j.id.toString().includes(filter) ||
            j.status.toLowerCase().includes(filter.toLowerCase()) ||
            j.pipeline_id.toString().includes(filter)
        );
    }, [jobs, filter]);

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-700">
            <PageMeta title="Execution History" description="Monitor pipeline runs and logs." />

            {/* --- Header Section --- */}
            <div className="flex items-center justify-between shrink-0 px-1">
                <div className="space-y-1.5">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 backdrop-blur-md shadow-sm">
                            <History className="h-5 w-5 text-primary" />
                        </div>
                        Execution History
                    </h2>
                    <p className="text-base text-muted-foreground font-medium pl-1">
                        Real-time monitoring and forensic logs for pipeline executions.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-background/50 rounded-full border border-border shadow-sm">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Live Stream</span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        className={cn(
                            "gap-2 rounded-full border-border/50 bg-card hover:bg-muted/50 transition-all shadow-sm",
                            isRefetching && "opacity-80"
                        )}
                        disabled={isRefetching}
                    >
                        <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* --- Main Content Area (Glass Panel) --- */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 relative">

                {/* Background Decoration 
                   This creates the subtle "glow" behind the main panels 
                */}
                <div className="absolute inset-0 bg-linear-to-tr from-primary/5 via-transparent to-blue-500/5 rounded-[2rem] -z-10 blur-xl opacity-50" />

                {/* --- LEFT PANEL: List --- */}
                <div className="lg:col-span-4 h-full rounded-[2rem] border border-border/60 bg-card/40 backdrop-blur-xl shadow-lg shadow-black/5 overflow-hidden flex flex-col relative">
                    <JobsList
                        jobs={filteredJobs}
                        isLoading={isLoading}
                        selectedJobId={selectedJobId}
                        onSelect={setSelectedJobId}
                        filter={filter}
                        onFilterChange={setFilter}
                    />
                </div>

                {/* --- RIGHT PANEL: Details / Terminal --- */}
                <div className="lg:col-span-8 h-full rounded-[2rem] border border-border/60 bg-card/60 backdrop-blur-2xl shadow-xl shadow-black/5 overflow-hidden relative flex flex-col">
                    {selectedJob ? (
                        <JobDetails job={selectedJob} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 space-y-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-linear-to-r from-primary to-purple-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative p-8 rounded-full bg-background border border-border/50 shadow-2xl">
                                    <Terminal className="h-12 w-12 opacity-50" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-semibold text-foreground">No Execution Selected</h3>
                                <p className="max-w-xs mx-auto text-sm">
                                    Select a job from the list on the left to view detailed logs and metrics.
                                </p>
                            </div>

                            {/* Decorative Fake Stats */}
                            <div className="flex gap-8 mt-8 opacity-40 grayscale">
                                <div className="flex flex-col items-center gap-1">
                                    <Activity className="h-5 w-5" />
                                    <span className="text-xs font-mono">IDLE</span>
                                </div>
                                <div className="h-8 w-px bg-border"></div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs font-bold font-mono">0ms</span>
                                    <span className="text-[10px] uppercase">Latency</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};