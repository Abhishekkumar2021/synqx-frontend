import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJobs, type Job } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { JobLogViewer } from '@/components/JobLogViewer';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import {
    Clock, CheckCircle2, XCircle, Loader2, History,
    Search, Filter, Terminal, Calendar, Timer,
    GitBranch, RefreshCw, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const StatusBadge = ({ status }: { status: string }) => {
    const config = useMemo(() => {
        const s = status?.toLowerCase();
        if (s === 'completed' || s === 'success') return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 };
        if (s === 'failed' || s === 'error') return { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", icon: XCircle };
        if (s === 'running') return { color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", icon: Loader2, animate: true };
        return { color: "text-muted-foreground", bg: "bg-muted", border: "border-border", icon: Clock };
    }, [status]);

    const Icon = config.icon;

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all",
            config.color, config.bg, config.border
        )}>
            <Icon className={cn("w-3 h-3", config.animate && "animate-spin")} />
            {status}
        </span>
    )
}

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
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                {/* --- LEFT PANEL: List --- */}
                <div className="lg:col-span-4 flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                    {/* Search Toolbar */}
                    <div className="p-4 border-b border-border/50 bg-muted/5 space-y-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by ID or Status..."
                                className="pl-9 h-9 bg-background/50 focus:bg-background transition-all border-muted-foreground/20 focus:border-primary/50"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>{filteredJobs.length} Executions</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-primary">
                                <Filter className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    {/* List Items */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-card">
                        {isLoading ? (
                            <div className="p-2 space-y-2">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="p-4 rounded-lg border border-border/40 bg-card/50 space-y-3">
                                        <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-12" /></div>
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Added "divide-y" here for separators
                            <div className="divide-y divide-border/50">
                                {filteredJobs.map((job: Job) => (
                                    <div
                                        key={job.id}
                                        onClick={() => setSelectedJobId(job.id)}
                                        className={cn(
                                            "group relative flex flex-col gap-2 p-4 transition-all cursor-pointer hover:bg-muted/30",
                                            selectedJobId === job.id
                                                ? "bg-primary/5 border-l-4 border-l-primary pl-[13px]" // Left accent border for active
                                                : "border-l-4 border-l-transparent pl-[13px]"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-sm font-bold font-mono tracking-tight",
                                                    selectedJobId === job.id ? "text-primary" : "text-foreground"
                                                )}>
                                                    #{job.id}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                                                {job.started_at ? formatDistanceToNow(new Date(job.started_at), { addSuffix: true }) : ''}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between mt-1">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                                <GitBranch className="h-3 w-3 opacity-70" />
                                                <span>Pipeline-{job.pipeline_id}</span>
                                            </div>
                                            <StatusBadge status={job.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RIGHT PANEL: Details --- */}
                <div className="lg:col-span-8 flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden relative">
                    {selectedJobId ? (
                        <>
                            {/* Active Job Header */}
                            <div className="px-5 py-4 border-b border-border/50 bg-background/50 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            Execution #{selectedJobId}
                                        </h3>
                                        <StatusBadge status={selectedJob?.status || 'Unknown'} />
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-primary/70" />
                                            {selectedJob?.started_at ? new Date(selectedJob.started_at).toLocaleString() : '-'}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Timer className="h-3.5 w-3.5 text-primary/70" />
                                            Duration: <span className="text-foreground">
                                                {selectedJob?.finished_at && selectedJob?.started_at
                                                    ? `${differenceInSeconds(new Date(selectedJob.finished_at), new Date(selectedJob.started_at))}s`
                                                    : 'Running...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    {selectedJob?.status === 'running' && (
                                        <Button variant="destructive" size="sm" className="h-8 shadow-sm">
                                            Stop Execution
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" className="h-8 gap-2 border-border/50 hover:bg-muted">
                                        View Pipeline <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>


                            <JobLogViewer initialJobId={selectedJobId} hideControls={true} />
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
            </div>
        </div>
    );
};