/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
    CheckCircle2, Clock, Database, Zap,
    ArrowRight, Activity, Terminal, AlertCircle,
    RefreshCcw, RefreshCw, Cpu, HardDrive, History, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useJobTelemetry } from '@/hooks/useJobTelemetry';

interface JobSummaryProps {
    job: any;
    run: any;
}

// Fetch watermark for a specific pipeline+asset
const useWatermark = (pipelineId: number, assetId?: number) => {
    return useQuery({
        queryKey: ['watermark', pipelineId, assetId],
        queryFn: async () => {
            try {
                const { data } = await api.get(`/pipelines/${pipelineId}/watermarks/${assetId}`);
                return data;
            } catch (e) {
                return null;
            }
        },
        enabled: !!assetId && !!pipelineId,
        staleTime: 10000,
    });
};

const WatermarkBadge = ({ pipelineId, assetId }: { pipelineId: number, assetId?: number }) => {
    const { data: wm, isLoading } = useWatermark(pipelineId, assetId);

    if (isLoading) return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/20 border border-border/20">
            <div className="h-3 w-3 rounded-full bg-muted-foreground/20 animate-pulse" />
            <div className="h-3 w-16 bg-muted-foreground/10 rounded" />
        </div>
    );

    if (!wm || !wm.last_value) return null;

    const keys = Object.keys(wm.last_value);
    if (keys.length === 0) return null;

    const key = keys[0];
    const val = wm.last_value[key];

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10">
            <History className="h-3 w-3 text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
                <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/60 leading-none mb-0.5 truncate">
                    Sync Offset: {key}
                </span>
                <span className="text-[10px] font-black text-primary truncate max-w-[150px] leading-none">
                    {String(val)}
                </span>
            </div>
        </div>
    );
};

const formatBytes = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDuration = (ms: number | null) => {
    if (ms === null || ms === undefined) return '—';
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
};

