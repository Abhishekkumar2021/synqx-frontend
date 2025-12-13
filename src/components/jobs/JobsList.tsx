import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { type Job } from '@/lib/api';

interface JobsListProps {
    jobs: Job[];
    isLoading: boolean;
    selectedJobId: number | null;
    onSelect: (id: number) => void;
    filter: string;
    onFilterChange: (value: string) => void;
}

export const JobsList: React.FC<JobsListProps> = ({
    jobs,
    isLoading,
    selectedJobId,
    onSelect,
    filter,
    onFilterChange
}) => {
    return (
        <div className="lg:col-span-4 flex flex-col h-full bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            {/* Search Toolbar */}
            <div className="p-4 border-b border-border/50 bg-muted/5 space-y-4">
                <div className="relative group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by ID or Status..."
                        className="pl-9 h-9 bg-background/50 focus:bg-background transition-all border-muted-foreground/20 focus:border-primary/50"
                        value={filter}
                        onChange={(e) => onFilterChange(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>{jobs.length} Executions</span>
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
                        {jobs.map((job: Job) => (
                            <div
                                key={job.id}
                                onClick={() => onSelect(job.id)}
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
    );
};
