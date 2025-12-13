/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJobs, type Job } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    History, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { JobsList } from '@/components/jobs/JobsList';
import { JobDetails } from '@/components/jobs/JobDetails';

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
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500">

            {/* Header Section */}
            <div className="flex items-center justify-between shrink-0">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg ring-1 ring-primary/20">
                            <History className="h-5 w-5 text-primary" />
                        </div>
                        Execution History
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Real-time monitoring and forensic logs for pipeline executions.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center px-3 py-1 bg-muted/50 rounded-full border border-border/50 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
                        Live Updates
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        className={cn("gap-2", isRefetching && "opacity-80")}
                        disabled={isRefetching}
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="flex-1 grid grid-cols-1 lg:col-span-12 gap-6 min-h-0">

                {/* --- LEFT PANEL: List --- */}
                <JobsList 
                    jobs={filteredJobs} 
                    isLoading={isLoading} 
                    selectedJobId={selectedJobId} 
                    onSelect={setSelectedJobId}
                    filter={filter}
                    onFilterChange={setFilter}
                />

                {/* --- RIGHT PANEL: Details --- */}
                <JobDetails job={selectedJob} />
            </div>
        </div>
    );
};