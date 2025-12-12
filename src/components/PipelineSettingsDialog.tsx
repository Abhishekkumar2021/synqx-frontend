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
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label'; // Use Label primitive
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea'; // Use Textarea for description
import { CronBuilder } from './CronBuilder';
import { type Pipeline } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePipeline } from '../lib/api';
import { toast } from 'sonner';
import { Loader2, CalendarClock, Settings2 } from 'lucide-react';
import { Separator } from './ui/separator';

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
            setValue('schedule_cron', pipeline.schedule_cron || '0 0 * * *'); // Default to daily midnight
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
            <DialogContent className="sm:max-w-[600px] border-border/50 bg-background/95 backdrop-blur-xl gap-0 p-0 overflow-hidden rounded-2xl shadow-2xl">
                
                {/* Header */}
                <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-muted/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Settings2 className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>Pipeline Settings</DialogTitle>
                            <DialogDescription className="mt-1.5">
                                Manage configuration and automation schedules.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                    <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh] custom-scrollbar">
                        
                        {/* --- General Section --- */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">General Information</h4>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Pipeline Name</Label>
                                    <Input 
                                        id="name" 
                                        {...register('name', { required: true })} 
                                        className="bg-background/50 border-border/50 focus:border-primary/50"
                                        placeholder="e.g. Daily ETL Process"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="desc">Description</Label>
                                    <Textarea 
                                        id="desc"
                                        {...register('description')} 
                                        className="bg-background/50 border-border/50 focus:border-primary/50 min-h-20 resize-none"
                                        placeholder="Describe the purpose of this workflow..."
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-border/50" />

                        {/* --- Automation Section --- */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <CalendarClock className="h-4 w-4" /> Automation
                            </h4>
                            
                            <div className="rounded-xl border border-border/50 bg-card/50 p-1">
                                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Enable Schedule</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Trigger runs automatically based on cron.
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={scheduleEnabled}
                                        onCheckedChange={(c) => setValue('schedule_enabled', c)}
                                    />
                                </div>

                                {scheduleEnabled && (
                                    <div className="px-3 pb-3 pt-1 animate-in fade-in slide-in-from-top-1">
                                        <CronBuilder 
                                            value={scheduleCron} 
                                            onChange={(val) => setValue('schedule_cron', val)} 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="p-4 border-t border-border/50 bg-muted/5">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)}
                            className="hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={mutation.isPending}
                            className="shadow-lg shadow-primary/20 min-w-[100px]"
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