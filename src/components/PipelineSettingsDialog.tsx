import React from 'react';
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
import { Switch } from './ui/switch';
import { CronBuilder } from './CronBuilder';
import { type Pipeline } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePipeline } from '../lib/api';
import { toast } from 'sonner';

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
    const scheduleEnabled = watch('schedule_enabled');
    const scheduleCron = watch('schedule_cron');

    React.useEffect(() => {
        if (pipeline && open) {
            setValue('name', pipeline.name);
            setValue('description', pipeline.description || '');
            // @ts-ignore - schedule_enabled missing in frontend type but exists in backend
            setValue('schedule_enabled', pipeline.schedule_enabled || !!pipeline.schedule_interval);
            setValue('schedule_cron', pipeline.schedule_interval || '* * * * *');
        }
    }, [pipeline, open, setValue]);

    const mutation = useMutation({
        mutationFn: (data: SettingsFormData) => {
            if (!pipeline) throw new Error("No pipeline selected");
            return updatePipeline(pipeline.id, {
                ...data,
                // Only send cron if enabled or if we want to save it even when disabled (usually yes)
                schedule_cron: data.schedule_cron
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pipelines'] });
            if (pipeline) queryClient.invalidateQueries({ queryKey: ['pipeline', pipeline.id.toString()] });
            toast.success("Pipeline settings updated");
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Pipeline Settings</DialogTitle>
                    <DialogDescription>
                        Configure general settings and scheduling for this pipeline.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input {...register('name', { required: true })} />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Input {...register('description')} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium">Enable Schedule</label>
                            <p className="text-xs text-muted-foreground">
                                Automatically trigger runs based on cron expression.
                            </p>
                        </div>
                        <Switch 
                            checked={scheduleEnabled}
                            onCheckedChange={(c) => setValue('schedule_enabled', c)}
                        />
                    </div>

                    {scheduleEnabled && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-medium">Schedule (Cron)</label>
                            <CronBuilder 
                                value={scheduleCron} 
                                onChange={(val) => setValue('schedule_cron', val)} 
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={mutation.isPending}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
