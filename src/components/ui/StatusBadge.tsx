import React, { useMemo } from 'react';
import {
    CheckCircle2,
    AlertTriangle,
    Clock,
    XCircle,
    Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: string;
    className?: string;
    variant?: 'default' | 'outline' | 'secondary' | 'destructive';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
    const config = useMemo(() => {
        let styles = "bg-muted/50 text-muted-foreground border-border/50";
        let icon = Clock;
        let animate = false;

        switch (status?.toLowerCase()) {
            case 'completed':
            case 'success':
                styles = "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_-4px_var(--color-emerald-500)]";
                icon = CheckCircle2;
                break;
            case 'failed':
            case 'error':
                styles = "bg-rose-500/15 text-rose-400 border-rose-500/20 shadow-[0_0_10px_-4px_var(--color-rose-500)]";
                icon = AlertTriangle; // Or XCircle
                break;
            case 'broken':
                styles = "bg-rose-500/15 text-rose-400 border-rose-500/20";
                icon = XCircle;
                break;
            case 'running':
                styles = "bg-blue-500/15 text-blue-400 border-blue-500/20 shadow-[0_0_10px_-4px_var(--color-blue-500)]";
                icon = Loader2;
                animate = true;
                break;
            case 'active':
                styles = "bg-green-500/15 text-green-400 border-green-500/20";
                icon = CheckCircle2;
                break;
            case 'paused':
                styles = "bg-amber-500/15 text-amber-400 border-amber-500/20";
                icon = Clock;
                break;
        }

        return { styles, icon, animate };
    }, [status]);

    const Icon = config.icon;

    return (
        <Badge 
            variant="outline" 
            className={cn(
                "text-[10px] uppercase font-bold border px-2.5 py-1 gap-1.5 backdrop-blur-md rounded-full transition-all duration-300 hover:scale-105", 
                config.styles, 
                config.animate && "animate-pulse",
                className
            )}
        >
            <Icon className={cn("h-3 w-3", config.animate && "animate-spin-slow")} />
            {status}
        </Badge>
    );
};