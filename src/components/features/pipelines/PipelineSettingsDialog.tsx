/* eslint-disable react-hooks/incompatible-library */
import React, { useEffect } from 'react';
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
import { type Pipeline } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePipeline } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Settings2, FileText, Activity } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
}

export const PipelineSettingsDialog: React.FC<PipelineSettingsDialogProps> = ({ pipeline, open, onOpenChange }) => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, setValue, watch } = useForm<SettingsFormData>();
    
    // Watch values for conditional rendering
    const scheduleEnabled = watch('schedule_enabled');
    const scheduleCron = watch('schedule_cron');

    // Reset form when pipeline changes or dialog opens
    useEffect(() => {
        if (pipeline && open) {
            setValue('name', pipeline.name);
            setValue('description', pipeline.description || '');
            setValue('schedule_enabled', pipeline.schedule_enabled || false);
            setValue('schedule_cron', pipeline.schedule_cron || '0 0 * * *'); 
        }
    }, [pipeline, open, setValue]);

    const mutation = useMutation({
        mutationFn: (data: SettingsFormData) => {
            if (!pipeline) throw new Error("No pipeline selected");
            return updatePipeline(pipeline.id, {
                ...data,
                schedule_cron: data.schedule_cron
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pipelines'] });
            if (pipeline) queryClient.invalidateQueries({ queryKey: ['pipeline', pipeline.id.toString()] });
            toast.success("Settings updated successfully");
            onOpenChange(false);
        },
        onError: (e) => {
            console.error(e);
            toast.error("Failed to update settings");
        }
    });

    const onSubmit = (data: SettingsFormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-background/80 backdrop-blur-2xl border-border/40 shadow-2xl p-0 gap-0 overflow-hidden">
                
                {/* Header */}
                <DialogHeader className="p-6 border-b border-border/40 bg-muted/10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                            <Settings2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                                Configuration 

[Image of settings gear icon]

                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                Adjust metadata and automation rules for <span className="font-medium text-foreground">{pipeline?.name}</span>.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                    <div className="p-6 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                        
                        {/* --- General Section --- */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                                <FileText className="h-3.5 w-3.5" /> General
                            </div>
                            
                            <div className="grid gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium text-foreground">Pipeline Name</Label>
                                    <Input 
                                        id="name" 
                                        {...register('name', { required: true })} 
                                        className="h-11 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/20 transition-all"
                                        placeholder="e.g. Daily ETL Process"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="desc" className="text-sm font-medium text-foreground">Description</Label>
                                    <Textarea 
                                        id="desc"
                                        {...register('description')} 
                                        className="min-h-[100px] resize-none rounded-xl bg-background/50 border-border/50 p-3 text-sm focus-visible:ring-primary/20 transition-all"
                                        placeholder="Describe the purpose, owner, or SLA of this workflow..."
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-border/40" />

                        {/* --- Automation Section --- */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                                <Activity className="h-3.5 w-3.5" /> Automation 
                            </div>
                            
                            {/* Grouped Settings Container (iOS Style) */}
                            <div className={cn(
                                "rounded-2xl border border-border/40 overflow-hidden transition-all duration-300",
                                scheduleEnabled ? "bg-muted/30" : "bg-card/40"
                            )}>
                                {/* Switch Row */}
                                <div className="flex items-center justify-between p-4 bg-background/40">
                                    <div className="space-y-1">
                                        <Label htmlFor="schedule-switch" className="text-base font-semibold text-foreground">Enable Schedule</Label>
                                        <p className="text-sm text-muted-foreground leading-snug">
                                            Run automatically on a recurring basis.
                                        </p>
                                    </div>
                                    <Switch 
                                        id="schedule-switch"
                                        checked={scheduleEnabled}
                                        onCheckedChange={(c) => setValue('schedule_enabled', c)}
                                        className="data-[state=checked]:bg-primary shadow-sm"
                                    />
                                </div>

                                {/* Collapsible Content */}
                                <div className={cn(
                                    "grid transition-all duration-300 ease-in-out",
                                    scheduleEnabled ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                )}>
                                    <div className="overflow-hidden">
                                        <div className="p-4 pt-0">
                                            <div className="bg-background/50 rounded-xl p-4 border border-border/30 shadow-sm">
                                                <CronBuilder 
                                                    value={scheduleCron} 
                                                    onChange={(val) => setValue('schedule_cron', val)} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="p-6 border-t border-border/40 bg-muted/10 backdrop-blur-xl">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl h-11 hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={mutation.isPending}
                            className="shadow-lg shadow-primary/20 min-w-[140px] rounded-xl h-11 font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {mutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};