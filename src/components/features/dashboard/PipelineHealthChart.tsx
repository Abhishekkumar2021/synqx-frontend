/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

interface PipelineHealthChartProps {
    data: any[];
    totalPipelines: number;
}

// --- Dynamic Color Resolver for Pie Chart ---
const resolveChartColors = (theme: string | undefined) => {
    const isDark = theme === 'dark';

    return {
        // Active/Success/Chart-2
        Active: isDark ? 'hsl(145 42% 68%)' : 'hsl(145 35% 45%)',
        // Paused (Using a generic amber/yellow for contrast)
        Paused: isDark ? 'hsl(55 38% 68%)' : 'hsl(55 38% 50%)',
        // Error/Broken (Destructive)
        Error: isDark ? 'hsl(25 47% 62%)' : 'hsl(25 47% 35%)',
        // Draft/Inactive (Muted)
        Draft: isDark ? 'hsl(240 4% 30%)' : 'hsl(240 4% 80%)',

        // Primary (for Tooltip text highlight)
        PRIMARY: isDark ? 'hsl(257 23% 65%)' : 'hsl(257 24% 52%)',
    };
};


// --- Custom Tooltip Component ---
const CustomTooltip = ({ active, payload }: any) => {
    const { theme } = useTheme();
    const COLORS = resolveChartColors(theme);

    // Note: item.color/item.payload.fill already contains the resolved HSL string
    const resolvedColor = payload[0]?.color || payload[0]?.payload.fill;

    if (active && payload && payload.length) {
        const item = payload[0];
        const total = item.payload.total || 1;
        const percentage = (item.value / total) * 100;

        return (
            // FIX: Added z-50 class to ensure the tooltip is visually above all surrounding UI.
            <div className="z-50 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl p-3 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                <p className="mb-1 text-sm font-semibold text-foreground">
                    {item.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div
                        className="h-2 w-2 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/20"
                        style={{ backgroundColor: resolvedColor }}
                    />
                    <span className="font-mono text-foreground/80">{item.value} pipelines</span>
                    <span
                        style={{ color: COLORS.PRIMARY }}
                        className="font-bold ml-1"
                    >
                        ({percentage.toFixed(1)}%)
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export const PipelineHealthChart: React.FC<PipelineHealthChartProps> = ({ data, totalPipelines }) => {
    const { theme } = useTheme();

    const COLOR_MAP = useMemo(() => resolveChartColors(theme), [theme]);

    const dataWithTotal = useMemo(() => {
        return data.map(d => ({
            ...d,
            total: totalPipelines,
            // Assign the resolved HSL string to 'fill'
            fill: COLOR_MAP[d.name as keyof typeof COLOR_MAP] || COLOR_MAP.Draft
        }));
    }, [data, totalPipelines, COLOR_MAP]);


    return (
        <Card className="lg:col-span-3 flex flex-col min-w-0 h-full border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm">
            <CardHeader className="pb-2 px-6 pt-6 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-base font-semibold text-foreground">Pipeline Health</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Status distribution of defined pipelines</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center relative p-0 pb-4">
                {data.length > 0 && totalPipelines > 0 ? (
                    <div className="w-full h-full min-h-[300px] relative">
                        <ResponsiveContainer width="100%" height="100%" key={theme}>
                            <PieChart>
                                <Pie
                                    data={dataWithTotal}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={4}
                                    cornerRadius={6}
                                    dataKey="value"
                                    stroke="hsl(var(--background))"
                                    strokeWidth={3}
                                >
                                    {dataWithTotal.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.fill}
                                            className="hover:opacity-80 transition-opacity duration-300"
                                            style={{ filter: `drop-shadow(0px 0px 4px ${entry.fill}a0)` }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={false}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => <span className="text-xs font-medium text-muted-foreground ml-1.5 mr-2">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Absolute Center Text */}
                        <div className={cn(
                            "absolute inset-0 flex flex-col items-center justify-center pointer-events-none",
                            "pb-[30px]"
                        )}>
                            <span className="text-5xl font-bold tabular-nums text-foreground tracking-tighter drop-shadow-md">
                                {totalPipelines}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">
                                Total
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground h-full gap-3 opacity-60">
                        <div className="p-4 bg-muted/50 rounded-full border border-border/50">
                            <AlertTriangle className="h-6 w-6 opacity-50" />
                        </div>
                        <span className="text-sm font-medium">No pipelines found</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};