import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJobs, type Job } from '../lib/api';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Clock, ArrowRight, PlayCircle } from 'lucide-react';
import { JobLogViewer } from '../components/JobLogViewer';
import { Button } from '../components/ui/button';

// I didn't create Badge properly in the previous turn, I removed it.
// I should create a Badge component or use a simple span.
// Let's create a quick badge component inline or in UI folder if I can.
// I'll stick to span for now to be safe or re-create Badge.

const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
        pending: "bg-muted text-muted-foreground border-border",
        running: "bg-blue-500/15 text-blue-500 border-blue-500/20 animate-pulse",
        completed: "bg-green-500/15 text-green-500 border-green-500/20",
        failed: "bg-destructive/15 text-destructive border-destructive/20",
        cancelled: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20",
    };
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[status] || variants.pending}`}>
            {status}
        </span>
    )
}

export const JobsPage: React.FC = () => {
  const [selectedJobId, setSelectedJobId] = React.useState<number | null>(null);

  // Fetch recent jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
    refetchInterval: 5000, 
  });

  const selectedJob = jobs?.find((j: Job) => j.id === selectedJobId);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading runs...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
       <div className="flex items-center justify-between shrink-0">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Jobs & Runs</h2>
            <p className="text-muted-foreground">Monitor and debug pipeline executions.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Run List (Left Pane) */}
        <Card className="lg:col-span-4 flex flex-col overflow-hidden border-border bg-card h-full">
            <CardHeader className="py-4 border-b border-border bg-muted/30">
                <CardTitle className="text-base font-semibold">Execution History</CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {jobs?.map((job: Job) => (
                    <div 
                        key={job.id} 
                        onClick={() => setSelectedJobId(job.id)}
                        className={`
                            group flex flex-col gap-2 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md
                            ${selectedJobId === job.id 
                                ? 'bg-primary/5 border-primary ring-1 ring-primary/20' 
                                : 'bg-card border-border hover:border-primary/50'
                            }
                        `}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold flex items-center gap-2">
                                Run #{job.id}
                            </span>
                            <StatusBadge status={job.status} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                             <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {job.started_at ? new Date(job.started_at).toLocaleString() : 'Queued'}
                            </div>
                            <ArrowRight className={`h-3 w-3 opacity-0 -translate-x-2 transition-all duration-300 ${selectedJobId === job.id ? 'opacity-100 translate-x-0 text-primary' : 'group-hover:opacity-100 group-hover:translate-x-0'}`} />
                        </div>
                    </div>
                ))}
                {(!jobs || jobs.length === 0) && (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                        No runs found.
                    </div>
                )}
            </div>
        </Card>

        {/* Detail View (Right Pane) */}
        <Card className="lg:col-span-8 flex flex-col overflow-hidden border-border bg-card h-full">
            {selectedJobId ? (
                <>
                    <CardHeader className="py-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between shrink-0">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                Log Stream: Run #{selectedJobId}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground font-mono">
                                ID: {selectedJobId} • Pipeline: {selectedJob?.pipeline_id} • {selectedJob?.trigger_type}
                            </span>
                        </div>
                        <div className="flex gap-2">
                             {/* Placeholder for actions like Cancel/Retry */}
                             {selectedJob?.status === 'running' && (
                                <Button variant="destructive" size="sm" className="h-8">Stop Run</Button>
                             )}
                        </div>
                    </CardHeader>
                    
                    {/* 
                        Here we could split into "Steps" and "Logs" tabs.
                        For now, we just show the LogViewer which is the most critical part.
                    */}
                    <div className="flex-1 bg-black p-0 overflow-hidden relative">
                         <JobLogViewer initialJobId={selectedJobId} hideControls={true} />
                    </div>
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                    <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                        <PlayCircle className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">Select a run to view details</p>
                    <p className="text-sm">Click on any execution from the list on the left.</p>
                </div>
            )}
        </Card>
      </div>
    </div>
  );
};