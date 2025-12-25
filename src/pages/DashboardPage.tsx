import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Activity, CheckCircle2,
    PlayCircle, Zap,
    Workflow, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExecutionThroughputChart } from '@/components/features/dashboard/ExecutionThroughputChart';
import { PipelineHealthChart } from '@/components/features/dashboard/PipelineHealthChart';
import { RecentActivityTable } from '@/components/features/dashboard/RecentActivityTable';
import { RunPipelineDialog } from '@/components/features/dashboard/RunPipelineDialog';
import { PageMeta } from '@/components/common/PageMeta';
import { StatsCard } from '@/components/ui/StatsCard';
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry';
import { useZenMode } from '@/context/ZenContext';
import { cn, formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export const DashboardPage: React.FC = () => {
    // Enable real-time dashboard updates via WebSockets
    useDashboardTelemetry();
    const { isZenMode } = useZenMode();

    const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);

    // 1. Single API Call
    const { data: stats, isLoading } = useQuery({ 
        queryKey: ['dashboard'], 
        queryFn: getDashboardStats,
    });

    // 2. Chart Data Transformation
    const throughputData = React.useMemo(() => {
        if (!stats?.throughput) return [];
        return stats.throughput.map(p => ({
            name: format(parseISO(p.timestamp), 'HH:mm'),
            success: p.success_count,
            failed: p.failure_count,
            rows: p.rows_processed,
            bytes: p.bytes_processed
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
        <motion.div 
            className={cn(
                "flex flex-col gap-8 pb-10",
                isZenMode && "pt-2"
            )}
        >
            <PageMeta title="Dashboard" description="System overview and health metrics." />

            {/* --- Header & Navigation --- */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-1">
                <div className="space-y-1.5">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 backdrop-blur-md shadow-sm">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                        Control Center
                    </h2>
                    <p className="text-base text-muted-foreground font-medium pl-1">
                        Real-time intelligence for your data mesh.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button 
                        size="lg" 
                        className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95"
                        onClick={() => setIsRunDialogOpen(true)}
                    >
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Trigger Pipeline
                    </Button>
                </div>
            </div>

            {/* --- Stats Cards Grid --- */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[140px] w-full rounded-[2.5rem]" />)
                ) : (
                    <>
                        <StatsCard
                            title="Operational Success"
                            value={`${stats?.success_rate_24h}%`}
                            trend="High Performance"
                            trendUp={!!(stats?.success_rate_24h && stats.success_rate_24h > 95)}
                            icon={CheckCircle2}
                            active={true}
                        />
                        <StatsCard
                            title="Rows Synced (24h)"
                            value={formatNumber(stats?.total_rows_24h)}
                            subtext="Records processed"
                            icon={Database}
                        />
                        <StatsCard
                            title="Data Volume"
                            value={formatBytes(stats?.total_bytes_24h || 0)}
                            trend="Total Throughput"
                            trendUp={true}
                            icon={Zap}
                        />
                        <StatsCard
                            title="Active Entities"
                            value={stats?.active_pipelines || 0}
                            subtext={`From ${stats?.total_pipelines} total pipelines`}
                            icon={Workflow}
                        />
                    </>
                )}
            </div>

            {/* --- Charts Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* --- Main Area Chart: Throughput --- */}
                <div className="lg:col-span-4 min-h-[450px]">
                    <ExecutionThroughputChart data={throughputData} />
                </div>

                {/* --- Pie Chart: Pipeline Health --- */}
                <div className="lg:col-span-3 min-h-[450px]">
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

            <RunPipelineDialog open={isRunDialogOpen} onOpenChange={setIsRunDialogOpen} />
        </motion.div>
    );
};
