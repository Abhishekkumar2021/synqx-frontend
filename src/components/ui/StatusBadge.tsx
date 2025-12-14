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
        let styles = "bg-muted text-muted-foreground border-border";
        let icon = Clock;
        let animate = false;

        switch (status?.toLowerCase()) {
            case 'completed':
            case 'success':
                styles = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                icon = CheckCircle2;
                break;
            case 'failed':
            case 'error':
                styles = "bg-red-500/5 text-red-500 border-red-500/10";
                icon = AlertTriangle; // Or XCircle
                break;
            case 'broken':
                styles = "bg-red-500/5 text-red-500 border-red-500/10";
                icon = XCircle;
                break;
            case 'running':
                styles = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                icon = Loader2;
                animate = true;
                break;
            case 'active':
                styles = "bg-green-500/10 text-green-500 border-green-500/20";
                icon = CheckCircle2;
                break;
            case 'paused':
                styles = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
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
                "text-[10px] uppercase font-bold border px-2 py-0.5 gap-1.5", 
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
