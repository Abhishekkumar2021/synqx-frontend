import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJobs, type Job } from '../lib/api';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { 
    Clock, 
    PlayCircle, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    AlertCircle,
    History
} from 'lucide-react';
import { JobLogViewer } from '../components/JobLogViewer';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
        pending: "bg-muted text-muted-foreground border-border",
        queued: "bg-blue-500/10 text-blue-600 border-blue-200",
        running: "bg-blue-500/15 text-blue-600 border-blue-500/20 animate-pulse",
        completed: "bg-green-500/15 text-green-600 border-green-500/20",
        success: "bg-green-500/15 text-green-600 border-green-500/20",
        failed: "bg-destructive/15 text-destructive border-destructive/20",
        cancelled: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
    };
    
    const icons: Record<string, React.ReactNode> = {
        completed: <CheckCircle2 className="w-3 h-3 mr-1" />,
        success: <CheckCircle2 className="w-3 h-3 mr-1" />,
        failed: <XCircle className="w-3 h-3 mr-1" />,
        running: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
        pending: <Clock className="w-3 h-3 mr-1" />,
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[status] || variants.pending}`}>
            {icons[status]}
            <span className="capitalize">{status}</span>
        </span>
    )
}

export const JobsPage: React.FC = () => {
  const [selectedJobId, setSelectedJobId] = React.useState<number | null>(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
    refetchInterval: 3000, 
  });

  const selectedJob = jobs?.find((j: Job) => j.id === selectedJobId);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500">
       <div className="flex items-center justify-between shrink-0">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Jobs & Runs</h2>
            <p className="text-muted-foreground mt-1">Global execution history across all pipelines.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Run List (Left Pane) */}
        <Card className="lg:col-span-4 flex flex-col overflow-hidden border-border bg-card shadow-lg h-full">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <History className="h-4 w-4" /> Recent Runs
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-normal">
                        {jobs?.length || 0} Total
                    </Badge>
                </div>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-border">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-card/50">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-4 w-12 rounded" />
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        {jobs?.map((job: Job) => (
                            <div 
                                key={job.id} 
                                onClick={() => setSelectedJobId(job.id)}
                                className={`
                                    group relative flex flex-col gap-2 p-3 rounded-lg border transition-all cursor-pointer
                                    ${selectedJobId === job.id 
                                        ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-sm' 
                                        : 'bg-card border-border hover:border-primary/40 hover:bg-muted/30'
                                    }
                                `}
                            >
                                {/* Status Bar Indicator */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-colors ${
                                    (job.status as string) === 'success' || job.status === 'completed' ? 'bg-green-500' :
                                    job.status === 'failed' ? 'bg-destructive' :
                                    job.status === 'running' ? 'bg-blue-500' : 'bg-muted'
                                }`} />

                                <div className="flex items-center justify-between pl-2">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        Run #{job.id}
                                    </span>
                                    <StatusBadge status={job.status} />
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground pl-2 mt-1">
                                     <div className="flex items-center gap-1.5" title={job.started_at}>
                                        <Clock className="h-3 w-3" />
                                        {job.started_at ? formatDistanceToNow(new Date(job.started_at), { addSuffix: true }) : 'Queued'}
                                    </div>
                                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                        PIPE-{job.pipeline_id}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(!jobs || jobs.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                                <AlertCircle className="h-8 w-8 opacity-20" />
                                <span className="text-sm">No runs found</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Card>

        {/* Detail View (Right Pane) */}
        <Card className="lg:col-span-8 flex flex-col overflow-hidden border-border bg-card shadow-lg h-full relative">
            {selectedJobId ? (
                <>
                    <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between shrink-0">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    Log Stream
                                </CardTitle>
                                <Badge variant="outline" className="font-mono text-[10px]">
                                    ID: {selectedJobId}
                                </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                Pipeline ID: {selectedJob?.pipeline_id} • Trigger: {selectedJob?.trigger_type || 'Manual'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                             {selectedJob?.status === 'running' && (
                                <Button variant="destructive" size="sm" className="h-7 text-xs">Stop Run</Button>
                             )}
                        </div>
                    </CardHeader>
                    
                    <div className="flex-1 bg-[#0d1117] p-0 overflow-hidden relative font-mono text-sm">
                         <JobLogViewer initialJobId={selectedJobId} hideControls={true} />
                    </div>
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5 p-8 text-center">
                    <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-6 animate-pulse">
                        <PlayCircle className="h-10 w-10 opacity-40" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground/80 mb-2">Ready to inspect</h3>
                    <p className="max-w-sm text-sm">
                        Select an execution from the history list to view live logs, step details, and debugging information.
                    </p>
                </div>
            )}
        </Card>
      </div>
    </div>
  );
};
