import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPipelines, getJobs, triggerPipeline, type Pipeline } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
    Plus, Workflow, MoreVertical, Settings, GitBranch, 
    Activity, Search, Clock, 
    CheckCircle2, XCircle, AlertTriangle, PauseCircle,
    History, LayoutGrid, List as ListIcon, Play} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { PipelineSettingsDialog } from '@/components/PipelineSettingsDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- 1. Semantic Status Badge ---
const PipelineStatusBadge = ({ status, className }: { status: string, className?: string }) => {
    const s = (status || '').toLowerCase();
    
    const config = useMemo(() => {
        if (s === 'active') return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Activity, animate: false };
        if (s === 'running') return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Activity, animate: true };
        if (s === 'paused') return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: PauseCircle, animate: false };
        if (['error', 'broken', 'failed'].includes(s)) return { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertTriangle, animate: false };
        return { color: "text-muted-foreground", bg: "bg-muted", border: "border-border", icon: Workflow, animate: false };
    }, [s]);

    const Icon = config.icon;

    return (
        <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", config.bg, config.color, config.border, className)}>
            <Icon className={cn("w-3 h-3 mr-1.5", config.animate && "animate-pulse")} />
            {status}
        </span>
    );
};

// --- 2. Main Component ---
export const PipelinesListPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
    const [filter, setFilter] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { data: pipelines, isLoading } = useQuery({ queryKey: ['pipelines'], queryFn: getPipelines });
    const { data: recentJobs } = useQuery({ 
        queryKey: ['jobs', 'recent'], 
        queryFn: () => getJobs(), 
        refetchInterval: 5000 
    });

    const runMutation = useMutation({
        mutationFn: (id: number) => triggerPipeline(id),
        onSuccess: () => {
            toast.success("Pipeline triggered successfully");
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        },
        onError: () => toast.error("Failed to trigger pipeline")
    });

    const openSettings = (pipeline: Pipeline) => {
        setSelectedPipeline(pipeline);
        setSettingsOpen(true);
    };

    const enrichedPipelines = useMemo(() => {
        if (!pipelines) return [];
        return pipelines.map(p => {
            const jobs = recentJobs?.filter(j => j.pipeline_id === p.id) || [];
            const lastJob = jobs.sort((a, b) => b.id - a.id)[0];
            return { ...p, lastJob };
        }).filter(p => 
            p.name.toLowerCase().includes(filter.toLowerCase()) || 
            p.description?.toLowerCase().includes(filter.toLowerCase())
        );
    }, [pipelines, recentJobs, filter]);

    if (isLoading) return <LoadingSkeleton />;

    return (
        <div className="flex flex-col h-[calc(100vh-9rem)] gap-6 animate-in fade-in duration-500">
            
            {/* --- Header --- */}
            <div className="flex items-center justify-between shrink-0">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg ring-1 ring-primary/20">
                            <Workflow className="h-5 w-5 text-primary" />
                        </div>
                        Pipelines
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Orchestrate and monitor your data workflows.
                    </p>
                </div>
                <Link to="/pipelines/new">
                     <Button className="shadow-[0_0_15px_-5px_var(--color-primary)]">
                        <Plus className="mr-2 h-4 w-4" /> Create Pipeline
                    </Button>
                </Link>
            </div>

            {/* --- Main Content Area --- */}
            <div className="flex-1 min-h-0 flex flex-col bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm overflow-hidden">
                
                {/* Toolbar */}
                <div className="p-4 border-b border-border/50 bg-muted/5 flex items-center justify-between shrink-0 gap-4">
                    <div className="relative w-full max-w-sm group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                            placeholder="Filter pipelines..." 
                            className="pl-9 h-9 bg-background/50 focus:bg-background border-muted-foreground/20 focus:border-primary/50"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-background/50 border border-border/50 px-3 py-1.5 rounded-md">
                            <Activity className="h-3 w-3" />
                            <span>{enrichedPipelines.length} Active</span>
                        </div>
                        <div className="flex items-center gap-1 bg-background/50 border border-border/50 rounded-lg p-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("h-7 w-7 rounded-md", viewMode === 'grid' ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-muted")} 
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("h-7 w-7 rounded-md", viewMode === 'list' ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-muted")} 
                                onClick={() => setViewMode('list')}
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* --- Grid View --- */}
                {viewMode === 'grid' && (
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-border">
                        {enrichedPipelines.length === 0 ? <EmptyState /> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {enrichedPipelines.map((pipeline) => {
                                    const lastJob = pipeline.lastJob;
                                    const isRunning = lastJob?.status === 'running';

                                    return (
                                        <div 
                                            key={pipeline.id}
                                            className="group relative flex flex-col bg-card hover:bg-muted/10 border border-border/50 hover:border-primary/30 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                                        >
                                            {/* Card Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-lg flex items-center justify-center border shadow-sm",
                                                        isRunning ? "bg-blue-500/10 border-blue-500/20 text-blue-500 animate-pulse" : "bg-muted/50 border-border/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-colors"
                                                    )}>
                                                        <GitBranch className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <Link to={`/pipelines/${pipeline.id}`} className="font-semibold text-base hover:underline decoration-primary/50 underline-offset-4 decoration-2">
                                                            {pipeline.name}
                                                        </Link>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <PipelineStatusBadge status={pipeline.status} />
                                                            <span className="text-[10px] text-muted-foreground font-mono">ID: {pipeline.id}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => runMutation.mutate(pipeline.id)}>
                                                            <Play className="mr-2 h-4 w-4" /> Run Now
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                                                            <Settings className="mr-2 h-4 w-4" /> Configure
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openSettings(pipeline)}>
                                                            <Workflow className="mr-2 h-4 w-4" /> Properties
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Card Body */}
                                            <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4 leading-relaxed">
                                                {pipeline.description || <span className="italic opacity-50">No description provided.</span>}
                                            </p>

                                            {/* Card Footer */}
                                            <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span className="font-mono">{pipeline.schedule_cron || 'Manual Trigger'}</span>
                                                </div>
                                                
                                                {lastJob ? (
                                                    <div className="flex items-center gap-1.5">
                                                        {lastJob.status === 'success' || lastJob.status === 'completed' ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                        ) : (
                                                            <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                                        )}
                                                        <span className="text-muted-foreground">
                                                            {formatDistanceToNow(new Date(lastJob.started_at!), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic">No runs yet</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* --- List View --- */}
                {viewMode === 'list' && (
                    <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-border">
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/50 bg-muted/10 text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0 sticky top-0 backdrop-blur-sm z-10">
                            <div className="col-span-12 md:col-span-5">Pipeline Details</div>
                            <div className="col-span-2 hidden md:block">Status</div>
                            <div className="col-span-3 hidden md:block">Last Run</div>
                            <div className="col-span-2 hidden md:block text-right">Actions</div>
                        </div>

                        {enrichedPipelines.length === 0 ? <EmptyState /> : (
                            <div className="divide-y divide-border/50">
                                {enrichedPipelines.map((pipeline) => {
                                    const lastJob = pipeline.lastJob;
                                    const isSuccess = lastJob?.status === 'completed' || lastJob?.status === 'success';
                                    const isFailed = lastJob?.status === 'failed' || lastJob?.status === 'error';

                                    return (
                                        <div 
                                            key={pipeline.id}
                                            className="group grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-muted/20 transition-all hover:border-l-2 hover:border-l-primary"
                                        >
                                            {/* Column 1 */}
                                            <div className="col-span-12 md:col-span-5 flex items-start gap-3">
                                                <div className="mt-1 p-2 rounded bg-background border border-border/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
                                                    <GitBranch className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <Link 
                                                        to={`/pipelines/${pipeline.id}`} 
                                                        className="block font-medium text-sm text-foreground hover:text-primary truncate"
                                                    >
                                                        {pipeline.name}
                                                    </Link>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                        <span className="truncate max-w-[200px]">
                                                            {pipeline.description || "No description"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 2 */}
                                            <div className="col-span-6 md:col-span-2 flex items-center mt-2 md:mt-0">
                                                <PipelineStatusBadge status={pipeline.status} />
                                            </div>

                                            {/* Column 3 */}
                                            <div className="col-span-6 md:col-span-3 flex items-center mt-2 md:mt-0">
                                                {lastJob ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 text-xs font-medium",
                                                            isSuccess ? "text-emerald-500" :
                                                            isFailed ? "text-rose-500" : "text-blue-500"
                                                        )}>
                                                            {isSuccess ? <CheckCircle2 className="h-3.5 w-3.5"/> : 
                                                             isFailed ? <XCircle className="h-3.5 w-3.5"/> : <Activity className="h-3.5 w-3.5 animate-pulse"/>}
                                                            <span className="capitalize">{lastJob.status}</span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground tabular-nums font-mono">
                                                            {formatDistanceToNow(new Date(lastJob.started_at!), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic pl-1">Never ran</span>
                                                )}
                                            </div>

                                            {/* Column 4 */}
                                            <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2 mt-2 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-8 text-xs hidden lg:flex bg-transparent hover:bg-primary/10 hover:text-primary hover:border-primary/30" 
                                                    onClick={() => runMutation.mutate(pipeline.id)}
                                                    disabled={runMutation.isPending}
                                                >
                                                    {runMutation.isPending ? "Starting..." : "Run"}
                                                </Button>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                                                            <Settings className="mr-2 h-4 w-4" /> Configure
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}?tab=runs`)}>
                                                            <History className="mr-2 h-4 w-4" /> Run History
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => console.log('delete')}>
                                                            <XCircle className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <PipelineSettingsDialog 
                pipeline={selectedPipeline} 
                open={settingsOpen} 
                onOpenChange={setSettingsOpen} 
            />
        </div>
    );
};

// --- Helper Components ---

const LoadingSkeleton = () => (
    <div className="space-y-6 p-4">
        <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 py-12">
        <div className="h-24 w-24 bg-muted/30 rounded-full flex items-center justify-center mb-6">
            <Workflow className="h-12 w-12 opacity-20" />
        </div>
        <p className="text-xl font-semibold text-foreground">No pipelines found</p>
        <p className="text-sm max-w-sm text-center mt-2 leading-relaxed">
            Create your first workflow to get started with data processing.
        </p>
    </div>
);