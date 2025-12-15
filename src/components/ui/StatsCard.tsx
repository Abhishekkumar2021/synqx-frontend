/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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

const MotionCard = motion(Card);

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
    <MotionCard 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        className={cn(
            "glass-card glass-card-hover rounded-3xl group",
            active && "border-primary/30 shadow-[0_0_30px_-10px_var(--color-primary)] bg-primary/5",
            className
        )}
    >
        <CardContent className="p-7 relative z-10">
            <div className="flex items-center justify-between space-y-0 pb-4">
                <p className="text-sm font-semibold text-muted-foreground/80 tracking-wide uppercase">{title}</p>
                <div className={cn(
                    "p-2.5 rounded-xl bg-white/10 shadow-inner border border-white/5 transition-transform duration-300 group-hover:scale-110", 
                    active && "bg-primary/20 border-primary/20 text-primary animate-pulse"
                )}>
                    <Icon className={cn("h-5 w-5", color || "text-foreground")} />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <h3 className="text-4xl font-bold tracking-tighter tabular-nums text-foreground">{value}</h3>
                {(trend || subtext) && (
                    <div className="flex items-center text-xs font-medium">
                        {trend && (
                            <span className={cn(
                                "flex items-center mr-2 px-2 py-0.5 rounded-md",
                                trendUp ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                            )}>
                                {trendUp ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                                {trend}
                            </span>
                        )}
                        {subtext && <span className="text-muted-foreground/60">{subtext}</span>}
                    </div>
                )}
            </div>
        </CardContent>
        
        {/* Decorative Glows */}
        <div className={cn(
            "absolute -top-10 -right-10 h-40 w-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none",
            bgGlow || "bg-primary"
        )}></div>
        
         {active && (
            <div className={cn("absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent opacity-50")}></div>
        )}
    </MotionCard>
);