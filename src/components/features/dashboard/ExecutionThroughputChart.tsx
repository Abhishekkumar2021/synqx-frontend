/* eslint-disable @typescript-eslint/no-explicit-any */
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
        <Card className="lg:col-span-4 flex flex-col min-w-0 h-full">
            <CardHeader className="pb-2 px-6 pt-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold">Execution Throughput</CardTitle>
                        <CardDescription className="text-muted-foreground/80">24-hour job success vs failure volume</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase text-emerald-500 border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 animate-pulse">
                        ● Live
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pl-0 pr-4 pt-4 pb-2">
                <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="rgba(255,255,255,0.4)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={35}
                                dy={10}
                                tick={{ fontWeight: 500 }}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.4)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={40}
                                tick={{ fontWeight: 500 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                                    backdropFilter: 'blur(12px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                                    padding: '12px'
                                }}
                                itemStyle={{ fontSize: '12px', fontWeight: 600, padding: 0 }}
                                labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                                cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="success"
                                name="Completed"
                                stroke="var(--chart-2)"
                                strokeWidth={2}
                                fill="url(#colorSuccess)"
                                activeDot={{ r: 4, strokeWidth: 2, stroke: '#000' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="failed"
                                name="Failed"
                                stroke="var(--destructive)"
                                strokeWidth={2}
                                fill="url(#colorFailed)"
                                activeDot={{ r: 4, strokeWidth: 2, stroke: '#000' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};