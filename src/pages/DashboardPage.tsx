import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getPipelines, getJobs, getConnections } from '../lib/api';
import { subHours, format } from 'date-fns';
import { Skeleton } from '../components/ui/skeleton';

export const DashboardPage: React.FC = () => {
    const { data: pipelines, isLoading: loadingPipelines } = useQuery({ queryKey: ['pipelines'], queryFn: getPipelines });
    const { data: jobs, isLoading: loadingJobs } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() }); 
    const { data: connections, isLoading: loadingConnections } = useQuery({ queryKey: ['connections'], queryFn: getConnections });

    // Calculate Stats
    const totalPipelines = pipelines?.length || 0;
    const activeRuns = jobs?.filter(j => j.status === 'running').length || 0;
    const totalConnections = connections?.length || 0;
    
    const completedJobs = jobs?.filter(j => j.status === 'completed' || j.status === 'failed') || [];
    const successRate = completedJobs.length > 0 
        ? Math.round((completedJobs.filter(j => j.status === 'completed').length / completedJobs.length) * 100) 
        : 0;

    const isLoading = loadingPipelines || loadingJobs || loadingConnections;

    const chartData = React.useMemo(() => {
        if (!jobs) return [];
        const now = new Date();
        
        const buckets: Record<string, { success: number, failed: number }> = {};
        
        for (let i = 0; i <= 24; i+=4) {
             const t = subHours(now, 24 - i);
             const key = format(t, 'HH:mm');
             buckets[key] = { success: 0, failed: 0 };
        }

        return Object.entries(buckets).map(([name, val]) => ({ name, ...val }));
    }, [jobs]);

    const useMockChart = !jobs || jobs.length === 0;
    const finalChartData = useMockChart ? [
        { name: '00:00', success: 0, failed: 0 },
        { name: '04:00', success: 0, failed: 0 },
        { name: '08:00', success: 0, failed: 0 },
        { name: '12:00', success: 0, failed: 0 },
        { name: '16:00', success: 0, failed: 0 },
        { name: '20:00', success: 0, failed: 0 },
    ] : chartData;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
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
                        <StatsCard title="Total Pipelines" value={totalPipelines.toString()} subtext="Active workflows" />
                        <StatsCard title="Active Runs" value={activeRuns.toString()} subtext="Currently executing" />
                        <StatsCard title="Connections" value={totalConnections.toString()} subtext="Data sources" />
                        <StatsCard title="Success Rate" value={`${successRate}%`} subtext="Last 100 runs" />
                    </>
                )}
            </div>
            
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle>System Health (24h)</CardTitle>
                    {useMockChart && <p className="text-xs text-muted-foreground">(No run data available yet)</p>}
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full min-h-[300px]">
                        {loadingJobs ? (
                            <Skeleton className="w-full h-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={finalChartData}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#888888" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickMargin={10}
                                    />
                                    <YAxis 
                                        stroke="#888888" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(value) => `${value}`} 
                                    />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#f3f4f6' }}
                                        itemStyle={{ color: '#e5e7eb' }}
                                        cursor={{ stroke: '#4b5563', strokeWidth: 1 }}
                                    />
                                    <Area type="monotone" dataKey="success" stroke="#22c55e" fillOpacity={1} fill="url(#colorSuccess)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="failed" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailed)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const StatsCard = ({ title, value, subtext }: { title: string, value: string, subtext: string }) => (
    <div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-muted-foreground">{title}</div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
);
