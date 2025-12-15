import React, { useMemo } from 'react';
import { Activity, PauseCircle, AlertTriangle, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineStatusBadgeProps {
    status: string;
    className?: string;
}

export const PipelineStatusBadge: React.FC<PipelineStatusBadgeProps> = ({ status, className }) => {
    const s = (status || '').toLowerCase();
    
    const config = useMemo(() => {
        if (s === 'active') return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Activity, animate: false };
        if (s === 'running') return { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Activity, animate: true };
        if (s === 'paused') return { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: PauseCircle, animate: false };
        if (['error', 'broken', 'failed'].includes(s)) return { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertTriangle, animate: false };
        return { color: "text-muted-foreground", bg: "bg-white/5", border: "border-white/10", icon: Workflow, animate: false };
    }, [s]);

    const Icon = config.icon;

    return (
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm", config.bg, config.color, config.border, className)}>
            <Icon className={cn("w-3 h-3 mr-1.5", config.animate && "animate-pulse")} />
            {status}
        </span>
    );
};
