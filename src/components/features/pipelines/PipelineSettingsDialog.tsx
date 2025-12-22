/* eslint-disable react-hooks/incompatible-library */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
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
    Info
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
            toast.success("Configuration Optimized", {
                description: "Pipeline parameters have been updated successfully."
            });
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
            <DialogContent className="sm:max-w-[750px] bg-background/60 backdrop-blur-3xl border-border/20 shadow-[0_0_80px_-15px_rgba(0,0,0,0.6)] p-0 gap-0 overflow-hidden rounded-[2.5rem] ring-1 ring-white/5">
                
                {/* Visual Background Accents */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full opacity-50" />
                    <div className="absolute -bottom-[10%] -left-[5%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full opacity-30" />
                </div>

                <div className="flex h-[600px] relative z-10">
                    {/* Sidebar Navigation */}
                    <div className="w-[220px] border-r border-white/5 bg-black/20 backdrop-blur-md p-6 flex flex-col gap-2">
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <div className="p-2 bg-primary/10 rounded-xl ring-1 ring-primary/30">
                                <Settings2 className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-black tracking-tight text-lg">Registry</span>
                        </div>

                        <nav className="space-y-1">
                            {[
                                { id: "general", label: "General", icon: FileText },
                                { id: "automation", label: "Automation", icon: Activity },
                                { id: "performance", label: "Performance", icon: Zap },
                                { id: "governance", label: "Governance", icon: ShieldAlert },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                        activeTab === item.id 
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10" 
                                            : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-auto p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-2 mb-1">
                                <Info className="h-3 w-3 text-primary" />
                                <span className="text-[10px] font-black uppercase text-primary">System Note</span>
                            </div>
                            <p className="text-[10px] leading-relaxed text-muted-foreground/70 font-medium">
                                Changes to runtime parameters take effect on the next execution.
                            </p>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        <DialogHeader className="p-8 pb-4">
                            <DialogTitle className="text-2xl font-black tracking-tight">
                                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Config
                            </DialogTitle>
                            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
                                Configuring pipeline <span className="text-primary">{pipeline?.name}</span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
                            <form id="settings-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                {activeTab === "general" && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Pipeline Identifier</Label>
                                            <Input 
                                                {...register('name', { required: true })} 
                                                className="h-12 rounded-2xl bg-white/[0.03] border-white/5 focus:bg-white/[0.05] focus:border-primary/40 transition-all font-bold text-sm px-4"
                                                placeholder="e.g. CORE_PRODUCTION_ETL"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Manifest Description</Label>
                                            <Textarea 
                                                {...register('description')} 
                                                className="min-h-[150px] rounded-2xl bg-white/[0.03] border-white/5 focus:bg-white/[0.05] focus:border-primary/40 transition-all text-sm p-4 resize-none leading-relaxed"
                                                placeholder="Detail the operational intent of this sequence..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "automation" && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                                        <div className={cn(
                                            "rounded-[2rem] border transition-all duration-500 overflow-hidden",
                                            scheduleEnabled ? "border-primary/30 bg-primary/[0.02]" : "border-white/5 bg-white/[0.01]"
                                        )}>
                                            <div className="p-6 flex items-center justify-between bg-white/[0.02]">
                                                <div className="space-y-1">
                                                    <Label className="text-lg font-black tracking-tight">Autonomous Scheduling</Label>
                                                    <p className="text-xs text-muted-foreground/60 font-medium">Trigger executions based on a recurring chronometer.</p>
                                                </div>
                                                <Switch 
                                                    checked={scheduleEnabled}
                                                    onCheckedChange={(c) => setValue('schedule_enabled', c)}
                                                    className="scale-110 data-[state=checked]:bg-primary"
                                                />
                                            </div>
                                            
                                            {scheduleEnabled && (
                                                <div className="p-6 pt-2 animate-in fade-in zoom-in-95 duration-500">
                                                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5 shadow-2xl">
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
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Execution Priority</Label>
                                                <Badge className="bg-primary/20 text-primary border-none font-black px-3">{priority} / 10</Badge>
                                            </div>
                                            <Input 
                                                type="number"
                                                min={1}
                                                max={10}
                                                {...register('priority', { valueAsNumber: true })}
                                                className="h-12 rounded-2xl bg-white/[0.03] border-white/5 font-black px-4"
                                            />
                                            <p className="text-[10px] text-muted-foreground/40 italic font-medium">Higher priority sequences (1-10) are allocated worker resources first.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 pt-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Concurrency Limit</Label>
                                                <Input 
                                                    type="number"
                                                    {...register('max_parallel_runs', { valueAsNumber: true })}
                                                    className="h-12 rounded-2xl bg-white/[0.03] border-white/5 font-black px-4"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">TTL (Seconds)</Label>
                                                <Input 
                                                    type="number"
                                                    {...register('execution_timeout_seconds', { valueAsNumber: true })}
                                                    className="h-12 rounded-2xl bg-white/[0.03] border-white/5 font-black px-4"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "governance" && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center justify-center py-12 text-center">
                                        <div className="p-6 bg-white/[0.02] rounded-[2.5rem] border border-white/5 mb-6">
                                            <ShieldAlert className="h-12 w-12 text-primary opacity-20" />
                                        </div>
                                        <h3 className="text-lg font-black tracking-tight mb-2 opacity-80">RBAC & Guardrails</h3>
                                        <p className="text-xs text-muted-foreground/60 max-w-[280px] font-medium leading-relaxed">
                                            Governance and compliance settings are currently locked to global defaults.
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>

                        <DialogFooter className="p-8 border-t border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between sm:justify-between w-full">
                            <p className="hidden md:block text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                                Entity Node: {pipeline?.id}
                            </p>
                            <div className="flex gap-3">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-xl h-11 px-6 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                                >
                                    Discard
                                </Button>
                                <Button 
                                    form="settings-form"
                                    type="submit" 
                                    disabled={mutation.isPending}
                                    className="shadow-xl shadow-primary/20 min-w-[160px] rounded-xl h-11 font-black text-[10px] uppercase tracking-[0.2em] bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
                                >
                                    {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sync Changes"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};