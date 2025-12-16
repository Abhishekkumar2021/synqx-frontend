/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Clock, Database, Workflow, ArrowUpRight,
    MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge'; // Assuming this uses semantic status colors

interface RecentActivityTableProps {
    jobs: any[];
}

// Helper to calculate duration for display (useful if duration_ms isn't calculated server-side)
const getDurationDisplay = (durationMs: number | null) => {
    if (durationMs === null || durationMs === undefined) return '-';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
};


export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ jobs }) => {
    return (
        // Replaced hardcoded glass classes with semantic border/background/utility classes
        <Card className="col-span-full overflow-hidden border border-border/60 bg-card/50 backdrop-blur-xl shadow-sm">

            {/* --- Header --- */}
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 py-4 px-6 bg-muted/10 shrink-0">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                            <Clock className="h-4 w-4 text-primary" />
                        </div>
                        Recent Activity
                    </CardTitle>
                </div>

                <Link
                    to="/jobs"
                    className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "text-xs h-8 gap-1.5 rounded-full px-4 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                    )}
                >
                    View Full History <ArrowUpRight className="h-3 w-3" />
                </Link>
            </CardHeader>

            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/40 bg-muted/10">
                            <TableHead className="w-[120px] text-[11px] uppercase font-bold tracking-wider text-muted-foreground pl-6">Job ID</TableHead>
                            <TableHead className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">Pipeline</TableHead>
                            <TableHead className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">Status</TableHead>
                            <TableHead className="text-right text-[11px] uppercase font-bold tracking-wider text-muted-foreground">Duration</TableHead>
                            <TableHead className="text-right text-[11px] uppercase font-bold tracking-wider text-muted-foreground pr-6">Started</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs && jobs.length > 0 ? (
                            jobs.slice(0, 5).map((job: any) => (
                                <TableRow
                                    key={job.id}
                                    // Use muted/30 for row hover (theme agnostic)
                                    className="hover:bg-muted/30 border-b border-border/40 group transition-colors"
                                >
                                    <TableCell className="font-mono text-xs font-semibold text-foreground pl-6">
                                        <span className="opacity-60 text-muted-foreground/80">#</span>{job.id}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1 rounded bg-muted/30 border border-border/40">
                                                <Workflow className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                            <span className="text-foreground/90">{job.pipeline_name || `Pipeline ${job.pipeline_id}`}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {/* Assuming StatusBadge uses semantic colors internally */}
                                        <StatusBadge status={job.status} className="shadow-none border-none" />
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground font-medium">
                                        {getDurationDisplay(job.duration_ms)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground font-medium pr-6">
                                        {format(new Date(job.started_at), 'HH:mm:ss')}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/50"
                                                >
                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="rounded-xl border-border/60 bg-popover/95 backdrop-blur-xl shadow-xl"
                                            >
                                                <DropdownMenuItem className="cursor-pointer">View Logs</DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer">Rerun</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                                        <div className="p-4 rounded-full bg-muted/50 border border-border/40">
                                            <Database className="h-6 w-6 opacity-40" />
                                        </div>
                                        <span className="text-sm font-medium">No recent activity recorded</span>
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