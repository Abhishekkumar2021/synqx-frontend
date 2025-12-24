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
            <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden rounded-[2rem] border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 dark:ring-white/10">
                
                <DialogHeader className="p-6 pb-4 border-b border-border/40 shrink-0 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20">
                            <Settings2 className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">Pipeline Configuration</DialogTitle>
                            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                Entity: {pipeline?.name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex min-h-0">
                    {/* Compact Sidebar */}
                    <div className="w-[180px] border-r border-border/40 bg-muted/10 p-4 flex flex-col gap-1 shrink-0 relative z-10">
                        {[
                            { id: "general", label: "General", icon: FileText },
                            { id: "automation", label: "Automation", icon: Activity },
                            { id: "performance", label: "Performance", icon: Zap },
                            { id: "governance", label: "Governance", icon: ShieldAlert },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 group",
                                    activeTab === item.id 
                                        ? "bg-primary text-primary-foreground shadow-md" 
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <item.icon className={cn("h-4 w-4", activeTab === item.id ? "text-primary-foreground" : "text-primary/60")} />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
                        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                            <form id="settings-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {activeTab === "general" && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Identifier</Label>
                                            <Input 
                                                {...register('name', { required: true })} 
                                                className="h-11 rounded-xl bg-background border-border/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all font-bold"
                                                placeholder="Pipeline name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Description</Label>
                                            <Textarea 
                                                {...register('description')} 
                                                className="min-h-[120px] rounded-xl bg-background border-border/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all text-sm p-4 resize-none leading-relaxed"
                                                placeholder="Enter purpose of this pipeline..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "automation" && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: "Hourly", value: "0 * * * *", icon: <Clock className="h-4 w-4" /> },
                                                { label: "Daily", value: "0 0 * * *", icon: <CalendarClock className="h-4 w-4" /> },
                                                { label: "Weekly", value: "0 0 * * 0", icon: <Activity className="h-4 w-4" /> },
                                            ].map((preset) => (
                                                <button
                                                    key={preset.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setValue('schedule_cron', preset.value);
                                                        setValue('schedule_enabled', true);
                                                        toast.success(`Set to ${preset.label}`);
                                                    }}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all active:scale-95",
                                                        scheduleCron === preset.value && scheduleEnabled 
                                                            ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20 text-primary" 
                                                            : "bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/30"
                                                    )}
                                                >
                                                    {preset.icon}
                                                    <span className="text-[9px] font-bold uppercase">{preset.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className={cn(
                                            "rounded-2xl border transition-all duration-300 overflow-hidden",
                                            scheduleEnabled ? "border-primary/20 bg-primary/5" : "border-border/40 bg-muted/10"
                                        )}>
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold">Enabled</Label>
                                                    <p className="text-[10px] text-muted-foreground font-medium">Automatic execution</p>
                                                </div>
                                                <Switch 
                                                    checked={scheduleEnabled}
                                                    onCheckedChange={(c) => setValue('schedule_enabled', c)}
                                                    className="data-[state=checked]:bg-primary"
                                                />
                                            </div>
                                            
                                            {scheduleEnabled && (
                                                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="p-4 bg-background rounded-xl border border-border/40 shadow-inner">
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
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Priority</Label>
                                                <Badge className="bg-primary/10 text-primary border-none font-bold px-3 py-0.5 rounded-full">{priority} / 10</Badge>
                                            </div>
                                            <Input 
                                                type="number" min={1} max={10}
                                                {...register('priority', { valueAsNumber: true })}
                                                className="h-11 rounded-xl bg-background border-border/60 font-bold"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Parallel Runs</Label>
                                                <Input 
                                                    type="number"
                                                    {...register('max_parallel_runs', { valueAsNumber: true })}
                                                    className="h-11 rounded-xl bg-background border-border/60 font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Retries</Label>
                                                <Input 
                                                    type="number"
                                                    {...register('max_retries', { valueAsNumber: true })}
                                                    className="h-11 rounded-xl bg-background border-border/60 font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Timeout (Seconds)</Label>
                                            <Input 
                                                type="number"
                                                {...register('execution_timeout_seconds', { valueAsNumber: true })}
                                                className="h-11 rounded-xl bg-background border-border/60 font-bold"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "governance" && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="p-6 bg-muted/30 rounded-3xl border border-border/40 mb-4 text-muted-foreground">
                                            <ShieldAlert className="h-8 w-8 opacity-40" />
                                        </div>
                                        <h3 className="font-bold text-sm">Access Control</h3>
                                        <p className="text-[10px] text-muted-foreground max-w-[200px] mt-1 font-medium">
                                            Inherited from global security context.
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-4 px-8 border-t border-border/40 bg-muted/10 shrink-0 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">ID: {pipeline?.id}</span>
                            <div className="flex gap-2">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-xl h-9 px-4 text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    form="settings-form"
                                    type="submit" 
                                    disabled={mutation.isPending}
                                    className="rounded-xl h-9 px-6 text-xs font-bold shadow-sm"
                                >
                                    {mutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : "Save Changes"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
