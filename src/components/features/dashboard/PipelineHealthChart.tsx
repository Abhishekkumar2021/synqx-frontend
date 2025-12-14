/* eslint-disable @typescript-eslint/no-explicit-any */
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
        <Card className="lg:col-span-3 border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-3xl flex flex-col min-w-0">
            <CardHeader className="pb-2 px-6 pt-6">
                <CardTitle className="text-lg font-bold">Pipeline Health</CardTitle>
                <CardDescription className="text-muted-foreground/80">Status distribution of defined pipelines</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center relative p-0 pb-4">
                {data.length > 0 ? (
                    <div className="w-full h-[280px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={4}
                                    cornerRadius={6}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.color} 
                                            className="hover:opacity-80 transition-opacity duration-300 filter drop-shadow-lg" 
                                            style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}40)` }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(20, 20, 20, 0.8)',
                                        backdropFilter: 'blur(12px)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                                        padding: '10px 16px'
                                    }}
                                    itemStyle={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}
                                    cursor={false}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    iconSize={6}
                                    formatter={(value) => <span className="text-xs font-semibold text-muted-foreground ml-1.5 mr-2">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                            <span className="text-5xl font-bold tabular-nums text-foreground tracking-tighter drop-shadow-lg">
                                {totalPipelines}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">
                                Total
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground h-full gap-3 opacity-60">
                        <div className="p-4 bg-white/5 rounded-full border border-white/5">
                            <AlertTriangle className="h-6 w-6 opacity-50" />
                        </div>
                        <span className="text-sm font-medium">No pipelines found</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};