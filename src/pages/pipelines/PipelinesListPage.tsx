import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPipelines, getJobs, type Pipeline } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { 
    Plus, 
    Workflow, 
    Activity, 
    Play, 
    MoreVertical,
    History,
    Settings,
    GitBranch,
    Calendar
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { PipelineSettingsDialog } from '../../components/PipelineSettingsDialog';

export const PipelinesListPage: React.FC = () => {
    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [selectedPipeline, setSelectedPipeline] = React.useState<Pipeline | null>(null);

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

    const getLatestJob = (pipelineId: number) => {
        if (!recentJobs) return null;
        return recentJobs.find(j => j.pipeline_id === pipelineId); 
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-[220px] rounded-xl border border-muted bg-card/50">
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-32" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                                <Skeleton className="h-10 w-full" />
                                <div className="space-y-2 pt-4">
                                    <Skeleton className="h-16 w-full rounded-lg" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-9 flex-1" />
                                        <Skeleton className="h-9 flex-1" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!pipelines || pipelines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] border border-dashed rounded-lg bg-muted/5">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Workflow className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">No pipelines found</h3>
                <p className="text-muted-foreground mb-6 max-w-sm text-center">
                    Get started by creating your first ETL workflow. Define sources, transformations, and destinations.
                </p>
                <Link to="/pipelines/new">
                    <Button size="lg" className="gap-2">
                        <Plus className="h-4 w-4" /> Create Pipeline
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Pipelines</h2>
                    <p className="text-muted-foreground mt-1">Manage, monitor, and orchestrate your data workflows.</p>
                </div>
                <Link to="/pipelines/new">
                     <Button className="shadow-lg hover:shadow-primary/25 transition-all">
                        <Plus className="mr-2 h-4 w-4" /> New Pipeline
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pipelines.map((pipeline: Pipeline) => {
                    const latestJob = getLatestJob(pipeline.id);
                    const statusColor = pipeline.status === 'active' ? 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20' : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
                    const hasSchedule = pipeline.schedule_interval && pipeline.schedule_interval.length > 0;

                    return (
                        <Card 
                            key={pipeline.id} 
                            className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-muted/60 bg-card/50 backdrop-blur-sm"
                        >
                             <div className={`absolute top-0 left-0 w-full h-1 ${pipeline.status === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-yellow-500 to-orange-500'} opacity-0 group-hover:opacity-100 transition-opacity`} />

                             <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Link to={`/pipelines/${pipeline.id}`} className="hover:text-primary transition-colors">
                                                {pipeline.name}
                                            </Link>
                                        </CardTitle>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider ${statusColor}`}>
                                                {pipeline.status}
                                            </span>
                                            {hasSchedule && (
                                                <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full border border-border">
                                                    <Calendar className="h-3 w-3" />
                                                    {pipeline.schedule_interval}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground hover:text-foreground">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                                                <GitBranch className="mr-2 h-4 w-4" /> Edit Pipeline
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}?tab=runs`)}>
                                                <History className="mr-2 h-4 w-4" /> View History
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => openSettings(pipeline)}>
                                                <Settings className="mr-2 h-4 w-4" /> Settings
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardDescription className="line-clamp-2 mt-2 min-h-[40px]">
                                    {pipeline.description || "No description provided."}
                                </CardDescription>
                             </CardHeader>

                             <CardContent>
                                <div className="space-y-4">
                                    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                <Activity className="h-3 w-3" /> Latest Run
                                            </span>
                                            {latestJob && (
                                                <Badge variant={latestJob.status === 'completed' || (latestJob.status as string) === 'success' ? 'default' : latestJob.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px] h-5 px-1.5">
                                                    {latestJob.status}
                                                </Badge>
                                            )}
                                        </div>
                                        {latestJob ? (
                                            <div className="text-xs space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Duration</span>
                                                    <span className="font-mono">{(latestJob as any).execution_time_ms ? `${((latestJob as any).execution_time_ms / 1000).toFixed(1)}s` : 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Triggered</span>
                                                    <span>{latestJob.started_at ? formatDistanceToNow(new Date(latestJob.started_at), { addSuffix: true }) : 'Just now'}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground text-center py-2 italic">
                                                No runs yet
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" className="w-full text-xs h-9" onClick={() => navigate(`/pipelines/${pipeline.id}?tab=runs`)}>
                                            <History className="mr-2 h-3 w-3" /> History
                                        </Button>
                                        <Button className="w-full text-xs h-9 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 border shadow-none" onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                                            <Play className="mr-2 h-3 w-3" /> Open
                                        </Button>
                                    </div>
                                </div>
                             </CardContent>
                        </Card>
                    );
                })}
            </div>
            
            <PipelineSettingsDialog 
                pipeline={selectedPipeline} 
                open={settingsOpen} 
                onOpenChange={setSettingsOpen} 
            />
        </div>
    );
};