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
import { Loader2, CalendarClock, Settings2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
            <DialogContent className="sm:max-w-[600px] border-white/10 bg-black/40 backdrop-blur-3xl gap-0 p-0 overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-white/10">
                
                {/* Header */}
                <DialogHeader className="p-8 pb-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/10">
                            <Settings2 className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Pipeline Settings</DialogTitle>
                            <DialogDescription className="mt-1 text-base text-muted-foreground/80">
                                Manage configuration and automation schedules.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                    <div className="p-8 space-y-8 overflow-y-auto max-h-[65vh] custom-scrollbar">
                        
                        {/* --- General Section --- */}
                        <div className="space-y-5">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">General Information</h4>
                            <div className="grid gap-5">
                                <div className="space-y-2.5">
                                    <Label htmlFor="name" className="text-sm font-semibold ml-1">Pipeline Name</Label>
                                    <Input 
                                        id="name" 
                                        {...register('name', { required: true })} 
                                        className="bg-white/5 border-white/5 focus:bg-white/10 focus:border-primary/50 h-11 rounded-2xl"
                                        placeholder="e.g. Daily ETL Process"
                                    />
                                </div>
                                
                                <div className="space-y-2.5">
                                    <Label htmlFor="desc" className="text-sm font-semibold ml-1">Description</Label>
                                    <Textarea 
                                        id="desc"
                                        {...register('description')} 
                                        className="bg-white/5 border-white/5 focus:bg-white/10 focus:border-primary/50 min-h-24 resize-none rounded-2xl p-4 text-sm"
                                        placeholder="Describe the purpose of this workflow..."
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        {/* --- Automation Section --- */}
                        <div className="space-y-5">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                                <CalendarClock className="h-4 w-4" /> Automation
                            </h4>
                            
                            <div className="rounded-3xl border border-white/5 bg-white/5 p-1.5 overflow-hidden">
                                <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors">
                                    <div className="space-y-1">
                                        <Label className="text-base font-semibold">Enable Schedule</Label>
                                        <p className="text-sm text-muted-foreground/80">
                                            Trigger runs automatically based on cron.
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={scheduleEnabled}
                                        onCheckedChange={(c) => setValue('schedule_enabled', c)}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                </div>

                                {scheduleEnabled && (
                                    <div className="px-4 pb-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                                            <CronBuilder 
                                                value={scheduleCron} 
                                                onChange={(val) => setValue('schedule_cron', val)} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="p-6 border-t border-white/5 bg-white/5 backdrop-blur-xl">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)}
                            className="hover:bg-white/10 rounded-xl h-11"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={mutation.isPending}
                            className="shadow-xl shadow-primary/20 min-w-[140px] rounded-xl h-11 font-semibold"
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