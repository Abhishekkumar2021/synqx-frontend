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
    const styles = useMemo(() => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'success': return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
            case 'failed':
            case 'error': return "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400";
            case 'running': return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 animate-pulse";
            case 'queued': return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400";
            default: return "bg-muted text-muted-foreground border-border";
        }
    }, [status]);

    const icon = useMemo(() => {
        switch (status?.toLowerCase()) {
            case 'running': return <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />;
            case 'failed': return <XCircle className="w-3 h-3 mr-1.5" />;
            case 'success': 
            case 'completed': return <CheckCircle2 className="w-3 h-3 mr-1.5" />;
            default: return <Clock className="w-3 h-3 mr-1.5" />;
        }
    }, [status]);

    return (
        <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors", styles)}>
            {icon} {status}
        </span>
    )
}

export const JobsPage: React.FC = () => {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [filter, setFilter] = useState('');

  const { data: jobs, isLoading, refetch } = useQuery({
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
        j.status.toLowerCase().includes(filter.toLowerCase())
    );
  }, [jobs, filter]);

  return (
    // FIX 1: Exact height calculation taking Header (64px) + Padding (64px) + Buffer into account
    // min-h-0 is crucial for nested scrolling to work in Flex/Grid
    <div className="flex flex-col h-[calc(100vh-10rem)] gap-4 animate-in fade-in duration-500 overflow-hidden">
       
       {/* Page Header */}
       <div className="flex items-center justify-between shrink-0 px-1">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <History className="h-6 w-6 text-primary" />
                    Execution History
                </h2>
                <p className="text-sm text-muted-foreground hidden sm:block">
                    Monitor pipeline runs, debug logs, and audit execution times.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Refresh
                </Button>
            </div>
      </div>

      {/* Main Content Grid - min-h-0 prevents overflow */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        
        {/* --- LEFT PANE: Run List --- */}
        <div className="lg:col-span-4 flex flex-col h-full bg-card rounded-lg border shadow-sm overflow-hidden min-h-0">
            {/* List Toolbar */}
            <div className="p-3 border-b bg-muted/20 space-y-3 shrink-0">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Filter runs..." 
                        className="pl-8 h-9 text-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>{filteredJobs.length} results</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                        <Filter className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-border">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="p-3 rounded-md border bg-muted/10 space-y-2">
                            <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-12" /></div>
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))
                ) : (
                    filteredJobs.map((job: Job) => (
                        <div 
                            key={job.id} 
                            onClick={() => setSelectedJobId(job.id)}
                            className={cn(
                                "group relative flex flex-col gap-1.5 p-3 rounded-md border transition-all cursor-pointer select-none",
                                selectedJobId === job.id 
                                    ? "bg-accent border-primary/50 ring-1 ring-primary/20" 
                                    : "bg-card border-transparent hover:bg-muted/50 hover:border-border"
                            )}
                        >
                            {selectedJobId === job.id && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-primary" />
                            )}

                            <div className="flex items-center justify-between pl-2">
                                <span className={cn(
                                    "text-sm font-semibold font-mono", 
                                    selectedJobId === job.id ? "text-primary" : "text-foreground"
                                )}>
                                    #{job.id}
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {job.started_at ? formatDistanceToNow(new Date(job.started_at), { addSuffix: true }) : ''}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pl-2">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <GitBranch className="h-3 w-3" />
                                    <span>Pipeline-{job.pipeline_id}</span>
                                </div>
                                <StatusBadge status={job.status} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* --- RIGHT PANE: Details & Logs --- */}
        <div className="lg:col-span-8 flex flex-col h-full bg-card rounded-lg border shadow-sm overflow-hidden relative min-h-0">
            {selectedJobId ? (
                <>
                    {/* Job Metadata Header */}
                    <div className="px-4 py-3 border-b bg-muted/10 shrink-0">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    Execution #{selectedJobId}
                                </h3>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {selectedJob?.started_at ? new Date(selectedJob.started_at).toLocaleDateString() : '-'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Timer className="h-3.5 w-3.5" />
                                        {selectedJob?.finished_at && selectedJob?.started_at
                                            ? `${differenceInSeconds(new Date(selectedJob.finished_at), new Date(selectedJob.started_at))}s`
                                            : 'In Progress'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {selectedJob?.status === 'running' && (
                                    <Button variant="destructive" size="sm" className="h-8">Stop</Button>
                                )}
                                <Button variant="secondary" size="sm" className="h-8 gap-1">
                                    Pipeline <ChevronRight className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Log Viewer Container - Takes remaining height */}
                    <div className="flex-1 bg-[#0c0c0c] relative min-h-0 overflow-hidden">
                         <JobLogViewer initialJobId={selectedJobId} hideControls={true} />
                    </div>
                </>
            ) : (
                /* Empty State */
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5 p-8 text-center animate-in fade-in zoom-in-95">
                    <div className="h-24 w-24 rounded-full bg-muted/20 flex items-center justify-center mb-6 ring-8 ring-muted/5">
                        <Terminal className="h-10 w-10 opacity-30 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Select a Run</h3>
                    <p className="max-w-sm text-sm text-muted-foreground/80 leading-relaxed">
                        Click on an execution from the list on the left to inspect live logs.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};