export const JobSummary: React.FC<JobSummaryProps> = ({ job, run }) => {
    const isSuccess = job.status === 'success';
    const isFailed = job.status === 'failed';
    const isRunning = job.status === 'running' || job.status === 'pending';
    const isCancelled = job.status === 'cancelled';

    const steps = run?.step_runs || [];

    // Prefer live metrics from run object (which is patched/invalidated by telemetry)
    // but fallback to step calculation if needed.
    const totalNodes = run?.total_nodes || steps.length || 0;
    const completedSteps = run?.completed_steps !== undefined
        ? run.completed_steps
        : steps.filter((s: any) => s.status === 'success' || s.status === 'completed').length;

    const progress = totalNodes > 0 ? (completedSteps / totalNodes) * 100 : 0;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10 animate-in fade-in duration-700">
            {/* --- Premium Status Banner --- */}
            <div className={cn(
                "relative overflow-hidden rounded-[3rem] border-2 p-10 transition-all duration-500",
                isSuccess ? "bg-emerald-500/5 border-emerald-500/20 shadow-2xl shadow-emerald-500/10" :
                    isFailed ? "bg-destructive/5 border-destructive/20 shadow-2xl shadow-destructive/10" :
                        isCancelled ? "bg-amber-500/5 border-amber-500/20 shadow-2xl shadow-amber-500/10" :
                            "bg-primary/5 border-primary/20 shadow-2xl shadow-primary/10"
            )}>
                {/* Dynamic Gradient Background (Static for clarity) */}
                <div className={cn(
                    "absolute -right-32 -top-32 h-96 w-96 rounded-full blur-[120px] opacity-20",
                    isSuccess ? "bg-emerald-500" : isFailed ? "bg-destructive" : isCancelled ? "bg-amber-500" : "bg-primary"
                )} />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="flex flex-col gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border",
                                    isSuccess ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                        isFailed ? "bg-destructive/10 text-destructive border-destructive/20" :
                                            isCancelled ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                "bg-primary/10 text-primary border-primary/20"
                                )}>
                                    System Status: {job.status}
                                </div>
                                {isRunning && (
                                    <div className="flex items-center gap-2.5 select-none">

                                        {/* Pulse ring */}
                                        <span className="relative flex h-3 w-3">
                                            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
                                            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                                        </span>

                                        {/* Label */}
                                        <span className="text-[10px] font-semibold text-primary/90 uppercase tracking-[0.18em]">
                                            Live Sync
                                        </span>

                                        {/* Subtle animated dot trail */}
                                        <span className="flex gap-1 ml-1">
                                            <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" />
                                        </span>
                                    </div>
                                )}

                            </div>
                            <h2 className="text-4xl font-black tracking-tighter text-foreground leading-none uppercase">
                                Pipeline Execution
                            </h2>
                            <p className="text-sm font-medium text-muted-foreground max-w-lg leading-relaxed opacity-80">
                                {isSuccess ? "All orchestration stages completed successfully. Data flows have been validated and offsets persisted." :
                                    isFailed ? `Execution was interrupted. ${run?.error_message || "The system encountered a critical error during node processing."}` :
                                        isCancelled ? "This execution was manually terminated by a system operator." :
                                            "Orchestrator is actively processing the pipeline graph. Real-time telemetry is being streamed below."}
                            </p>
                        </div>
                    </div>

                    {/* Progress Visualizer Ring (Only for running/pending) */}
                    <div className="flex flex-col items-center md:items-end gap-6 shrink-0">
                        {isRunning ? (
                            <div className="relative h-28 w-28 flex items-center justify-center">
                                <svg className="h-full w-full -rotate-90">
                                    <circle
                                        cx="56" cy="56" r="50"
                                        className="stroke-muted/10 fill-none"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="56" cy="56" r="50"
                                        className="stroke-primary fill-none transition-all duration-1000 ease-in-out"
                                        strokeWidth="8"
                                        strokeDasharray={314}
                                        strokeDashoffset={314 - (314 * progress) / 100}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black tracking-tighter">{Math.round(progress)}%</span>
                                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Progress</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-end gap-2">
                                <div className="h-14 w-14 rounded-3xl bg-background/50 border border-border/40 flex items-center justify-center shadow-xl backdrop-blur-md">
                                    {isSuccess ? <CheckCircle2 className="h-7 w-7 text-emerald-500" /> :
                                        isFailed ? <XCircle className="h-7 w-7 text-destructive" /> :
                                            <AlertCircle className="h-7 w-7 text-amber-500" />}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                    Final State Reached
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar for Active Jobs */}
                {isRunning && (
                    <div className="mt-10 space-y-4">
                        <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                            <span className="text-muted-foreground">Orchestration Progress</span>
                            <span className="text-primary">{completedSteps} / {totalNodes} Nodes Complete</span>
                        </div>
                        <div className="relative h-2.5 w-full rounded-full bg-primary/10 overflow-hidden shadow-inner border border-primary/5">
                            <div
                                className="h-full bg-primary transition-all duration-1000 ease-in-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* --- High-Impact Metrics Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: "Data Throughput", value: formatBytes(run?.bytes_processed || 0), icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                    { label: "Volume Processed", value: (run?.total_loaded || 0).toLocaleString(), icon: Database, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                    { label: "Execution Latency", value: formatDuration(job.execution_time_ms), icon: Clock, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                ].map((stat, i) => (
                    <div key={i} className={cn(
                        "group relative p-8 rounded-[2.5rem] border bg-card/40 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 shadow-xl hover:shadow-2xl",
                        stat.border
                    )}>
                        <div className="flex items-center gap-6">
                            <div className={cn("p-4 rounded-[1.5rem] ring-1 ring-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500", stat.bg, stat.color)}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</p>
                                <p className="text-2xl font-black tracking-tighter text-foreground">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- Execution Logic Trace --- */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-muted/10 border border-border/20 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-muted-foreground/60" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground opacity-80">Logic Orchestration Trace</h3>
                    </div>
                    <Badge variant="secondary" className="rounded-xl h-8 px-4 font-black text-[10px] uppercase tracking-widest border border-border/40">
                        {steps.length} {steps.length === 1 ? 'Node' : 'Nodes'} Configured
                    </Badge>
                </div>

                <div className="relative grid grid-cols-1 gap-6 pl-4">
                    {/* Vertical Timeline Bar */}
                    <div className="absolute left-9 top-10 bottom-10 w-0.5 bg-linear-to-b from-primary/30 via-border/20 to-transparent" />

                    {steps.length > 0 ? steps.map((step: any, idx: number) => {
                        const stepIsActive = step.status === 'running' || step.status === 'processing';
                        const stepIsSuccess = step.status === 'success' || step.status === 'completed';
                        const stepIsFailed = step.status === 'failed';

                        return (
                            <div
                                key={step.id}
                                className={cn(
                                    "group relative flex gap-8 p-1 transition-all duration-500",
                                    stepIsActive && "translate-x-1"
                                )}
                            >
                                {/* Timeline Node */}
                                <div className="relative z-10 shrink-0 mt-6">
                                    <div className={cn(
                                        "h-10 w-10 rounded-2xl flex items-center justify-center shadow-2xl ring-2 ring-background transition-all duration-500",
                                        stepIsSuccess ? "bg-emerald-500 text-white" :
                                            stepIsFailed ? "bg-destructive text-white" :
                                                stepIsActive ? "bg-primary text-white shadow-primary/40" :
                                                    "bg-muted/80 text-muted-foreground border border-border/40"
                                    )}>
                                        {stepIsSuccess ? <CheckCircle2 className="h-5 w-5" /> :
                                            stepIsFailed ? <AlertCircle className="h-5 w-5" /> :
                                                stepIsActive ? <RefreshCw className="h-5 w-5 animate-spin" /> :
                                                    <span className="text-xs font-black">{idx + 1}</span>}
                                    </div>
                                    {stepIsActive && (
                                        <div className="absolute -inset-2 bg-primary/10 rounded-3xl blur-md -z-10" />
                                    )}
                                </div>

                                {/* Step Content Card */}
                                <div className={cn(
                                    "flex-1 p-8 rounded-[2.5rem] border transition-all duration-500 shadow-xl hover:shadow-2xl relative overflow-hidden group/card",
                                    stepIsActive ? "bg-primary/5 border-primary/30 ring-1 ring-primary/10" :
                                        stepIsFailed ? "bg-destructive/5 border-destructive/20" :
                                            "bg-card/40 border-border/40 hover:bg-muted/10 hover:border-border/60"
                                )}>
                                    {/* Static Glow for Active Nodes (removed pulse) */}
                                    {stepIsActive && (
                                        <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-transparent to-primary/5 opacity-50" />
                                    )}

                                    {/* Node Header */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner border transition-transform duration-500 group-hover/card:scale-110",
                                                stepIsSuccess ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                    stepIsFailed ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                        stepIsActive ? "bg-primary/10 text-primary border-primary/20" :
                                                            "bg-muted/30 text-muted-foreground border-border/40"
                                            )}>
                                                {step.operator_type?.toLowerCase() === 'extract' ? <Database className="h-6 w-6" /> :
                                                    step.operator_type?.toLowerCase() === 'transform' ? <Zap className="h-6 w-6" /> :
                                                        step.operator_type?.toLowerCase() === 'load' ? <ArrowRight className="h-6 w-6" /> :
                                                            <Activity className="h-6 w-6" />}
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-xl tracking-tighter uppercase text-foreground/90">
                                                        {step.operator_type || 'Logic'} <span className="text-muted-foreground/40 font-medium">Node</span>
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] font-mono font-black px-2 py-0.5 rounded-lg border-border/40 bg-background/40">#{step.node_id}</Badge>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                                                        stepIsSuccess ? "bg-emerald-500/10 text-emerald-500" :
                                                            stepIsFailed ? "bg-destructive/10 text-destructive" :
                                                                stepIsActive ? "bg-primary/10 text-primary" :
                                                                    "bg-muted/20 text-muted-foreground/60"
                                                    )}>
                                                        {stepIsActive && <RefreshCw className="h-2.5 w-2.5 animate-spin" />}
                                                        {step.status}
                                                    </div>
                                                    <span className="h-1 w-1 rounded-full bg-border" />
                                                    <span className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3 opacity-60" />
                                                        {formatDuration(step.duration_seconds * 1000)} Latency
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            {step.source_asset_id && (
                                                <WatermarkBadge pipelineId={job.pipeline_id} assetId={step.source_asset_id} />
                                            )}
                                            {step.retry_count > 0 && (
                                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-2 px-3 h-8 rounded-xl font-black text-[10px] uppercase">
                                                    <RefreshCcw className="h-3 w-3" />
                                                    {step.retry_count} {step.retry_count === 1 ? 'Retry' : 'Retries'}
                                                </Badge>
                                            )}
                                            <div className="h-8 w-8 rounded-xl bg-background/40 border border-border/40 flex items-center justify-center text-[10px] font-black text-muted-foreground/40">
                                                {idx + 1}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Records Flow Visualization */}
                                    <div className="bg-muted/10 rounded-[2rem] p-6 mb-8 border border-border/20 relative z-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between px-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                                                        <Database className="h-3.5 w-3.5" /> Ingress Records
                                                    </span>
                                                    <span className="text-sm font-black font-mono">{(step.records_in || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="h-1.5 w-full rounded-full bg-muted/20 overflow-hidden shadow-inner">
                                                    <div
                                                        className={cn("h-full bg-blue-500 transition-all duration-1000")}
                                                        style={{ width: '100%' }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between px-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                                                        <ArrowRight className="h-3.5 w-3.5" /> Egress Records
                                                    </span>
                                                    <span className="text-sm font-black font-mono">{(step.records_out || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="h-1.5 w-full rounded-full bg-muted/20 overflow-hidden shadow-inner">
                                                    <div
                                                        className={cn("h-full bg-emerald-500 transition-all duration-1000")}
                                                        style={{ width: step.records_in > 0 ? `${Math.min((step.records_out / step.records_in) * 100, 100)}%` : '100%' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* System Resource Metrics */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                                        <div className="p-4 rounded-2xl bg-background/40 border border-border/20 flex flex-col gap-3 hover:border-primary/20 transition-all group/stat shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1.5">
                                                    <Zap className="h-3 w-3" /> IO Data
                                                </span>
                                                <span className="text-[10px] font-black font-mono text-foreground/80">{formatBytes(step.bytes_processed)}</span>
                                            </div>
                                            <div className="h-1 w-full bg-muted/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500/40 w-full" />
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-background/40 border border-border/20 flex flex-col gap-3 hover:border-primary/20 transition-all group/stat shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1.5">
                                                    <Cpu className="h-3 w-3" /> CPU Load
                                                </span>
                                                <span className="text-[10px] font-black font-mono text-primary">{step.cpu_percent || 0}%</span>
                                            </div>
                                            <Progress value={step.cpu_percent || 0} className="h-1 bg-primary/10" />
                                        </div>
                                        <div className="p-4 rounded-2xl bg-background/40 border border-border/20 flex flex-col gap-3 hover:border-primary/20 transition-all group/stat shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1.5">
                                                    <HardDrive className="h-3 w-3" /> Memory
                                                </span>
                                                <span className="text-[10px] font-black font-mono text-blue-500">{step.memory_mb || 0} MB</span>
                                            </div>
                                            <Progress value={Math.min(((step.memory_mb || 0) / 8192) * 100, 100)} className="h-1 bg-blue-500/10" />
                                        </div>
                                    </div>

                                    {/* Error sub-card if this specific step failed */}
                                    {stepIsFailed && step.error_message && (
                                        <div className="mt-6 p-5 rounded-2xl bg-destructive/10 border border-destructive/20 animate-in slide-in-from-top-2 duration-300">
                                            <p className="text-[10px] font-black text-destructive uppercase mb-2 flex items-center gap-2">
                                                <AlertCircle className="h-3.5 w-3.5" /> Node Execution Failure
                                            </p>
                                            <p className="text-xs font-bold text-destructive/90 leading-relaxed font-mono whitespace-pre-wrap">
                                                {step.error_message}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/30 border-2 border-dashed border-border/40 rounded-[3rem] space-y-4">
                            <div className="p-6 rounded-3xl bg-muted/10 border border-border/20">
                                <Terminal className="h-10 w-10 opacity-40" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em]">Awaiting Orchestration Trace...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Global Error Orchestration Card --- */}
            {isFailed && run?.error_message && (
                <div className="rounded-[3rem] border-2 border-destructive/30 bg-destructive/5 overflow-hidden shadow-2xl shadow-destructive/5">
                    <div className="bg-destructive/10 px-8 py-4 flex items-center justify-between border-b border-destructive/20">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-destructive">Global Failure Trace</span>
                        </div>
                        <Badge variant="destructive" className="rounded-lg font-black text-[9px] uppercase tracking-widest">Critical</Badge>
                    </div>
                    <div className="p-8">
                        <pre className="font-mono text-xs text-destructive/90 bg-black/40 p-6 rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed ring-1 ring-white/5 shadow-inner">
                            {run.error_message}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};