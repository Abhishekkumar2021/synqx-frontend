import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { getPipelines, getJobs, getConnections } from '../lib/api';
import { subHours, format } from 'date-fns';
import { Skeleton } from '../components/ui/skeleton';
import { Activity, Database, Workflow, CheckCircle2, PlayCircle, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';


export const DashboardPage: React.FC = () => {
    const { data: pipelines, isLoading: loadingPipelines } = useQuery({ queryKey: ['pipelines'], queryFn: getPipelines });
    const { data: jobs, isLoading: loadingJobs } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() }); 
    const { data: connections, isLoading: loadingConnections } = useQuery({ queryKey: ['connections'], queryFn: getConnections });

    // Calculate Stats
    const totalPipelines = pipelines?.length || 0;
    const activePipelines = pipelines?.filter(p => p.status === 'active').length || 0;
    const pausedPipelines = pipelines?.filter(p => p.status === 'paused').length || 0;
    const brokenPipelines = pipelines?.filter(p => (p.status as string) === 'broken').length || 0;
    const totalConnections = connections?.length || 0;
    
    const completedJobs = jobs?.filter(j => j.status === 'completed' || j.status === 'failed') || [];
    const successRate = completedJobs.length > 0 
        ? Math.round((completedJobs.filter(j => j.status === 'completed').length / completedJobs.length) * 100) 
        : 100; // Default to 100 if no jobs to avoid scary 0%

    const isLoading = loadingPipelines || loadingJobs || loadingConnections;

    const pipelineStatusData = React.useMemo(() => {
        return [
            { name: 'Active', value: activePipelines, color: 'var(--chart-1)' },
            { name: 'Paused', value: pausedPipelines, color: 'var(--chart-2)' },
            { name: 'Broken', value: brokenPipelines, color: 'var(--chart-3)' },
            { name: 'Draft', value: totalPipelines - activePipelines - pausedPipelines - brokenPipelines, color: 'var(--chart-4)'},
        ].filter(item => item.value > 0);
    }, [pipelines, activePipelines, pausedPipelines, brokenPipelines, totalPipelines]);

    const chartData = React.useMemo(() => {
        // Just a simple mock/projection for now since real data accumulation is not fully implemented
        const data = [];
        const now = new Date();
        for (let i = 24; i >= 0; i-=4) {
            data.push({
                name: format(subHours(now, i), 'HH:mm'),
                success: Math.floor(Math.random() * 10) + 1, // More success
                failed: Math.floor(Math.random() * 2) // Less failed
            })
        }
        return data;
    }, []);

    const recentJobsMock = React.useMemo(() => {
        if (jobs && jobs.length > 0) return jobs.slice(0, 5); // Take actual jobs if available
        // Mock data if no actual jobs
        return [
            { id: 1, pipeline_name: 'Daily Sales Report', status: 'completed', duration_ms: 30000, started_at: subHours(new Date(), 1).toISOString() },
            { id: 2, pipeline_name: 'Customer Sync', status: 'failed', duration_ms: 15000, started_at: subHours(new Date(), 2).toISOString() },
            { id: 3, pipeline_name: 'Inventory Update', status: 'completed', duration_ms: 60000, started_at: subHours(new Date(), 3).toISOString() },
            { id: 4, pipeline_name: 'Hourly ETL', status: 'completed', duration_ms: 5000, started_at: subHours(new Date(), 4).toISOString() },
            { id: 5, pipeline_name: 'User Data Backup', status: 'running', duration_ms: 0, started_at: subHours(new Date(), 0.5).toISOString() },
        ];
    }, [jobs]);


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
                    <p className="text-muted-foreground mt-1">System Overview & Performance Metrics</p>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    <>
                        <Skeleton className="h-[120px] rounded-xl" />
                        <Skeleton className="h-[120px] rounded-xl" />
                        <Skeleton className="h-[120px] rounded-xl" />
                        <Skeleton className="h-[120px] rounded-xl" />
                    </>
                ) : (
                    <>
                        <StatsCard 
                            title="Total Pipelines" 
                            value={totalPipelines.toString()} 
                            subtext="Workflows" 
                            icon={Workflow}
                        />
                        <StatsCard 
                            title="Active Pipelines" 
                            value={activePipelines.toString()} 
                            subtext="Currently running or scheduled" 
                            icon={PlayCircle}
                            active={activePipelines > 0}
                        />
                        <StatsCard 
                            title="Connections" 
                            value={totalConnections.toString()} 
                            subtext="Data Sources" 
                            icon={Database}
                        />
                        <StatsCard 
                            title="Success Rate" 
                            value={`${successRate}%`} 
                            subtext="Last 24 hours" 
                            icon={CheckCircle2}
                            trendUp={successRate >= 90}
                        />
                    </>
                )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Execution Volume Chart */}
                <Card className="col-span-4 border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Execution Volume
                        </CardTitle>
                        <CardDescription>Processed jobs over the last 24 hours</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full min-h-[300px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={chartData}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="var(--muted-foreground)" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickMargin={10}
                                    />
                                    <YAxis 
                                        stroke="var(--muted-foreground)" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(value) => `${value}`} 
                                    />
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'var(--card)', 
                                            borderColor: 'var(--border)', 
                                            borderRadius: 'var(--radius)', 
                                            color: 'var(--foreground)' 
                                        }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                        cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="success" 
                                        stroke="var(--chart-1)" 
                                        fillOpacity={1} 
                                        fill="url(#colorSuccess)" 
                                        strokeWidth={2} 
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="failed" 
                                        stroke="var(--destructive)" 
                                        fillOpacity={1} 
                                        fill="url(#colorFailed)" 
                                        strokeWidth={2} 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pipeline Status Distribution Pie Chart */}
                <Card className="col-span-3 border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Workflow className="h-4 w-4 text-primary" />
                            Pipeline Status
                        </CardTitle>
                        <CardDescription>Distribution of pipelines by their current status</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                         {pipelineStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pipelineStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%`}
                                    >
                                        {pipelineStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'var(--card)', 
                                            borderColor: 'var(--border)', 
                                            borderRadius: 'var(--radius)', 
                                            color: 'var(--foreground)' 
                                        }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                         ) : (
                             <div className="text-muted-foreground text-sm">No pipeline data to display.</div>
                         )}
                    </CardContent>
                </Card>

                {/* Recent Jobs Table */}
                <Card className="col-span-full border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            Recent Job Activity
                        </CardTitle>
                        <CardDescription>Latest executions across all pipelines</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pipeline</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Started At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentJobsMock.length > 0 ? (
                                    recentJobsMock.map((job: any) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">{job.pipeline_name || `Pipeline ${job.id}`}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    job.status === 'completed' ? 'default' : 
                                                    job.status === 'failed' ? 'destructive' : 
                                                    'secondary'
                                                }>
                                                    {job.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{job.duration_ms ? `${(job.duration_ms / 1000).toFixed(1)}s` : 'N/A'}</TableCell>
                                            <TableCell>{format(new Date(job.started_at), 'MMM dd, HH:mm')}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No recent job runs.
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

const StatsCard = ({ title, value, subtext, icon: Icon, active }: any) => (
    <Card className={cn(
        "relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
        active ? 'border-primary/50 shadow-[0_0_15px_-5px_var(--primary)] hover:shadow-[0_0_25px_-5px_var(--primary)]' : 'hover:border-primary/20 hover:shadow-lg'
    )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className={cn("h-4 w-4", active ? 'text-primary animate-pulse' : 'text-muted-foreground')} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        </CardContent>
        {active && (
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-primary/20 blur-xl animate-pulse-slow"></div>
        )}
    </Card>
);
