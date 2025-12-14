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
        <div className="flex flex-col h-full bg-transparent">
            {/* Search Toolbar */}
            <div className="p-5 border-b border-white/5 bg-white/5 space-y-4">
                <div className="relative group">
                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by ID or Status..."
                        className="pl-10 h-10 rounded-xl bg-black/20 focus:bg-black/30 transition-all border-transparent focus:border-primary/30"
                        value={filter}
                        onChange={(e) => onFilterChange(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground/70 px-1">
                    <span>{jobs.length} Executions</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-primary hover:bg-white/10 rounded-full">
                        <Filter className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-3">
                                <div className="flex justify-between"><Skeleton className="h-4 w-20 rounded-md" /><Skeleton className="h-4 w-12 rounded-md" /></div>
                                <Skeleton className="h-3 w-32 rounded-md" />
                            </div>
                        ))}
                    </div>
                ) : (
                    // Added "divide-y" here for separators
                    <div className="p-2 space-y-1">
                        {jobs.map((job: Job) => (
                            <div
                                key={job.id}
                                onClick={() => onSelect(job.id)}
                                className={cn(
                                    "group relative flex flex-col gap-2 p-4 transition-all duration-300 cursor-pointer rounded-xl hover:bg-white/5 border border-transparent",
                                    selectedJobId === job.id
                                        ? "bg-white/10 border-white/10 shadow-lg" 
                                        : ""
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
                                    <span className="text-[10px] text-muted-foreground font-medium tabular-nums opacity-70">
                                        {job.started_at ? formatDistanceToNow(new Date(job.started_at), { addSuffix: true }) : ''}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                        <GitBranch className="h-3 w-3 opacity-70" />
                                        <span>Pipeline-{job.pipeline_id}</span>
                                    </div>
                                    <StatusBadge status={job.status} className="scale-90 origin-right" />
                                </div>
                                
                                {selectedJobId === job.id && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};