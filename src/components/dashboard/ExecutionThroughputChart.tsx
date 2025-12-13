import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ExecutionThroughputChartProps {
    data: any[];
}

export const ExecutionThroughputChart: React.FC<ExecutionThroughputChartProps> = ({ data }) => {
    return (
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
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
    );
};
