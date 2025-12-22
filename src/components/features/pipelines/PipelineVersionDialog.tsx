import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getPipelineVersions, 
    publishPipelineVersion, 
    triggerPipeline
} from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    History as HistoryIcon, 
    Play, 
    Clock, 
    ArrowUpCircle,
    Loader2,
    Database,
    Share2,
    Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface PipelineVersionDialogProps {
    pipelineId: number;
    pipelineName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const PipelineVersionDialog: React.FC<PipelineVersionDialogProps> = ({
    pipelineId,
    pipelineName,
    open,
    onOpenChange,
}) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: versions, isLoading } = useQuery({
        queryKey: ['pipeline-versions', pipelineId],
        queryFn: () => getPipelineVersions(pipelineId),
        enabled: open,
    });

    const publishMutation = useMutation({
        mutationFn: (versionId: number) => publishPipelineVersion(pipelineId, versionId),
        onSuccess: () => {
            toast.success("Version Published", {
                description: "The pipeline has been rolled back/updated to this version."
            });
            queryClient.invalidateQueries({ queryKey: ['pipeline-versions', pipelineId] });
            queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId.toString()] });
        },
        onError: (err: any) => {
            toast.error("Publish Failed", {
                description: err.response?.data?.detail?.message || "Could not publish version."
            });
        }
    });

    const runMutation = useMutation({
        mutationFn: (versionId: number) => triggerPipeline(pipelineId, versionId),
        onSuccess: (data) => {
            toast.success("Execution Started", {
                description: `Running version of pipeline. Job ID: ${data.job_id}`
            });
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error("Run Failed", {
                description: err.response?.data?.detail?.message || "Could not trigger pipeline."
            });
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-border/20 bg-background/80 backdrop-blur-3xl shadow-[0_0_80px_-15px_rgba(0,0,0,0.6)] rounded-[2.5rem] ring-1 ring-white/5">
                
                {/* Immersive Background Gradients - Adjusted for App Theme */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/15 blur-[140px] rounded-full opacity-60" />
                    <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-primary/5 blur-[140px] rounded-full opacity-40" />
                </div>

                <DialogHeader className="p-10 pb-6 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <DialogTitle className="text-4xl font-black tracking-tight flex items-center gap-4">
                                <div className="p-3.5 bg-primary/10 rounded-2xl ring-1 ring-primary/30 shadow-2xl">
                                    <HistoryIcon className="h-7 w-7 text-primary" />
                                </div>
                                Snapshot Registry
                            </DialogTitle>
                            <DialogDescription className="text-base font-medium text-muted-foreground/60">
                                Browse and restore historical states for <span className="text-primary font-bold"> {pipelineName} </span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-10 py-2 custom-scrollbar relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="relative">
                                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <HistoryIcon className="h-5 w-5 text-primary animate-pulse" />
                                </div>
                            </div>
                            <p className="text-sm font-bold tracking-[0.2em] uppercase text-muted-foreground opacity-50">Synchronizing History</p>
                        </div>
                    ) : versions?.length === 0 ? (
                        <div className="text-center py-20 bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-border/40 m-4">
                            <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Clock className="h-10 w-10 text-muted-foreground/20" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground/80 mb-2">No History Found</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
                                This pipeline hasn't been versioned yet. Deploy your first changes to see snapshots here.
                            </p>
                        </div>
                    ) : (
                        <div className="relative space-y-6 pb-12">
                            {/* Vertical Line for Timeline */}
                            <div className="absolute left-[31px] top-8 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/10 to-transparent hidden md:block opacity-50" />

                            {versions?.map((version, index) => (
                                <div 
                                    key={version.id}
                                    className={cn(
                                        "group relative flex items-start gap-6 p-6 rounded-[2rem] border transition-all duration-500",
                                        version.is_published 
                                            ? "bg-primary/[0.05] border-primary/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] scale-[1.02] z-10" 
                                            : "bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.03] hover:border-primary/20"
                                    )}
                                >
                                    {/* Version Dot/Indicator */}
                                    <div className={cn(
                                        "hidden md:flex h-16 w-16 shrink-0 rounded-[1.5rem] items-center justify-center border-2 transition-all duration-500 z-10",
                                        version.is_published 
                                            ? "bg-primary text-primary-foreground shadow-[0_10px_20px_-5px_rgba(var(--primary-rgb),0.4)] border-primary" 
                                            : "bg-background/60 border-border/40 text-muted-foreground group-hover:border-primary/50 group-hover:text-primary group-hover:scale-110"
                                    )}>
                                        <span className="text-xl font-black italic">v{version.version}</span>
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className="md:hidden font-black text-2xl text-primary">v{version.version}</span>
                                                {version.is_published && (
                                                    <Badge className="bg-primary hover:bg-primary text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-full shadow-lg shadow-primary/20 animate-pulse">
                                                        Live Now
                                                    </Badge>
                                                )}
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                                    <Clock className="h-3.5 w-3.5 text-primary/70" />
                                                    {format(new Date(version.created_at), 'MMM d, yyyy · HH:mm')}
                                                </div>
                                            </div>
                                            
                                            {/* Action Group */}
                                            <div className="flex items-center gap-1.5">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    navigate(`/pipelines/${pipelineId}?version=${version.version}`);
                                                                    onOpenChange(false);
                                                                }}
                                                                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Inspect Snapshot</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => runMutation.mutate(version.id)}
                                                                disabled={runMutation.isPending || publishMutation.isPending}
                                                                className="h-9 w-9 rounded-xl hover:bg-success/10 hover:text-success transition-all active:scale-90"
                                                            >
                                                                {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Run Version {version.version}</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {!version.is_published && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => publishMutation.mutate(version.id)}
                                                                    disabled={publishMutation.isPending || runMutation.isPending}
                                                                    className="h-9 w-9 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all active:scale-90"
                                                                >
                                                                    {publishMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Restore this Version</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="flex items-center gap-4 text-[11px] font-black text-muted-foreground/50 uppercase tracking-[0.15em]">
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 group-hover:border-primary/20 transition-colors">
                                                    <Database className="h-3.5 w-3.5 text-primary" />
                                                    <span className="text-foreground/70">{version.node_count} Nodes</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 group-hover:border-primary/20 transition-colors">
                                                    <Share2 className="h-3.5 w-3.5 text-primary" />
                                                    <span className="text-foreground/70">{version.edge_count} Edges</span>
                                                </div>
                                            </div>
                                            
                                            <div className="hidden lg:flex flex-1 items-center gap-3 text-xs font-semibold text-muted-foreground/30">
                                                <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                                                <span className="group-hover:text-muted-foreground/50 transition-colors italic">Immutable Snapshot</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Connecting line to next item if not last */}
                                    {index < versions.length - 1 && (
                                        <div className="absolute left-[31px] bottom-[-24px] h-6 w-px bg-primary/20 hidden md:block opacity-30" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};