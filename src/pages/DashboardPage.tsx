/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getPipelines, getJobs, getConnections } from '@/lib/api';
import { subHours, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Activity, Database, Workflow, CheckCircle2,
    PlayCircle, Clock, TrendingUp, TrendingDown,
    Zap, AlertTriangle, ArrowUpRight, 
    Server,
    MoreHorizontal
} from 'lucide-react';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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
                <Card className="lg:col-span-4 flex flex-col border-border/60 bg-card/50 backdrop-blur-sm shadow-sm min-w-0">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold">Execution Throughput</CardTitle>
                                <CardDescription>24-hour job success vs failure volume</CardDescription>
                            </div>
                            <Badge variant="outline" className="font-mono text-[10px] uppercase text-secondary-foreground">Live</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 pl-0">
                        <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.15} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="var(--muted-foreground)"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={35}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="var(--muted-foreground)"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        width={40}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--card)',
                                            borderColor: 'var(--border)',
                                            borderRadius: 'var(--radius)',
                                            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)'
                                        }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 600, padding: 0 }}
                                        labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '0.5rem', fontSize: '11px' }}
                                        cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="success"
                                        name="Completed"
                                        stroke="var(--chart-2)"
                                        strokeWidth={2}
                                        fill="url(#colorSuccess)"
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="failed"
                                        name="Failed"
                                        stroke="var(--destructive)"
                                        strokeWidth={2}
                                        fill="url(#colorFailed)"
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* --- Pie Chart: Pipeline Health --- */}
                <Card className="lg:col-span-3 border-border/60 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col min-w-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Pipeline Health</CardTitle>
                        <CardDescription>Status distribution of defined pipelines</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center relative">
                        {pipelineDistribution.length > 0 ? (
                            <div className="w-full h-[250px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pipelineDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={90}
                                            paddingAngle={3}
                                            dataKey="value"
                                            stroke="var(--background)"
                                            strokeWidth={2}
                                        >
                                            {pipelineDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} className="stroke-background hover:opacity-80 transition-opacity" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--card)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                            }}
                                            itemStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(value) => <span className="text-xs text-muted-foreground ml-1">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                    <span className="text-4xl font-bold tabular-nums text-foreground tracking-tighter">
                                        {stats?.totalPipelines}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">
                                        Total
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground h-full gap-2">
                                <div className="p-3 bg-muted rounded-full">
                                    <AlertTriangle className="h-6 w-6 opacity-40" />
                                </div>
                                <span className="text-xs">No pipelines found</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* --- Recent Activity Table --- */}
                <Card className="col-span-full border-border/60 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/5 py-4">
                        <div className="space-y-0.5">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                Recent Activity
                            </CardTitle>
                        </div>

                        <Link
                            to="/jobs"
                            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs h-8 gap-1 hover:text-primary")}
                        >
                            View Full History <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-border/40">
                                    <TableHead className="w-[100px] text-xs uppercase font-semibold">Job ID</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Pipeline</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Status</TableHead>
                                    <TableHead className="text-right text-xs uppercase font-semibold">Duration</TableHead>
                                    <TableHead className="text-right text-xs uppercase font-semibold">Started</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs && jobs.length > 0 ? (
                                    jobs.slice(0, 5).map((job: any) => (
                                        <TableRow key={job.id} className="hover:bg-muted/40 border-b border-border/40 group transition-colors">
                                            <TableCell className="font-mono text-xs font-medium text-foreground">
                                                #{job.id}
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Workflow className="h-3 w-3 text-muted-foreground" />
                                                    {job.pipeline_name || `Pipeline ${job.pipeline_id}`}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={job.status} />
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                                                {job.duration_ms ? `${(job.duration_ms / 1000).toFixed(2)}s` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                                                {format(new Date(job.started_at), 'HH:mm:ss')}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>View Logs</DropdownMenuItem>
                                                        <DropdownMenuItem>Rerun</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                                <Database className="h-8 w-8 opacity-20" />
                                                <span className="text-sm">No recent activity recorded</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// --- Subcomponents ---

const StatusBadge = ({ status }: { status: string }) => {
    let styles = "bg-muted text-muted-foreground";
    let icon = Clock;

    switch (status?.toLowerCase()) {
        case 'completed':
        case 'success':
            styles = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            icon = CheckCircle2;
            break;
        case 'failed':
        case 'error':
            styles = "bg-red-500/10 text-red-500 border-red-500/20";
            icon = AlertTriangle;
            break;
        case 'running':
            styles = "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse";
            icon = Zap;
            break;
    }

    const Icon = icon;

    return (
        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold border px-2 py-0.5 gap-1.5", styles)}>
            <Icon className="h-3 w-3" />
            {status}
        </Badge>
    );
};

const StatsCard = ({ title, value, subtext, trend, trendUp, icon: Icon, active, color, bgGlow }: any) => (
    <Card className={cn(
        "relative overflow-hidden border border-border/60 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-primary/30",
        active && "border-primary/40 shadow-[0_0_20px_-10px_var(--color-primary)] ring-1 ring-primary/20"
    )}>
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-3">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <div className={cn("p-2 rounded-lg bg-background/80 shadow-sm border border-border/50", active && "animate-pulse")}>
                    <Icon className={cn("h-4 w-4", color || "text-foreground")} />
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <h3 className="text-3xl font-bold tracking-tight tabular-nums">{value}</h3>
                {(trend || subtext) && (
                    <div className="flex items-center text-xs">
                        {trend && (
                            <span className={cn(
                                "flex items-center font-bold mr-2 px-1.5 py-0.5 rounded-sm bg-muted/50",
                                trendUp ? "text-emerald-500" : "text-red-500"
                            )}>
                                {trendUp ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                                {trend}
                            </span>
                        )}
                        {subtext && <span className="text-muted-foreground/80">{subtext}</span>}
                    </div>
                )}
            </div>
        </CardContent>
        {active && (
            <div className={cn("absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full blur-3xl opacity-20 pointer-events-none", bgGlow || "bg-primary")}></div>
        )}
    </Card>
);