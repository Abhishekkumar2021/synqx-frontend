import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlertHistory, acknowledgeAlert, type Alert } from '@/lib/api';
import { PageMeta } from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    AlertCircle, 
    AlertTriangle, 
    CheckCircle2, 
    Info, 
    Search,
    Check,
    Bell,
    ArrowRight,
    ExternalLink,
    CheckCheck,
    MoreHorizontal,
    Trash2
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const AlertsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'acknowledged'>('all');
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(50); // Pagination limit state

    const { data, isLoading } = useQuery({
        queryKey: ['alerts-history', page, limit],
        queryFn: () => getAlertHistory(page * limit, limit),
        refetchInterval: 10000,
    });

    const alerts = data?.items || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const acknowledgeMutation = useMutation({
        mutationFn: (id: number) => acknowledgeAlert(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts-history'] });
            toast.success('Alert acknowledged');
        },
    });

    const acknowledgeAllMutation = useMutation({
        mutationFn: async () => {
            const pending = alerts?.filter(a => a.status === 'pending') || [];
            await Promise.all(pending.map(a => acknowledgeAlert(a.id)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts-history'] });
            toast.success('All alerts acknowledged');
        }
    });

    const getAlertIcon = (level: string) => {
        switch (level) {
            case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case 'error': 
            case 'critical': return <AlertCircle className="h-5 w-5 text-destructive" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            const matchesSearch = alert.message.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [alerts, searchQuery, statusFilter]);

    // Group alerts by date with guaranteed order
    const groupedAlerts = useMemo(() => {
        const groups: { title: string; alerts: Alert[] }[] = [];
        const map: Record<string, Alert[]> = {};

        filteredAlerts.forEach(alert => {
            const date = new Date(alert.created_at);
            let title = '';
            if (isToday(date)) title = 'Today';
            else if (isYesterday(date)) title = 'Yesterday';
            else title = format(date, 'MMMM d, yyyy');

            if (!map[title]) {
                map[title] = [];
                groups.push({ title, alerts: map[title] });
            }
            map[title].push(alert);
        });
        return groups;
    }, [filteredAlerts]);

    const pendingCount = alerts?.filter(a => a.status === 'pending').length || 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PageMeta title="Alerts History" description="View and manage system alerts." />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-inner">
                            <Bell className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                            Alerts History
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm pl-1">
                        Monitoring {total} system events across your infrastructure.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {pendingCount > 0 && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-300 shadow-sm"
                            onClick={() => acknowledgeAllMutation.mutate()}
                            disabled={acknowledgeAllMutation.isPending}
                        >
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Acknowledge All ({pendingCount})
                        </Button>
                    )}
                </div>
            </div>

            {/* Glass Toolbar */}
            <div className="z-30 p-2 rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 shadow-2xl flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:flex-1">
                    <Search className="z-20 absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Filter alerts by content, status, or level..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/30 h-11 rounded-xl"
                    />
                </div>
                
                <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl w-full md:w-auto">
                    {(['all', 'pending', 'acknowledged'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex-1 md:flex-none",
                                statusFilter === s 
                                    ? "bg-background text-primary shadow-sm ring-1 ring-border/50" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-10 pb-20">
                {isLoading ? (
                    <div className="space-y-8">
                        {[1, 2].map(g => (
                            <div key={g} className="space-y-4">
                                <div className="h-4 w-32 bg-muted animate-pulse rounded-lg ml-4" />
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 w-full bg-muted/20 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : groupedAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6 border-dashed border-2 rounded-[3rem]">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                            <div className="relative p-8 rounded-full bg-muted/30 ring-1 ring-border/50">
                                <Bell className="h-16 w-16 text-muted-foreground/40" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold">Silence is golden</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                                No alerts found for your current filter. You're all caught up with your systems.
                            </p>
                        </div>
                        <Button variant="ghost" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="rounded-full">
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    groupedAlerts.map((group) => (
                        <div key={group.title} className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-3 px-4">
                                <span>{group.title}</span>
                                <div className="h-px flex-1 bg-linear-to-r from-border/60 to-transparent" />
                            </h2>
                            
                            <div className="grid gap-3">
                                {group.alerts.map((alert) => (
                                    <div 
                                        key={alert.id} 
                                        className={cn(
                                            "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
                                            "bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 p-5",
                                            alert.status === 'pending' ? "bg-primary/2 border-primary/10" : "opacity-80"
                                        )}
                                    >
                                        {/* Status Accent Line */}
                                        <div className={cn(
                                            "absolute left-0 top-0 bottom-0 w-1",
                                            alert.level === 'error' || alert.level === 'critical' ? "bg-red-500" :
                                            alert.level === 'warning' ? "bg-amber-500" :
                                            alert.level === 'success' ? "bg-emerald-500" : "bg-blue-500"
                                        )} />

                                        <div className="flex gap-5">
                                            <div className="shrink-0 mt-1">
                                                {getAlertIcon(alert.level)}
                                            </div>

                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <p className={cn(
                                                            "text-sm leading-relaxed",
                                                            alert.status === 'pending' ? "font-bold text-foreground" : "text-muted-foreground"
                                                        )}>
                                                            {alert.message}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                            <span className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/20">
                                                                <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                                                                {format(new Date(alert.created_at), 'p')}
                                                            </span>
                                                            {alert.pipeline_id && (
                                                                <Link 
                                                                    to={`/pipelines/${alert.pipeline_id}`} 
                                                                    className="hover:text-primary flex items-center gap-1 group/link bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-md border border-primary/10 transition-colors"
                                                                >
                                                                    Pipeline #{alert.pipeline_id}
                                                                    <ExternalLink className="h-3 w-3 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                                                                </Link>
                                                            )}
                                                            {alert.job_id && (
                                                                <Link 
                                                                    to={`/jobs/${alert.job_id}`} 
                                                                    className="hover:text-primary flex items-center gap-1 group/link bg-muted/40 hover:bg-muted/60 px-2 py-0.5 rounded-md border border-border/40 transition-colors"
                                                                >
                                                                    Job Trace
                                                                    <ExternalLink className="h-3 w-3 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {alert.status === 'pending' ? (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-xl border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-500 shadow-sm transition-all duration-300"
                                                                onClick={() => acknowledgeMutation.mutate(alert.id)}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        ) : (
                                                            <Badge variant="success" className="h-6 rounded-lg bg-emerald-500/5 text-emerald-500 border-none text-[10px] font-black tracking-tighter uppercase px-2">
                                                                Read
                                                            </Badge>
                                                        )}
                                                        
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="rounded-xl border-border/40 shadow-xl p-1">
                                                                <DropdownMenuItem className="rounded-lg text-xs font-semibold">
                                                                    <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
                                                                    Delete Alert
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}

                {/* Enhanced Pagination Bar */}
                {total > 0 && (
                    <div className="sticky bottom-4 mx-4 flex items-center justify-between p-4 rounded-3xl bg-muted/80 border border-border/40 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-4">
                            <p className="text-xs text-muted-foreground font-medium pl-2">
                                Showing <span className="text-foreground">{Math.min((page + 1) * limit, total)}</span> of <span className="text-foreground">{total}</span>
                            </p>
                            
                            <select 
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }}
                                className="h-8 rounded-lg border-border/40 bg-background/50 text-xs font-bold px-2 focus:ring-primary/20"
                            >
                                <option value={20}>20 per page</option>
                                <option value={50}>50 per page</option>
                                <option value={100}>100 per page</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={page === 0}
                                onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="rounded-xl h-9 hover:bg-background shadow-sm"
                            >
                                Previous
                            </Button>
                            
                            <div className="flex items-center gap-1 px-2">
                                <span className="text-xs font-bold text-muted-foreground">Page {page + 1}</span>
                                <span className="text-xs text-muted-foreground/50">/</span>
                                <span className="text-xs font-bold text-muted-foreground">{totalPages}</span>
                            </div>

                            <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={page >= totalPages - 1}
                                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="rounded-xl h-9 hover:bg-background shadow-sm group"
                            >
                                Next
                                <ArrowRight className="ml-2 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};