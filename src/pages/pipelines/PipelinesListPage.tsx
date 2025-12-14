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
    History, LayoutGrid, List as ListIcon, Play
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { PipelineSettingsDialog } from '@/components/features/pipelines/PipelineSettingsDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- 1. Semantic Status Badge ---
const PipelineStatusBadge = ({ status, className }: { status: string, className?: string }) => {
    const s = (status || '').toLowerCase();
    
    const config = useMemo(() => {
        if (s === 'active') return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Activity, animate: false };
        if (s === 'running') return { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Activity, animate: true };
        if (s === 'paused') return { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: PauseCircle, animate: false };
        if (['error', 'broken', 'failed'].includes(s)) return { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertTriangle, animate: false };
        return { color: "text-muted-foreground", bg: "bg-white/5", border: "border-white/10", icon: Workflow, animate: false };
    }, [s]);

    const Icon = config.icon;

    return (
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm", config.bg, config.color, config.border, className)}>
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
        <div className="flex flex-col h-[calc(100vh-9rem)] gap-8 animate-in fade-in duration-700">
            
            {/* --- Header --- */}
            <div className="flex items-center justify-between shrink-0 px-1">
                <div className="space-y-2">
                    <h2 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/50 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-2xl ring-1 ring-white/10 backdrop-blur-md">
                            <Workflow className="h-6 w-6 text-primary" />
                        </div>
                        Pipelines
                    </h2>
                    <p className="text-base text-muted-foreground/80 font-medium pl-1">
                        Orchestrate and monitor your data workflows.
                    </p>
                </div>
                <Link to="/pipelines/new">
                     <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105">
                        <Plus className="mr-2 h-5 w-5" /> Create Pipeline
                    </Button>
                </Link>
            </div>

            {/* --- Main Content Area (Glass Pane) --- */}
            <div className="flex-1 min-h-0 flex flex-col bg-card/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative">
                
                {/* Toolbar */}
                <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0 gap-6">
                    <div className="relative w-full max-w-md group">
                        <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                            placeholder="Filter pipelines..." 
                            className="pl-11 h-11 rounded-2xl bg-black/5 dark:bg-white/5 border-transparent focus:bg-background focus:border-primary/30 transition-all"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-white/5 border border-white/5 px-4 py-2 rounded-full">
                            <Activity className="h-3.5 w-3.5" />
                            <span>{enrichedPipelines.length} Active</span>
                        </div>
                        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 border border-white/5 rounded-2xl p-1.5">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("h-8 w-8 rounded-xl transition-all", viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-white/5")} 
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("h-8 w-8 rounded-xl transition-all", viewMode === 'list' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-white/5")} 
                                onClick={() => setViewMode('list')}
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* --- Grid View --- */}
                {viewMode === 'grid' && (
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-border/50">
                        {enrichedPipelines.length === 0 ? <EmptyState /> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {enrichedPipelines.map((pipeline) => {
                                    const lastJob = pipeline.lastJob;
                                    const isRunning = lastJob?.status === 'running';

                                    return (
                                        <div 
                                            key={pipeline.id}
                                            className="group relative flex flex-col bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-[2rem] p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 backdrop-blur-md overflow-hidden"
                                        >
                                            {/* Glow Effect */}
                                            <div className="absolute -right-10 -top-10 h-32 w-32 bg-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                            {/* Card Header */}
                                            <div className="flex items-start justify-between mb-5 relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-14 w-14 rounded-2xl flex items-center justify-center border shadow-inner transition-all duration-300",
                                                        isRunning 
                                                            ? "bg-blue-500/20 border-blue-500/30 text-blue-500 animate-pulse shadow-[0_0_15px_-5px_var(--color-blue-500)]" 
                                                            : "bg-black/5 dark:bg-white/5 border-white/5 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20"
                                                    )}>
                                                        <GitBranch className="h-7 w-7" />
                                                    </div>
                                                    <div>
                                                        <Link to={`/pipelines/${pipeline.id}`} className="font-bold text-lg hover:text-primary transition-colors block mb-1">
                                                            {pipeline.name}
                                                        </Link>
                                                        <PipelineStatusBadge status={pipeline.status} />
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl">
                                                        <DropdownMenuItem onClick={() => runMutation.mutate(pipeline.id)}>
                                                            <Play className="mr-2 h-4 w-4" /> Run Now
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/10" />
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
                                            <p className="text-sm text-muted-foreground/80 line-clamp-2 h-10 mb-6 leading-relaxed font-medium relative z-10">
                                                {pipeline.description || <span className="italic opacity-50">No description provided.</span>}
                                            </p>

                                            {/* Card Footer */}
                                            <div className="mt-auto pt-5 border-t border-white/5 flex items-center justify-between text-xs font-medium relative z-10">
                                                <div className="flex items-center gap-2 text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span className="font-mono">{pipeline.schedule_cron || 'Manual'}</span>
                                                </div>
                                                
                                                {lastJob ? (
                                                    <div className="flex items-center gap-2">
                                                        {lastJob.status === 'success' || lastJob.status === 'completed' ? (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4 text-rose-500" />
                                                        )}
                                                        <span className="text-muted-foreground">
                                                            {formatDistanceToNow(new Date(lastJob.started_at!), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic opacity-70">No runs yet</span>
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
                    <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-border/50">
                        <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/5 bg-white/5 text-xs font-bold text-muted-foreground uppercase tracking-widest shrink-0 sticky top-0 backdrop-blur-xl z-10">
                            <div className="col-span-12 md:col-span-5">Pipeline</div>
                            <div className="col-span-2 hidden md:block">Status</div>
                            <div className="col-span-3 hidden md:block">Last Activity</div>
                            <div className="col-span-2 hidden md:block text-right">Actions</div>
                        </div>

                        {enrichedPipelines.length === 0 ? <EmptyState /> : (
                            <div className="divide-y divide-white/5">
                                {enrichedPipelines.map((pipeline) => {
                                    const lastJob = pipeline.lastJob;
                                    const isSuccess = lastJob?.status === 'completed' || lastJob?.status === 'success';
                                    const isFailed = lastJob?.status === 'failed' || lastJob?.status === 'error';

                                    return (
                                        <div 
                                            key={pipeline.id}
                                            className="group grid grid-cols-12 gap-4 items-center px-8 py-5 hover:bg-white/5 transition-all duration-200"
                                        >
                                            {/* Column 1 */}
                                            <div className="col-span-12 md:col-span-5 flex items-center gap-4">
                                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-colors">
                                                    <GitBranch className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <Link 
                                                        to={`/pipelines/${pipeline.id}`} 
                                                        className="block font-bold text-sm text-foreground hover:text-primary truncate mb-1"
                                                    >
                                                        {pipeline.name}
                                                    </Link>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[240px]">
                                                        {pipeline.description || "No description"}
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
                                                    <div className="flex flex-col gap-1">
                                                        <div className={cn(
                                                            "flex items-center gap-2 text-xs font-bold",
                                                            isSuccess ? "text-emerald-500" :
                                                            isFailed ? "text-rose-500" : "text-blue-500"
                                                        )}>
                                                            {isSuccess ? <CheckCircle2 className="h-3.5 w-3.5"/> : 
                                                             isFailed ? <XCircle className="h-3.5 w-3.5"/> : <Activity className="h-3.5 w-3.5 animate-pulse"/>}
                                                            <span className="capitalize">{lastJob.status}</span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground tabular-nums font-mono opacity-80">
                                                            {formatDistanceToNow(new Date(lastJob.started_at!), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic pl-1 opacity-50">Never ran</span>
                                                )}
                                            </div>

                                            {/* Column 4 */}
                                            <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2 mt-2 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 text-xs hidden lg:flex rounded-full bg-white/5 hover:bg-primary/20 hover:text-primary text-muted-foreground" 
                                                    onClick={() => runMutation.mutate(pipeline.id)}
                                                    disabled={runMutation.isPending}
                                                >
                                                    {runMutation.isPending ? "..." : "Run"}
                                                </Button>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl">
                                                        <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                                                            <Settings className="mr-2 h-4 w-4" /> Configure
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}?tab=runs`)}>
                                                            <History className="mr-2 h-4 w-4" /> Run History
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/10" />
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
    <div className="space-y-8 p-4 animate-pulse">
        <div className="flex justify-between items-center mb-10">
            <div className="space-y-3">
                <Skeleton className="h-10 w-64 rounded-xl bg-white/5" />
                <Skeleton className="h-5 w-96 rounded-xl bg-white/5" />
            </div>
            <Skeleton className="h-12 w-40 rounded-full bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-3xl bg-white/5" />
            ))}
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 py-20">
        <div className="h-32 w-32 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-white/5 rotate-12">
            <Workflow className="h-16 w-16 opacity-20 -rotate-12" />
        </div>
        <p className="text-2xl font-bold text-foreground">No pipelines found</p>
        <p className="text-base max-w-sm text-center mt-3 leading-relaxed text-muted-foreground">
            Create your first workflow to get started with data processing.
        </p>
    </div>
);
