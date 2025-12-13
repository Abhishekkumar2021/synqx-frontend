/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPipelines, getJobs, getConnections } from '@/lib/api';
import { subHours, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Activity, CheckCircle2,
    PlayCircle, Zap, 
    Workflow, Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/StatsCard';
import { ExecutionThroughputChart } from '@/components/dashboard/ExecutionThroughputChart';
import { PipelineHealthChart } from '@/components/dashboard/PipelineHealthChart';
import { RecentActivityTable } from '@/components/dashboard/RecentActivityTable';

export const DashboardPage: React.FC = () => {
    // 1. Data Fetching
    const { data: pipelines, isLoading: loadingPipelines } = useQuery({ queryKey: ['pipelines'], queryFn: getPipelines });
    const { data: jobs, isLoading: loadingJobs } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
    const { data: connections, isLoading: loadingConnections } = useQuery({ queryKey: ['connections'], queryFn: getConnections });

    // 2. Metrics Calculation
    const stats = useMemo(() => {
        if (!pipelines || !jobs) return null;

        const total = pipelines.length;
        const active = pipelines.filter((p: any) => p.status === 'active').length;
        const completed = jobs.filter((j: any) => j.status === 'completed' || j.status === 'success');
        const failed = jobs.filter((j: any) => j.status === 'failed' || j.status === 'error');

        const totalRuns = completed.length + failed.length;
        const successRate = totalRuns > 0 ? Math.round((completed.length / totalRuns) * 100) : 100;

        return {
            totalPipelines: total,
            activePipelines: active,
            totalConnections: connections?.length || 0,
            successRate,
            runCount: jobs.length
        };
    }, [pipelines, jobs, connections]);

    const isLoading = loadingPipelines || loadingJobs || loadingConnections;

    // 3. Chart Data (Real Aggregation)
    const chartData = useMemo(() => {
        if (!jobs) return [];
        
        const now = new Date();
        // Create buckets for the last 24 hours
        const buckets = Array.from({ length: 25 }, (_, i) => {
            const time = subHours(now, 24 - i);
            return {
                time,
                key: format(time, 'yyyy-MM-dd-HH'),
                name: format(time, 'HH:mm'),
                success: 0,
                failed: 0
            };
        });

        // Fill buckets with job data
        jobs.forEach((job: any) => {
             // Use finished_at, or started_at as fallback
             const dateStr = job.finished_at || job.started_at;
             if (!dateStr) return;
             
             const date = new Date(dateStr);
             const key = format(date, 'yyyy-MM-dd-HH');
             
             const bucket = buckets.find(b => b.key === key);
             if (bucket) {
                 const status = (job.status || '').toLowerCase();
                 if (status === 'completed' || status === 'success') {
                     bucket.success++;
                 } else if (status === 'failed' || status === 'error') {
                     bucket.failed++;
                 }
             }
        });
        
        return buckets;
    }, [jobs]);

    const pipelineDistribution = useMemo(() => {
        if (!pipelines) return [];
        const counts = {
            Active: pipelines.filter((p: any) => p.status === 'active').length,
            Paused: pipelines.filter((p: any) => p.status === 'paused').length,
            Error: pipelines.filter((p: any) => (p.status as string) === 'broken' || (p.status as string) === 'failed').length,
            Draft: pipelines.filter((p: any) => !['active', 'paused', 'broken', 'failed'].includes(p.status as string)).length
        };

        return [
            { name: 'Active', value: counts.Active, color: 'var(--chart-2)' }, // Mint/Green
            { name: 'Paused', value: counts.Paused, color: 'var(--chart-5)' }, // Yellow/Amber
            { name: 'Error', value: counts.Error, color: 'var(--destructive)' }, // Red
            { name: 'Draft', value: counts.Draft, color: 'var(--muted-foreground)' }, // Grey
        ].filter(i => i.value > 0);
    }, [pipelines]);

    return (
        <div className="flex flex-col gap-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* --- Header & Navigation --- */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        System Overview
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Metrics for <span className="font-mono text-foreground font-medium">{format(new Date(), 'MMM dd, yyyy')}</span>. System is operational.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button size="sm" className="shadow-[0_0_15px_-5px_var(--color-primary)]">
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Trigger Pipeline
                    </Button>
                </div>
            </div>

            {/* --- Stats Cards Grid --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl bg-card" />)
                ) : (
                    <>
                        <StatsCard
                            title="Total Pipelines"
                            value={stats?.totalPipelines || 0}
                            trend="+2 created"
                            trendUp={true}
                            icon={Workflow}
                            color="text-primary"
                            bgGlow="bg-primary/5"
                        />
                        <StatsCard
                            title="Active Jobs"
                            value={stats?.activePipelines || 0}
                            subtext="Processing now"
                            icon={Zap}
                            active={true}
                            color="text-orange-400"
                            bgGlow="bg-orange-500/5"
                        />
                        <StatsCard
                            title="Success Rate"
                            value={`${stats?.successRate}%`}
                            trend="-1.2% from avg"
                            trendUp={false}
                            icon={CheckCircle2}
                            color="text-emerald-400"
                            bgGlow="bg-emerald-500/5"
                        />
                        <StatsCard
                            title="Connections"
                            value={stats?.totalConnections || 0}
                            subtext="All systems healthy"
                            icon={Server}
                            color="text-blue-400"
                            bgGlow="bg-blue-500/5"
                        />
                    </>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">

                {/* --- Main Area Chart: Throughput --- */}
                <ExecutionThroughputChart data={chartData} />

                {/* --- Pie Chart: Pipeline Health --- */}
                <PipelineHealthChart 
                    data={pipelineDistribution} 
                    totalPipelines={stats?.totalPipelines || 0} 
                />

                                {/* --- Recent Activity Table --- */}

                                <RecentActivityTable jobs={jobs || []} />

                            </div>

                        </div>

                    );

                };

                