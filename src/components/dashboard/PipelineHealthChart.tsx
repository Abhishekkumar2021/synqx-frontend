import React from 'react';
import {
    PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface PipelineHealthChartProps {
    data: any[];
    totalPipelines: number;
}

export const PipelineHealthChart: React.FC<PipelineHealthChartProps> = ({ data, totalPipelines }) => {
    return (
        <Card className="lg:col-span-3 border-border/60 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col min-w-0">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Pipeline Health</CardTitle>
                <CardDescription>Status distribution of defined pipelines</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center relative">
                {data.length > 0 ? (
                    <div className="w-full h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="var(--background)"
                                    strokeWidth={2}
                                >
                                    {data.map((entry, index) => (
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
                                {totalPipelines}
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
    );
};
