/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPipelines, getJobs, getConnections } from '@/lib/api';
import { subHours, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Activity, CheckCircle2,
    PlayCircle, Zap, 
    Workflow, Server} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/StatsCard';
import { ExecutionThroughputChart } from '@/components/features/dashboard/ExecutionThroughputChart';
import { PipelineHealthChart } from '@/components/features/dashboard/PipelineHealthChart';
import { RecentActivityTable } from '@/components/features/dashboard/RecentActivityTable';
import { PageMeta } from '@/components/common/PageMeta';

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

        jobs.forEach((job: any) => {
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
            { name: 'Active', value: counts.Active, color: 'var(--chart-2)' },
            { name: 'Paused', value: counts.Paused, color: 'var(--chart-5)' },
            { name: 'Error', value: counts.Error, color: 'var(--destructive)' },
            { name: 'Draft', value: counts.Draft, color: 'var(--muted-foreground)' },
        ].filter(i => i.value > 0);
    }, [pipelines]);

    return (
        <div className="flex flex-col gap-8 pb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <PageMeta title="Dashboard" description="System overview and health metrics." />

            {/* --- Header & Navigation --- */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-1">
                <div className="space-y-2">
                    <h2 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-foreground to-foreground/50 flex items-center gap-3">
                        <Activity className="h-8 w-8 text-primary animate-pulse-slow" />
                        System Overview
                    </h2>
                    <p className="text-base text-muted-foreground/80 font-medium pl-1">
                        System status for <span className="text-foreground">{format(new Date(), 'MMMM dd, yyyy')}</span>. All systems operational.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105">
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Run Pipeline
                    </Button>
                </div>
            </div>

            {/* --- Stats Cards Grid --- */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-[2rem] bg-white/5" />)
                ) : (
                    <>
                        <StatsCard
                            title="Total Pipelines"
                            value={stats?.totalPipelines || 0}
                            trend="+2 created"
                            trendUp={true}
                            icon={Workflow}
                            color="text-primary"
                            bgGlow="bg-primary/10"
                        />
                        <StatsCard
                            title="Active Jobs"
                            value={stats?.activePipelines || 0}
                            subtext="Processing now"
                            icon={Zap}
                            active={true}
                            color="text-orange-400"
                            bgGlow="bg-orange-500/10"
                        />
                        <StatsCard
                            title="Success Rate"
                            value={`${stats?.successRate}%`}
                            trend="-1.2% from avg"
                            trendUp={false}
                            icon={CheckCircle2}
                            color="text-emerald-400"
                            bgGlow="bg-emerald-500/10"
                        />
                        <StatsCard
                            title="Connections"
                            value={stats?.totalConnections || 0}
                            subtext="All systems healthy"
                            icon={Server}
                            color="text-blue-400"
                            bgGlow="bg-blue-500/10"
                        />
                    </>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
                {/* --- Main Area Chart: Throughput --- */}
                <div className="lg:col-span-4 h-full">
                     <ExecutionThroughputChart data={chartData} />
                </div>

                {/* --- Pie Chart: Pipeline Health --- */}
                <div className="lg:col-span-3 h-full">
                    <PipelineHealthChart 
                        data={pipelineDistribution} 
                        totalPipelines={stats?.totalPipelines || 0} 
                    />
                </div>
            </div>
            
            {/* --- Recent Activity Table --- */}
            <div className="mt-2">
                <RecentActivityTable jobs={jobs || []} />
            </div>

        </div>
    );
};
