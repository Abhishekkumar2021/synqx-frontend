/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJobs, type Job } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    History, RefreshCw, Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { JobsList } from '@/components/features/jobs/JobsList';
import { JobDetails } from '@/components/features/jobs/JobDetails';

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
        <div className="flex flex-col h-[calc(100vh-9rem)] gap-8 animate-in fade-in duration-700">

            {/* Header Section */}
            <div className="flex items-center justify-between shrink-0 px-1">
                <div className="space-y-2">
                    <h2 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/50 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-2xl ring-1 ring-white/10 backdrop-blur-md">
                            <History className="h-6 w-6 text-primary" />
                        </div>
                        Execution History
                    </h2>
                    <p className="text-base text-muted-foreground/80 font-medium pl-1">
                        Real-time monitoring and forensic logs for pipeline executions.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-xs font-bold text-emerald-500 tracking-wide uppercase">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2.5"></span>
                        Live Stream
                    </div>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => refetch()}
                        className={cn("gap-2 rounded-full border-white/10 bg-white/5 hover:bg-white/10", isRefetching && "opacity-80")}
                        disabled={isRefetching}
                    >
                        <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Main Grid Layout (Glass Container) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 bg-card/40 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl p-1 relative overflow-hidden">
                
                {/* --- LEFT PANEL: List --- */}
                <div className="lg:col-span-4 h-full rounded-2xl bg-white/5 border border-white/5 overflow-hidden flex flex-col">
                    <JobsList 
                        jobs={filteredJobs} 
                        isLoading={isLoading} 
                        selectedJobId={selectedJobId} 
                        onSelect={setSelectedJobId}
                        filter={filter}
                        onFilterChange={setFilter}
                    />
                </div>

                {/* --- RIGHT PANEL: Details --- */}
                <div className="lg:col-span-8 h-full rounded-2xl bg-black/40 border border-white/10 overflow-hidden relative shadow-inner">
                    {selectedJob ? (
                         <JobDetails job={selectedJob} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
                            <Terminal className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a job to view logs</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};