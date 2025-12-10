/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPipelines, getJobs, getConnections } from '@/lib/api';
import { subHours, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Activity, Database, Workflow, CheckCircle2, 
    PlayCircle, Clock, TrendingUp, TrendingDown,
    Zap, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { 
    Table, TableBody, TableCell, TableHead, 
    TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button'; // Import buttonVariants
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
    // 1. Data Fetching
    const { data: pipelines, isLoading: loadingPipelines } = useQuery({ queryKey: ['pipelines'], queryFn: getPipelines });
    const { data: jobs, isLoading: loadingJobs } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() }); 
    const { data: connections, isLoading: loadingConnections } = useQuery({ queryKey: ['connections'], queryFn: getConnections });

    // 2. Metrics Calculation
    const stats = useMemo(() => {
        if (!pipelines || !jobs) return null;

        const total = pipelines.length;
        const active = pipelines.filter(p => p.status === 'active').length;
        const completed = jobs.filter(j => j.status === 'completed');
        const failed = jobs.filter(j => j.status === 'failed');
        
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

    // 3. Chart Data (Deterministic)
    const [chartData] = useState(() => {
        const data = [];
        const now = new Date();
        for (let i = 24; i >= 0; i--) {
            const time = subHours(now, i);
            const baseLoad = i > 8 && i < 18 ? 20 : 5; 
            const pseudoRandom = (i * 37) % 10; 
            const pseudoFailure = (i * 13) % 4;
            
            data.push({
                name: format(time, 'HH:mm'),
                success: baseLoad + pseudoRandom,
                failed: pseudoFailure
            })
        }
        return data;
    });

    const pipelineDistribution = useMemo(() => {
        if (!pipelines) return [];
        const counts = {
            Active: pipelines.filter(p => p.status === 'active').length,
            Paused: pipelines.filter(p => p.status === 'paused').length,
            Error: pipelines.filter(p => (p.status as string) === 'broken' || (p.status as string) === 'failed').length,
            Draft: pipelines.filter(p => !['active', 'paused', 'broken', 'failed'].includes(p.status as string)).length
        };

        return [
            { name: 'Active', value: counts.Active, color: 'var(--chart-2)' },
            { name: 'Paused', value: counts.Paused, color: 'var(--chart-4)' },
            { name: 'Error', value: counts.Error, color: 'var(--chart-3)' },
            { name: 'Draft', value: counts.Draft, color: 'var(--muted-foreground)' },
        ].filter(i => i.value > 0);
    }, [pipelines]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-8">
            {/* --- Header --- */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        System Overview
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Real-time metrics for <span className="font-mono text-foreground font-medium">{format(new Date(), 'MMM dd, yyyy')}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm">
                        Last 24 Hours
                     </Button>
                     <Button size="sm" className="shadow-lg shadow-primary/20">
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Run Pipeline
                     </Button>
                </div>
            </div>
            
            {/* --- Stats Grid --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-xl bg-card" />)
                ) : (
                    <>
                        <StatsCard 
                            title="Total Pipelines" 
                            value={stats?.totalPipelines || 0}
                            trend="+2 created"
                            trendUp={true}
                            icon={Workflow}
                            color="text-blue-500"
                        />
                        <StatsCard 
                            title="Active Runs" 
                            value={stats?.activePipelines || 0}
                            subtext="Processing now"
                            icon={Zap}
                            active={true}
                            color="text-amber-500"
                        />
                        <StatsCard 
                            title="Success Rate" 
                            value={`${stats?.successRate}%`}
                            trend="-1% from avg"
                            trendUp={false}
                            icon={CheckCircle2}
                            color="text-emerald-500"
                        />
                        <StatsCard 
                            title="Data Sources" 
                            value={stats?.totalConnections || 0}
                            subtext="Healthy"
                            icon={Database}
                            color="text-purple-500"
                        />
                    </>
                )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                
                {/* --- Main Chart: Throughput --- */}
                {/* Added min-w-0 to prevent Recharts collapse in Grid */}
                <Card className="lg:col-span-4 flex flex-col border-border/50 bg-card/40 backdrop-blur-sm shadow-sm min-w-0">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Execution Throughput</CardTitle>
                        <CardDescription>Job success vs failure rate over time</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pl-0">
                        {/* Wrapper with fixed height to stabilize ResponsiveContainer */}
                        <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.1} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="var(--muted-foreground)" 
                                        fontSize={11} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        minTickGap={30}
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
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                        }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                                        labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="success" 
                                        stroke="var(--chart-1)" 
                                        strokeWidth={2}
                                        fill="url(#colorSuccess)" 
                                        isAnimationActive={false} // Improves initial render stability
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="failed" 
                                        stroke="var(--destructive)" 
                                        strokeWidth={2}
                                        fill="url(#colorFailed)" 
                                        isAnimationActive={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* --- Secondary Chart: Status Distribution --- */}
                {/* Added min-w-0 */}
                <Card className="lg:col-span-3 border-border/50 bg-card/40 backdrop-blur-sm shadow-sm flex flex-col min-w-0">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Pipeline Health</CardTitle>
                        <CardDescription>Current state of all defined workflows</CardDescription>
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
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pipelineDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'var(--card)', 
                                                borderRadius: '8px', 
                                                border: '1px solid var(--border)' 
                                            }}
                                            itemStyle={{ color: 'var(--foreground)' }} 
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36} 
                                            iconType="circle"
                                            iconSize={8}
                                            wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                    <span className="text-3xl font-bold tabular-nums text-foreground">
                                        {stats?.totalPipelines}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                        Pipelines
                                    </span>
                                </div>
                            </div>
                         ) : (
                             <div className="flex flex-col items-center justify-center text-muted-foreground h-full gap-2">
                                 <AlertTriangle className="h-8 w-8 opacity-20" />
                                 <span className="text-sm">No data available</span>
                             </div>
                         )}
                    </CardContent>
                </Card>

                {/* --- Table: Recent Activity --- */}
                <Card className="col-span-full border-border/50 bg-card/40 backdrop-blur-sm shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription>Latest execution results across the platform</CardDescription>
                        </div>
                        
                        {/* FIX: Avoid using <Button asChild> with Link and Icons nested arbitrarily */}
                        {/* We use the Link component directly and apply button styles using buttonVariants */}
                        <Link 
                            to="/jobs" 
                            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs")}
                        >
                            View All History <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-white/5">
                                    <TableHead className="w-[100px]">Job ID</TableHead>
                                    <TableHead>Pipeline</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Duration</TableHead>
                                    <TableHead className="text-right">Started</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs && jobs.length > 0 ? (
                                    jobs.slice(0, 5).map((job: any) => (
                                        <TableRow key={job.id} className="hover:bg-muted/30 border-b border-white/5">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                #{job.id}
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">
                                                {job.pipeline_name || `Pipeline ${job.pipeline_id}`}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] uppercase font-bold border-0 px-2 py-0.5",
                                                    job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                                                    job.status === 'failed' ? 'bg-red-500/10 text-red-500' : 
                                                    'bg-blue-500/10 text-blue-500'
                                                )}>
                                                    {job.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                                                {job.duration_ms ? `${(job.duration_ms / 1000).toFixed(2)}s` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                                                {format(new Date(job.started_at), 'HH:mm:ss')}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                                            No recent activity found.
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

const StatsCard = ({ title, value, subtext, trend, trendUp, icon: Icon, active, color }: any) => (
    <Card className={cn(
        "relative overflow-hidden border border-border/50 bg-card/40 backdrop-blur-sm transition-all duration-300",
        active && "shadow-[0_0_20px_-10px_var(--primary)] border-primary/30"
    )}>
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <div className={cn("p-2 rounded-full bg-background/50", active && "animate-pulse")}>
                     <Icon className={cn("h-4 w-4", color || "text-foreground")} />
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-bold tracking-tight tabular-nums">{value}</h3>
                {(trend || subtext) && (
                    <div className="flex items-center text-xs">
                        {trend && (
                            <span className={cn(
                                "flex items-center font-medium mr-2",
                                trendUp ? "text-emerald-500" : "text-red-500"
                            )}>
                                {trendUp ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                                {trend}
                            </span>
                        )}
                        {subtext && <span className="text-muted-foreground">{subtext}</span>}
                    </div>
                )}
            </div>
        </CardContent>
        {active && (
             <div className="absolute top-0 right-0 -mt-8 -mr-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl"></div>
        )}
    </Card>
);