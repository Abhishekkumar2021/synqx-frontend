/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    trend?: string;
    trendUp?: boolean;
    icon: any; // Lucide icon
    active?: boolean;
    color?: string;
    bgGlow?: string;
    className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
    title, 
    value, 
    subtext, 
    trend, 
    trendUp, 
    icon: Icon, 
    active, 
    color, 
    bgGlow,
    className
}) => (
    <Card className={cn(
        "relative overflow-hidden border border-border/60 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-primary/30",
        active && "border-primary/40 shadow-[0_0_20px_-10px_var(--color-primary)] ring-1 ring-primary/20",
        className
    )}>
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-3">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <div className={cn("p-2 rounded-lg bg-background/80 shadow-sm border border-border/50", active && "animate-pulse")}>
                    <Icon className={cn("h-4 w-4", color || "text-foreground")} />
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <h3 className="text-3xl font-bold tracking-tight tabular-nums">{value}</h3>
                {(trend || subtext) && (
                    <div className="flex items-center text-xs">
                        {trend && (
                            <span className={cn(
                                "flex items-center font-bold mr-2 px-1.5 py-0.5 rounded-sm bg-muted/50",
                                trendUp ? "text-emerald-500" : "text-red-500"
                            )}>
                                {trendUp ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                                {trend}
                            </span>
                        )}
                        {subtext && <span className="text-muted-foreground/80">{subtext}</span>}
                    </div>
                )}
            </div>
        </CardContent>
        {active && (
            <div className={cn("absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full blur-3xl opacity-20 pointer-events-none", bgGlow || "bg-primary")}></div>
        )}
    </Card>
);
