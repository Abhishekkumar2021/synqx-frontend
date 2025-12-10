import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPipelines, getJobs, type Pipeline } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { 
    Plus, 
    Workflow, 
    MoreVertical,
    Settings,
    GitBranch,
    Calendar,
    Activity
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
import { format, formatDistanceToNow } from 'date-fns';
import { PipelineSettingsDialog } from '../../components/PipelineSettingsDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Card, CardContent } from '../../components/ui/card';

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
        // Find the latest job for the pipeline, assuming jobs are sorted by date or filter for the most recent
        const pipelineJobs = recentJobs.filter(j => j.pipeline_id === pipelineId);
        if (pipelineJobs.length === 0) return null;
        // Sort by started_at descending to get the latest
        return pipelineJobs.sort((a, b) => new Date(b.started_at!).getTime() - new Date(a.started_at!).getTime())[0];
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
                <Card className="bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
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

            <Card className="bg-card/50 backdrop-blur-sm shadow-xl border-border/50">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Latest Run</TableHead>
                                <TableHead>Last Modified</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pipelines.map((pipeline: Pipeline) => {
                                const latestJob = getLatestJob(pipeline.id);
                                const hasSchedule = pipeline.schedule_cron && pipeline.schedule_cron.length > 0;

                                return (
                                    <TableRow key={pipeline.id}>
                                        <TableCell className="font-medium">
                                            <Link to={`/pipelines/${pipeline.id}`} className="hover:text-primary transition-colors">
                                                {pipeline.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{pipeline.description}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    pipeline.status === 'active' ? 'default' : 
                                                    pipeline.status === 'paused' ? 'secondary' : 
                                                    'destructive'
                                                } className="capitalize">
                                                    {pipeline.status}
                                                </Badge>
                                                {hasSchedule && (
                                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {pipeline.schedule_cron}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {latestJob ? (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={
                                                        latestJob.status === 'completed' ? 'default' :
                                                        latestJob.status === 'failed' ? 'destructive' :
                                                        'secondary'
                                                    } className="capitalize">
                                                        {latestJob.status}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {latestJob.started_at ? formatDistanceToNow(new Date(latestJob.started_at), { addSuffix: true }) : 'N/A'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No runs yet</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {pipeline.updated_at ? format(new Date(pipeline.updated_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}`)}>
                                                        <GitBranch className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => navigate(`/pipelines/${pipeline.id}?tab=runs`)}>
                                                        <Activity className="mr-2 h-4 w-4" /> View Runs
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openSettings(pipeline)}>
                                                        <Settings className="mr-2 h-4 w-4" /> Settings
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <PipelineSettingsDialog 
                pipeline={selectedPipeline} 
                open={settingsOpen} 
                onOpenChange={setSettingsOpen} 
            />
        </div>
    );
};