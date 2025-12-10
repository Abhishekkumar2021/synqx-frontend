import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPipelines, getJobs, type Pipeline } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
    Plus, Workflow, MoreVertical, Settings, GitBranch, 
    Activity, Search, Clock, 
    CheckCircle2, XCircle, AlertTriangle, PauseCircle,
    History} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { PipelineSettingsDialog } from '@/components/PipelineSettingsDialog';
import { cn } from '@/lib/utils';

// --- 1. Semantic Status Badge ---
const PipelineStatusBadge = ({ status }: { status: string }) => {
    const s = (status || '').toLowerCase();
    
    const config = useMemo(() => {
        if (s === 'active') return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Activity };
        if (s === 'paused') return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: PauseCircle };
        if (['error', 'broken', 'failed'].includes(s)) return { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertTriangle };
        return { color: "text-muted-foreground", bg: "bg-muted", border: "border-border", icon: Workflow };
    }, [s]);

    const Icon = config.icon;

    return (
        <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide", config.bg, config.color, config.border)}>
            <Icon className="w-3 h-3 mr-1.5" />
            {status}
        </span>
    );
};

// --- 2. Main Component ---
export const PipelinesListPage: React.FC = () => {
    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
    const [filter, setFilter] = useState('');

    const { data: pipelines, isLoading } = useQuery({ queryKey: ['pipelines'], queryFn: getPipelines });
    const { data: recentJobs } = useQuery({ 
        queryKey: ['jobs', 'recent'], 
        queryFn: () => getJobs(), 
        refetchInterval: 10000 
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
        // Height Calc: 100vh - (Header ~64px + Padding ~48px + Margins) = ~9rem deduction
        <div className="flex flex-col h-[calc(100vh-9rem)] gap-4 animate-in fade-in duration-500">
            
            {/* Page Header */}
            <div className="flex items-center justify-between shrink-0 px-1">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Workflow className="h-6 w-6 text-primary" />
                        Pipelines
                    </h2>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                        Manage your data extraction and transformation workflows.
                    </p>
                </div>
                <Link to="/pipelines/new">
                     <Button className="shadow-md shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> New Pipeline
                    </Button>
                </Link>
            </div>

            {/* Main Content Card - Forces internal scrolling */}
            <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
                
                {/* Toolbar */}
                <div className="p-3 border-b bg-muted/30 flex items-center justify-between shrink-0 gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search workflows..." 
                            className="pl-8 h-9 text-sm bg-background border-muted-foreground/20"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                        Total: {enrichedPipelines.length}
                    </div>
                </div>

                {/* Column Headers (Grid Layout for alignment) */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b bg-muted/10 text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
                    <div className="col-span-12 md:col-span-5">Pipeline Name</div>
                    <div className="col-span-2 hidden md:block">Status</div>
                    <div className="col-span-3 hidden md:block">Last Execution</div>
                    <div className="col-span-2 hidden md:block text-right">Actions</div>
                </div>

                {/* Scrollable List Container */}
                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-border">
                    {enrichedPipelines.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="divide-y divide-border">
                            {enrichedPipelines.map((pipeline) => {
                                const lastJobStatus = (pipeline.lastJob?.status as string || '').toLowerCase();
                                const isSuccess = lastJobStatus === 'completed' || lastJobStatus === 'success';
                                const isFailed = lastJobStatus === 'failed' || lastJobStatus === 'error';

                                return (
                                    <div 
                                        key={pipeline.id}
                                        className="group grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-muted/30 transition-colors"
                                    >
                                        {/* Column 1: Info (5 cols) */}
                                        <div className="col-span-12 md:col-span-5 flex items-start gap-3">
                                            <div className="mt-1 p-2 rounded-lg bg-primary/5 text-primary">
                                                <GitBranch className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <Link 
                                                    to={`/pipelines/${pipeline.id}`} 
                                                    className="block font-semibold text-sm hover:text-primary truncate"
                                                >
                                                    {pipeline.name}
                                                </Link>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                    <span className="truncate max-w-[200px]" title={pipeline.description}>
                                                        {pipeline.description || "No description"}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                    <div className="flex items-center gap-1 font-mono text-[10px]">
                                                        <Clock className="h-3 w-3" />
                                                        {pipeline.schedule_cron || 'Manual'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Column 2: Status (2 cols) */}
                                        <div className="col-span-6 md:col-span-2 flex items-center mt-2 md:mt-0">
                                            <PipelineStatusBadge status={pipeline.status} />
                                        </div>

                                        {/* Column 3: Last Run (3 cols) */}
                                        <div className="col-span-6 md:col-span-3 flex items-center mt-2 md:mt-0">
                                            {pipeline.lastJob ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 text-xs font-medium",
                                                        isSuccess ? "text-emerald-600 dark:text-emerald-400" :
                                                        isFailed ? "text-rose-600 dark:text-rose-400" : "text-blue-600 dark:text-blue-400"
                                                    )}>
                                                        {isSuccess ? <CheckCircle2 className="h-3.5 w-3.5"/> : 
                                                         isFailed ? <XCircle className="h-3.5 w-3.5"/> : <Activity className="h-3.5 w-3.5 animate-pulse"/>}
                                                        <span className="capitalize">{lastJobStatus}</span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground tabular-nums">
                                                        {formatDistanceToNow(new Date(pipeline.lastJob.started_at!), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic pl-1">Never ran</span>
                                            )}
                                        </div>

                                        {/* Column 4: Actions (2 cols) */}
                                        <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2 mt-2 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="outline" size="sm" className="h-8 text-xs hidden lg:flex" onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                                                Open
                                            </Button>
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Manage</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                                                        <Settings className="mr-2 h-4 w-4" /> Configure
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}?tab=runs`)}>
                                                        <History className="mr-2 h-4 w-4" /> Run History
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openSettings(pipeline)}>
                                                        <Workflow className="mr-2 h-4 w-4" /> Properties
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
    <div className="space-y-4 p-1">
        <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
            <div className="h-12 border-b bg-muted/20" />
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 border-b p-4 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
            ))}
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 py-12">
        <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mb-4">
            <Workflow className="h-10 w-10 opacity-30" />
        </div>
        <p className="text-lg font-medium text-foreground">No pipelines found</p>
        <p className="text-sm max-w-sm text-center mt-1">
            Create your first workflow to get started with data processing.
        </p>
    </div>
);