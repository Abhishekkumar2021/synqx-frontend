import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatsCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    trend?: string;
    trendUp?: boolean;
    icon: LucideIcon;
    active?: boolean;
    className?: string;
}

// Create a motion component from the Shadcn Card
const MotionCard = motion(Card);

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    subtext,
    trend,
    trendUp,
    icon: Icon,
    active,
    className
}) => (
    <MotionCard
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={cn(
            "relative overflow-hidden rounded-[2rem] border transition-colors duration-300",
            // Base Colors (Glass Effect)
            "bg-card/40 backdrop-blur-md border-border/50",
            // Active State
            active
                ? "border-primary/40 shadow-xl shadow-primary/10 bg-primary/5"
                : "hover:border-primary/20 hover:bg-card/60 hover:shadow-lg hover:shadow-black/5",
            className
        )}
    >
        <CardContent className="p-6 md:p-8 relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between space-y-0 pb-5">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                <div className={cn(
                    "p-3 rounded-2xl border transition-all duration-300 group-hover:scale-110 shadow-sm",
                    active
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "bg-muted/50 border-border text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            {/* Value & Trends */}
            <div className="flex flex-col gap-2">
                <h3 
                    className="text-4xl font-bold tracking-tighter tabular-nums text-foreground"
                >
                    {value}
                </h3>

                {(trend || subtext) && (
                    <div className="flex items-center gap-2 text-xs font-semibold mt-1">
                        {trend && (
                            <span className={cn(
                                "flex items-center px-2 py-1 rounded-md border",
                                trendUp
                                    ? "text-success bg-success/10 border-success/20"
                                    : "text-destructive bg-destructive/10 border-destructive/20"
                            )}>
                                {trendUp ? <TrendingUp className="mr-1.5 h-3 w-3" /> : <TrendingDown className="mr-1.5 h-3 w-3" />}
                                {trend}
                            </span>
                        )}
                        {subtext && <span className="text-muted-foreground/70 font-medium truncate">{subtext}</span>}
                    </div>
                )}
            </div>
        </CardContent>

        {/* --- Decorative Elements --- */}

        {/* Hover Glow Gradient */}
        <div className="absolute -top-20 -right-20 h-60 w-60 bg-primary/20 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-full" />

        {/* Bottom Active Line */}
        {active && (
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-linear-to-r from-transparent via-primary to-transparent opacity-80 shadow-[0_-2px_10px_rgba(var(--primary),0.5)]"></div>
        )}
    </MotionCard>
);