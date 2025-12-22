/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ExecutionThroughputChartProps {
    data: any[];
}

type ViewType = 'jobs' | 'rows' | 'bytes';

// --- Premium Color Palette ---
const getThemeColors = (theme: string | undefined) => {
    const isDark = theme === 'dark';
    return {
        SUCCESS: isDark ? '#10b981' : '#059669', // Emerald 500/600
        FAILED: isDark ? '#f43f5e' : '#dc2626',  // Rose 500 / Red 600
        ROWS: isDark ? '#3b82f6' : '#2563eb',    // Blue 500/600
        VOLUME: isDark ? '#f59e0b' : '#d97706',  // Amber 500/600
        GRID: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        TEXT: isDark ? '#94a3b8' : '#64748b',
    };
};

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const CustomTooltip = ({ active, payload, label, viewType }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-[1.5rem] border border-border/40 bg-background/95 backdrop-blur-2xl p-4 shadow-2xl ring-1 ring-white/10 min-w-[200px] z-[100]">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-white/5 pb-2">
                    {label}
                </p>
                <div className="space-y-2.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-6 text-xs font-bold">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="h-2 w-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                                    style={{ backgroundColor: entry.color || entry.fill }}
                                />
                                <span className="text-muted-foreground/80">{entry.name}:</span>
                            </div>
                            <span className="font-mono text-foreground font-black">
                                {viewType === 'bytes' ? formatBytes(entry.value) : entry.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export const ExecutionThroughputChart: React.FC<ExecutionThroughputChartProps> = ({ data }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [view, setView] = useState<ViewType>('jobs');
    const colors = useMemo(() => getThemeColors(theme), [theme]);

    return (
        <Card className="flex flex-col h-full border border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden rounded-[2.5rem]">
            <CardHeader className="px-8 pt-8 pb-4 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-xl font-black tracking-tight text-foreground">Performance Metrics</CardTitle>
                            <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest text-primary border-primary/20 bg-primary/5 animate-pulse">
                                Live
                            </Badge>
                        </div>
                        <CardDescription className="text-sm font-medium text-muted-foreground/60">
                            Real-time pipeline efficiency analysis
                        </CardDescription>
                    </div>

                    <div className={cn(
                        "flex gap-1.5 items-center p-1.5 rounded-2xl",
                        "glass border border-border/60 shadow-sm",
                        "transition-all duration-300"
                    )}>
                        {(['jobs', 'rows', 'bytes'] as ViewType[]).map((v) => (
                            <Button
                                key={v}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "rounded-xl h-9 px-5 text-[10px] font-extrabold uppercase tracking-widest",
                                    "transition-all duration-300 ease-out",
                                    "relative overflow-hidden",
                                    view === v
                                        ? cn(
                                            "bg-primary text-primary-foreground shadow-lg scale-[1.02]",
                                            "dark:bg-primary/90 dark:shadow-primary/20",
                                            "before:absolute before:inset-0 before:bg-linear-to-b before:from-white/10 before:to-transparent",
                                            "ring-1 ring-primary/20 dark:ring-primary/30"
                                        )
                                        : cn(
                                            "text-muted-foreground hover:text-foreground",
                                            "hover:bg-muted/50 dark:hover:bg-muted/30",
                                            "active:scale-95"
                                        )
                                )}
                                onClick={() => setView(v)}
                            >
                                <span className="relative z-10">{v}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 px-6 pt-4 pb-8 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%" key={`${theme}-${view}`}>
                    {view === 'jobs' ? (
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors.SUCCESS} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={colors.SUCCESS} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors.FAILED} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={colors.FAILED} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.GRID} vertical={false} />
                            <XAxis dataKey="name" stroke={colors.TEXT} fontSize={10} fontWeight={800} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke={colors.TEXT} fontSize={10} fontWeight={800} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip viewType="jobs" colors={colors} />} cursor={{ stroke: colors.SUCCESS, strokeWidth: 2, strokeDasharray: '6 6', opacity: 0.4 }} />
                            <Area type="monotone" dataKey="success" name="Completed" stroke={colors.SUCCESS} strokeWidth={4} fill="url(#gradSuccess)" animationDuration={1500} />
                            <Area type="monotone" dataKey="failed" name="Failed" stroke={colors.FAILED} strokeWidth={4} fill="url(#gradFailed)" animationDuration={1500} />
                        </AreaChart>
                    ) : (
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.GRID} vertical={false} />
                            <XAxis dataKey="name" stroke={colors.TEXT} fontSize={10} fontWeight={800} tickLine={false} axisLine={false} dy={10} />
                            <YAxis
                                stroke={colors.TEXT}
                                fontSize={10}
                                fontWeight={800}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => view === 'bytes' ? formatBytes(val) : val.toLocaleString()}
                            />
                            <Tooltip content={<CustomTooltip viewType={view} colors={colors} />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                            <Bar
                                dataKey={view === 'rows' ? 'rows' : 'bytes'}
                                name={view === 'rows' ? 'Records' : 'Volume'}
                                fill={view === 'rows' ? colors.ROWS : colors.VOLUME}
                                radius={[8, 8, 0, 0]}
                                animationDuration={1500}
                                barSize={32}
                            />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};