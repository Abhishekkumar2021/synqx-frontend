import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPipelines, getJobs, triggerPipeline, type Pipeline } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Plus, Workflow, Activity, Search, 
    LayoutGrid, List as ListIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PipelineSettingsDialog } from '@/components/features/pipelines/PipelineSettingsDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PipelineGridItem } from '@/components/features/pipelines/PipelineGridItem';
import { PipelineListItem } from '@/components/features/pipelines/PipelineListItem';
import { LoadingSkeleton, EmptyState } from '@/components/features/pipelines/PipelineStates';
import { PageMeta } from '@/components/common/PageMeta';

export const PipelinesListPage: React.FC = () => {
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
            <PageMeta title="Pipelines" description="Orchestrate and monitor your data workflows." />
            
            {/* --- Header --- */}
            <div className="flex items-center justify-between shrink-0 px-1">
                <div className="space-y-2">
                    <h2 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-foreground to-foreground/50 flex items-center gap-3">
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
            <div className="flex-1 min-h-0 flex flex-col glass-panel relative">
                
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
                                {enrichedPipelines.map((pipeline) => (
                                    <PipelineGridItem 
                                        key={pipeline.id}
                                        pipeline={pipeline}
                                        onRun={(id) => runMutation.mutate(id)}
                                        onOpenSettings={openSettings}
                                    />
                                ))}
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
                                {enrichedPipelines.map((pipeline) => (
                                    <PipelineListItem 
                                        key={pipeline.id}
                                        pipeline={pipeline}
                                        onRun={(id) => runMutation.mutate(id)}
                                        isRunningMutation={runMutation.isPending}
                                    />
                                ))}
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