/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Activity, CheckCircle2,
    PlayCircle, Zap,
    Workflow, Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExecutionThroughputChart } from '@/components/features/dashboard/ExecutionThroughputChart';
import { PipelineHealthChart } from '@/components/features/dashboard/PipelineHealthChart';
import { RecentActivityTable } from '@/components/features/dashboard/RecentActivityTable';
import { PageMeta } from '@/components/common/PageMeta';
import { StatsCard } from '@/components/ui/StatsCard';

export const DashboardPage: React.FC = () => {
    // 1. Single API Call
    const { data: stats, isLoading } = useQuery({ 
        queryKey: ['dashboard'], 
        queryFn: getDashboardStats,
        refetchInterval: 30000 // Refresh every 30s
    });

    // 2. Chart Data Transformation
    const throughputData = React.useMemo(() => {
        if (!stats?.throughput) return [];
        return stats.throughput.map(p => ({
            name: format(parseISO(p.timestamp), 'HH:mm'),
            success: p.success_count,
            failed: p.failure_count
        }));
    }, [stats]);

    const distributionData = React.useMemo(() => {
        if (!stats?.pipeline_distribution) return [];
        return stats.pipeline_distribution.map(d => ({
            name: d.status.charAt(0).toUpperCase() + d.status.slice(1),
            value: d.count,
            fill: d.status === 'active' ? 'hsl(var(--chart-2))' : 
                  d.status === 'paused' ? 'hsl(var(--chart-5))' :
                  d.status === 'broken' || d.status === 'failed' ? 'hsl(var(--destructive))' :
                  'hsl(var(--muted))'
        })).filter(i => i.value > 0);
    }, [stats]);

    // 3. Activity Data Transformation (Matching Table expectations)
    const recentJobs = React.useMemo(() => {
        if (!stats?.recent_activity) return [];
        return stats.recent_activity.map(a => ({
            id: a.id,
            pipeline_name: a.pipeline_name,
            status: a.status,
            started_at: a.started_at,
            finished_at: a.completed_at,
            execution_time_ms: a.duration_seconds ? a.duration_seconds * 1000 : null,
            user_avatar: a.user_avatar
        }));
    }, [stats]);

    return (
        <div className="flex flex-col gap-8 pb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <PageMeta title="Dashboard" description="System overview and health metrics." />

            {/* --- Header & Navigation --- */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-1">
                <div className="space-y-1.5">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 backdrop-blur-md shadow-sm">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                        System Overview
                    </h2>
                    <p className="text-base text-muted-foreground font-medium pl-1">
                        Status for <span className="text-foreground font-semibold">{format(new Date(), 'MMMM dd, yyyy')}</span>. All systems operational.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Run Pipeline
                    </Button>
                </div>
            </div>

            {/* --- Stats Cards Grid --- */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[140px] w-full rounded-[2rem]" />)
                ) : (
                    <>
                        <StatsCard
                            title="Total Pipelines"
                            value={stats?.total_pipelines || 0}
                            trend="System wide"
                            trendUp={true}
                            icon={Workflow}
                        />
                        <StatsCard
                            title="Active Pipelines"
                            value={stats?.active_pipelines || 0}
                            subtext="Running / Scheduled"
                            icon={Zap}
                            active={true}
                        />
                        <StatsCard
                            title="Success Rate (24h)"
                            value={`${stats?.success_rate_24h}%`}
                            trend="Last 24 hours"
                            trendUp={true}
                            icon={CheckCircle2}
                        />
                        <StatsCard
                            title="Total Connections"
                            value={stats?.total_connections || 0}
                            subtext="Data Sources"
                            icon={Server}
                        />
                    </>
                )}
            </div>

            {/* --- Charts Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 lg:h-[500px]">
                {/* --- Main Area Chart: Throughput --- */}
                <div className="lg:col-span-4 min-h-[400px] lg:min-h-0 lg:h-full">
                    <ExecutionThroughputChart data={throughputData} />
                </div>

                {/* --- Pie Chart: Pipeline Health --- */}
                <div className="lg:col-span-3 min-h-[400px] lg:min-h-0 lg:h-full">
                    <PipelineHealthChart
                        data={distributionData}
                        totalPipelines={stats?.total_pipelines || 0}
                    />
                </div>
            </div>

            {/* --- Recent Activity Table --- */}
            <div className="mt-2">
                <RecentActivityTable jobs={recentJobs} />
            </div>

        </div>
    );
};
