/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Clock, Database, Workflow, ArrowUpRight,
    MoreHorizontal, FileText, RefreshCw, Terminal
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface RecentActivityTableProps {
    jobs: any[];
}

const getDurationDisplay = (durationMs: number | null) => {
    if (durationMs === null || durationMs === undefined) return '—';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
};

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ jobs }) => {
    const navigate = useNavigate();

    return (
        <Card className="col-span-full border border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-6 px-8 bg-muted/10 shrink-0">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl ring-1 ring-primary/20">
                            <Clock className="h-5 w-5 text-primary" />
                        </div>
                        Recent Activity
                    </CardTitle>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/jobs')}
                    className="text-[10px] font-black uppercase tracking-[0.2em] h-10 gap-2 rounded-xl px-6 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all group"
                >
                    Registry Archive <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
            </CardHeader>

            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-white/5 bg-white/[0.02]">
                            <TableHead className="w-[120px] text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/50 pl-8">Snapshot ID</TableHead>
                            <TableHead className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/50">Pipeline Entity</TableHead>
                            <TableHead className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/50 text-center">Status</TableHead>
                            <TableHead className="text-right text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/50">Execution</TableHead>
                            <TableHead className="text-right text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/50 pr-8">Timestamp</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs && jobs.length > 0 ? (
                            jobs.slice(0, 8).map((job: any) => (
                                <TableRow
                                    key={job.id}
                                    className="hover:bg-primary/[0.03] border-b border-white/5 group transition-all duration-300 cursor-pointer"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                >
                                    <TableCell className="font-mono text-[11px] font-black text-foreground pl-8">
                                        <span className="opacity-20 text-primary">#</span>{job.id}
                                    </TableCell>
                                    <TableCell className="font-bold text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-muted/50 border border-white/5 group-hover:border-primary/20 transition-colors">
                                                <Workflow className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-foreground/80 group-hover:text-foreground transition-colors">{job.pipeline_name || `Pipeline ${job.pipeline_id}`}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <StatusBadge status={job.status} className="shadow-none border-none scale-90" />
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-[11px] tabular-nums text-muted-foreground/70 font-black group-hover:text-foreground transition-colors">
                                        {getDurationDisplay(job.execution_time_ms)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-[11px] tabular-nums text-muted-foreground/70 font-black pr-8 group-hover:text-foreground transition-colors">
                                        {format(new Date(job.started_at), 'HH:mm:ss')}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()} className="pr-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="rounded-2xl border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl p-2 min-w-[160px]"
                                            >
                                                <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                                                    <Terminal className="h-3.5 w-3.5 text-primary" /> Inspect Logic
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs cursor-pointer" onClick={() => navigate(`/jobs/${job.id}/logs`)}>
                                                    <FileText className="h-3.5 w-3.5 text-primary" /> Audit Logs
                                                </DropdownMenuItem>
                                                <div className="h-px bg-white/5 my-1" />
                                                <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs cursor-pointer">
                                                    <RefreshCw className="h-3.5 w-3.5 text-primary" /> Re-execute
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-60 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-4 opacity-40">
                                        <div className="p-6 rounded-[2rem] bg-muted/20 border border-border/50">
                                            <Database className="h-10 w-10 opacity-20" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">No activity recorded</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};