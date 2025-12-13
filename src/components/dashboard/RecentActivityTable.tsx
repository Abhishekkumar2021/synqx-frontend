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
import { StatusBadge } from '@/components/ui/StatusBadge';

interface RecentActivityTableProps {
    jobs: any[];
}

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ jobs }) => {
    return (
        <Card className="col-span-full border-border/60 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/5 py-4">
                <div className="space-y-0.5">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Recent Activity
                    </CardTitle>
                </div>

                <Link
                    to="/jobs"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs h-8 gap-1 hover:text-primary")}
                >
                    View Full History <ArrowUpRight className="h-3 w-3" />
                </Link>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/40">
                            <TableHead className="w-[100px] text-xs uppercase font-semibold">Job ID</TableHead>
                            <TableHead className="text-xs uppercase font-semibold">Pipeline</TableHead>
                            <TableHead className="text-xs uppercase font-semibold">Status</TableHead>
                            <TableHead className="text-right text-xs uppercase font-semibold">Duration</TableHead>
                            <TableHead className="text-right text-xs uppercase font-semibold">Started</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs && jobs.length > 0 ? (
                            jobs.slice(0, 5).map((job: any) => (
                                <TableRow key={job.id} className="hover:bg-muted/40 border-b border-border/40 group transition-colors">
                                    <TableCell className="font-mono text-xs font-medium text-foreground">
                                        #{job.id}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                        <div className="flex items-center gap-2">
                                            <Workflow className="h-3 w-3 text-muted-foreground" />
                                            {job.pipeline_name || `Pipeline ${job.pipeline_id}`}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={job.status} />
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                                        {job.duration_ms ? `${(job.duration_ms / 1000).toFixed(2)}s` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                                        {format(new Date(job.started_at), 'HH:mm:ss')}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Logs</DropdownMenuItem>
                                                <DropdownMenuItem>Rerun</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                        <Database className="h-8 w-8 opacity-20" />
                                        <span className="text-sm">No recent activity recorded</span>
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
