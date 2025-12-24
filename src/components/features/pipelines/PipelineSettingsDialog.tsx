/* eslint-disable react-hooks/incompatible-library */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; 
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea'; 
import { CronBuilder } from '@/components/common/CronBuilder';
import { type Pipeline, updatePipeline } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
    Loader2, Settings2, FileText, Activity, 
    ShieldAlert, Zap,
    CalendarClock, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PipelineSettingsDialogProps {
    pipeline: Pipeline | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface SettingsFormData {
    name: string;
    description: string;
    schedule_enabled: boolean;
    schedule_cron: string;
    max_parallel_runs: number;
    max_retries: number;
    execution_timeout_seconds: number | null;
    priority: number;
}

export const PipelineSettingsDialog: React.FC<PipelineSettingsDialogProps> = ({ pipeline, open, onOpenChange }) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("general");
    
    const { register, handleSubmit, setValue, watch, reset } = useForm<SettingsFormData>();
    
    const scheduleEnabled = watch('schedule_enabled');
    const scheduleCron = watch('schedule_cron');
    const priority = watch('priority') || 5;

    useEffect(() => {
        if (pipeline && open) {
            reset({
                name: pipeline.name,
                description: pipeline.description || '',
                schedule_enabled: pipeline.schedule_enabled || false,
                schedule_cron: pipeline.schedule_cron || '0 0 * * *',
                max_parallel_runs: pipeline.max_parallel_runs || 1,
                max_retries: pipeline.max_retries || 3,
                execution_timeout_seconds: pipeline.execution_timeout_seconds || 3600,
                priority: pipeline.priority || 5
            });
        }
    }, [pipeline, open, reset]);

    const mutation = useMutation({
        mutationFn: (data: SettingsFormData) => {
            if (!pipeline) throw new Error("No pipeline selected");
            return updatePipeline(pipeline.id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pipelines'] });
            if (pipeline) queryClient.invalidateQueries({ queryKey: ['pipeline', pipeline.id.toString()] });
            toast.success("Settings Synchronized");
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error("Update Failed", {
                description: err.response?.data?.detail?.message || "There was an error saving configurations."
            });
        }
    });

    const onSubmit = (data: SettingsFormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[700px] flex flex-col p-0 gap-0 overflow-hidden rounded-[2.5rem] border-border/60 bg-background/95 backdrop-blur-3xl shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                
                <DialogHeader className="p-8 pb-6 border-b border-border/40 shrink-0 bg-muted/20 relative overflow-hidden">
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary ring-1 ring-primary/20 shadow-xl shadow-primary/5">
                            <Settings2 className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Sequence Configuration</DialogTitle>
                            <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-1 flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-muted/50 border border-border/40">Entity</span>
                                <span className="text-foreground">{pipeline?.name}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex min-h-0">
                    {/* Modern Sidebar */}
                    <div className="w-[220px] border-r border-border/40 bg-muted/10 p-6 flex flex-col gap-2 shrink-0 relative z-10">
                        {[
                            { id: "general", label: "General Info", icon: FileText },
                            { id: "automation", label: "Scheduling", icon: Activity },
                            { id: "performance", label: "Compute & Scale", icon: Zap },
                            { id: "governance", label: "Governance", icon: ShieldAlert },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 group",
                                    activeTab === item.id 
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                        : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", activeTab === item.id ? "text-primary-foreground" : "text-primary/40")} />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background/50">
                        <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
                            <form id="settings-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                                {activeTab === "general" && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Identity Manifest</Label>
                                            <Input 
                                                {...register('name', { required: true })} 
                                                className="h-14 rounded-2xl bg-background/50 border-border/60 focus:border-primary/40 focus:ring-8 focus:ring-primary/5 transition-all font-black text-base shadow-inner"
                                                placeholder="Pipeline name"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Logical Description</Label>
                                            <Textarea 
                                                {...register('description')} 
                                                className="min-h-[180px] rounded-2xl bg-background/50 border-border/60 focus:border-primary/40 focus:ring-8 focus:ring-primary/5 transition-all text-sm p-5 resize-none leading-relaxed shadow-inner"
                                                placeholder="Explain the purpose and data flow of this pipeline..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "automation" && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { label: "Hourly", value: "0 * * * *", icon: <Clock className="h-5 w-5" /> },
                                                { label: "Daily", value: "0 0 * * *", icon: <CalendarClock className="h-5 w-5" /> },
                                                { label: "Weekly", value: "0 0 * * 0", icon: <Activity className="h-5 w-5" /> },
                                            ].map((preset) => (
                                                <button
                                                    key={preset.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setValue('schedule_cron', preset.value);
                                                        setValue('schedule_enabled', true);
                                                        toast.success(`Schedule: ${preset.label}`);
                                                    }}
                                                    className={cn(
                                                        "flex flex-col items-center gap-3 p-5 rounded-[1.5rem] border transition-all active:scale-95 group",
                                                        scheduleCron === preset.value && scheduleEnabled 
                                                            ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20 text-primary shadow-lg shadow-primary/5" 
                                                            : "bg-muted/20 border-border/40 text-muted-foreground/60 hover:border-primary/30 hover:bg-muted/40"
                                                    )}
                                                >
                                                    <div className={cn("p-2 rounded-xl transition-colors", scheduleCron === preset.value && scheduleEnabled ? "bg-primary/20" : "bg-muted/50")}>
                                                        {preset.icon}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{preset.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className={cn(
                                            "rounded-[2rem] border transition-all duration-500 overflow-hidden shadow-sm",
                                            scheduleEnabled ? "border-primary/30 bg-primary/[0.02]" : "border-border/40 bg-muted/10"
                                        )}>
                                            <div className="p-6 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <Label className="text-base font-black tracking-tight">Active Schedule</Label>
                                                    <p className="text-[11px] text-muted-foreground font-bold opacity-70">Automate sequence execution using cron syntax.</p>
                                                </div>
                                                <Switch 
                                                    checked={scheduleEnabled}
                                                    onCheckedChange={(c) => setValue('schedule_enabled', c)}
                                                    className="scale-110 data-[state=checked]:bg-primary shadow-xl shadow-primary/20"
                                                />
                                            </div>
                                            
                                            {scheduleEnabled && (
                                                <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                                    <div className="p-6 bg-background rounded-[1.5rem] border border-border/40 shadow-inner ring-1 ring-black/5">
                                                        <CronBuilder 
                                                            value={scheduleCron} 
                                                            onChange={(val) => setValue('schedule_cron', val)} 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "performance" && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Execution Priority</Label>
                                                <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1 rounded-full text-xs">{priority} / 10</Badge>
                                            </div>
                                            <Input 
                                                type="number" min={1} max={10}
                                                {...register('priority', { valueAsNumber: true })}
                                                className="h-14 rounded-2xl bg-background/50 border-border/60 font-black text-lg shadow-inner text-center"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Max Parallel Units</Label>
                                                <Input 
                                                    type="number"
                                                    {...register('max_parallel_runs', { valueAsNumber: true })}
                                                    className="h-14 rounded-2xl bg-background/50 border-border/60 font-black text-base shadow-inner px-6"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Auto-Retry Threshold</Label>
                                                <Input 
                                                    type="number"
                                                    {...register('max_retries', { valueAsNumber: true })}
                                                    className="h-14 rounded-2xl bg-background/50 border-border/60 font-black text-base shadow-inner px-6"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Execution Timeout (Seconds)</Label>
                                            <Input 
                                                type="number"
                                                {...register('execution_timeout_seconds', { valueAsNumber: true })}
                                                className="h-14 rounded-2xl bg-background/50 border-border/60 font-black text-base shadow-inner px-6"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "governance" && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in scale-in-95 duration-500">
                                        <div className="relative mb-8">
                                            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                                            <div className="relative p-8 bg-muted/20 rounded-[2.5rem] border border-border/40 text-muted-foreground shadow-2xl">
                                                <ShieldAlert className="h-12 w-12 opacity-40" />
                                            </div>
                                        </div>
                                        <h3 className="font-black text-xl tracking-tight">System Governance</h3>
                                        <p className="text-xs text-muted-foreground max-w-[280px] mt-2 font-bold leading-relaxed opacity-60">
                                            Role-based access controls and audit logging are managed at the organization level.
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-6 px-10 border-t border-border/40 bg-muted/20 shrink-0 flex items-center justify-between relative z-10 backdrop-blur-md">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Sequence ID</span>
                                <span className="text-[10px] font-mono font-bold text-muted-foreground/60">{pipeline?.id}</span>
                            </div>
                            <div className="flex gap-3">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-xl h-11 px-6 text-xs font-black uppercase tracking-widest hover:bg-destructive/10 hover:text-destructive transition-colors"
                                >
                                    Discard
                                </Button>
                                <Button 
                                    form="settings-form"
                                    type="submit" 
                                    disabled={mutation.isPending}
                                    className="rounded-xl h-11 px-8 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Commit Changes"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
