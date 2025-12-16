/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useTheme } from '@/hooks/useTheme'; // Used for dynamic key and color resolution

interface ExecutionThroughputChartProps {
    data: any[];
}

// --- Dynamic Color Resolver ---
// This function maps the semantic role (SUCCESS, BORDER, etc.) to the correct HSL string 
// based on the active theme, preventing visibility issues in Light Mode.
const resolveChartColors = (theme: string | undefined) => {
    const isDark = theme === 'dark';

    return {
        // --- Chart Data Colors (SUCCESS / CHART-2) ---
        // Dark: hsl(145 42% 68%) | Light: hsl(145 35% 62%)
        SUCCESS_STROKE: isDark ? 'hsl(145 42% 68%)' : 'hsl(145 35% 45%)',
        SUCCESS_FILL_STOP: isDark ? 'hsl(145 42% 68%)' : 'hsl(145 35% 45%)',

        // --- Chart Data Colors (FAILED / DESTRUCTIVE) ---
        // Dark: hsl(25 47% 62%) | Light: hsl(25 47% 58%)
        FAILED_STROKE: isDark ? 'hsl(25 47% 62%)' : 'hsl(25 47% 35%)',
        FAILED_FILL_STOP: isDark ? 'hsl(25 47% 62%)' : 'hsl(25 47% 35%)',

        // --- Axis / Grid / Cursor Colors ---
        // MUTED_FOREGROUND (Axis Text)
        MUTED_FOREGROUND: isDark ? 'hsl(240 4% 65%)' : 'hsl(240 4% 55%)',
        // BORDER (Grid Lines)
        BORDER: isDark ? 'hsl(240 4% 26%)' : 'hsl(240 4% 92%)',
        // PRIMARY (Cursor)
        PRIMARY: isDark ? 'hsl(257 23% 65%)' : 'hsl(257 24% 52%)',
    };
};


// --- Custom Tooltip Component ---
const CustomTooltip = ({ active, payload, label }: any) => {
    const { theme } = useTheme();

    const resolvedColors = resolveChartColors(theme);

    const colorMap: { [key: string]: string } = {
        success: resolvedColors.SUCCESS_STROKE,
        failed: resolvedColors.FAILED_STROKE,
    };

    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl p-3 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs font-semibold">
                            <div
                                className="h-2 w-2 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/20"
                                style={{ backgroundColor: colorMap[entry.dataKey] }}
                            />
                            <span className="text-foreground min-w-[60px]">{entry.name}:</span>
                            <span className="font-mono text-foreground/80">{entry.value}</span>
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

    // Resolve colors based on the current theme state
    const COLORS = useMemo(() => resolveChartColors(theme), [theme]);

    const chartData = useMemo(() => {
        if (data && data.length > 0) {
            return data.map(item => {
                const timeValue = item.time;

                const formattedName = timeValue
                    ? format(new Date(timeValue), 'HH:mm')
                    : item.name;

                return {
                    ...item,
                    name: formattedName,
                };
            });
        }
    }, [data]);


    return (
        <Card className="lg:col-span-4 flex flex-col min-w-0 h-full border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm">
            <CardHeader className="pb-2 px-6 pt-6 border-b border-border/40 bg-muted/20">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-semibold text-foreground">Execution Throughput</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            24-hour job success vs failure volume
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase text-emerald-600 border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 animate-pulse">
                        ● Live
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pl-0 pr-4 pt-6 pb-2 min-h-[300px]">
                <div className="h-[300px] flex-1">
                    {/* CRITICAL: Force re-render on theme change using key={theme} */}
                    <ResponsiveContainer width="100%" height="100%" key={theme}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                {/* Gradients using resolved HSL values */}
                                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.SUCCESS_FILL_STOP} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLORS.SUCCESS_FILL_STOP} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.FAILED_FILL_STOP} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLORS.FAILED_FILL_STOP} stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={COLORS.BORDER} // Theme-aware border color
                                vertical={false}
                                opacity={0.6}
                            />

                            <XAxis
                                dataKey="name"
                                stroke={COLORS.MUTED_FOREGROUND} // Theme-aware muted color
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                                dy={10}
                            />

                            <YAxis
                                stroke={COLORS.MUTED_FOREGROUND} // Theme-aware muted color
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={40}
                                tickFormatter={(value) => value === 0 ? '' : value}
                            />

                            <Tooltip
                                content={<CustomTooltip />}
                                // Cursor uses theme-aware primary color
                                cursor={{ stroke: COLORS.PRIMARY, strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }}
                            />

                            <Area
                                type="monotone"
                                dataKey="success"
                                name="Completed"
                                stroke={COLORS.SUCCESS_STROKE} // Theme-aware success color
                                strokeWidth={2}
                                fill="url(#colorSuccess)"
                                animationDuration={1500}
                            />
                            <Area
                                type="monotone"
                                dataKey="failed"
                                name="Failed"
                                stroke={COLORS.FAILED_STROKE} // Theme-aware destructive color
                                strokeWidth={2}
                                fill="url(#colorFailed)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};