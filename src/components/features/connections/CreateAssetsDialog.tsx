/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type AssetBulkCreate, bulkCreateAssets } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, X, Database, Layers, ArrowRightLeft, Sparkles, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateAssetsDialogProps {
    connectionId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type FormValues = {
    assets: {
        name: string;
        asset_type: string;
        usageType: 'source' | 'destination';
    }[];
};

export const CreateAssetsDialog: React.FC<CreateAssetsDialogProps> = ({ connectionId, open, onOpenChange }) => {
    const queryClient = useQueryClient();
    const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        defaultValues: {
            assets: [{ name: '', asset_type: 'table', usageType: 'source' }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "assets"
    });
    
    useEffect(() => {
        if (open) {
            reset({ assets: [{ name: '', asset_type: 'table', usageType: 'source' }] });
        }
    }, [open, reset]);

    const mutation = useMutation({
        mutationFn: (payload: AssetBulkCreate) => bulkCreateAssets(connectionId, payload),
        onSuccess: (data) => {
            if (data.successful_creates > 0) {
                toast.success("Assets Created", {
                    description: `${data.successful_creates} assets successfully added to the registry.`,
                });
            }
            if (data.failed_creates > 0) {
                toast.warning("Partial Success", {
                    description: `${data.failed_creates} assets failed. Ensure names are unique.`,
                });
            }
            queryClient.invalidateQueries({ queryKey: ['assets', connectionId] });
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error("Operation Failed", {
                description: err.response?.data?.detail?.message || "Unexpected error during asset creation."
            });
        }
    });

    const onSubmit = (data: FormValues) => {
        const payload: AssetBulkCreate = {
            assets: data.assets.filter(a => a.name.trim() !== '').map(asset => ({
                name: asset.name,
                asset_type: asset.asset_type,
                is_source: asset.usageType === 'source',
                is_destination: asset.usageType === 'destination',
            })),
        };
        if (payload.assets.length === 0) {
            toast.error("Validation Error", { description: "Please provide at least one asset name." });
            return;
        }
        mutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-[2rem] border-border/60 glass-panel shadow-2xl backdrop-blur-3xl">
                <DialogHeader className="p-8 pb-6 border-b border-border/40 bg-muted/20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary ring-1 ring-border/50 shadow-sm">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold tracking-tight">Manual Asset Registration</DialogTitle>
                            <DialogDescription className="text-sm font-medium text-muted-foreground">
                                Add physical data entities like tables or files to your connection registry.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1">
                        <div className="p-8 pt-6 space-y-4">
                            <div className="grid grid-cols-12 gap-4 px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                <div className="col-span-6">Asset Physical Name</div>
                                <div className="col-span-3">Type</div>
                                <div className="col-span-2">Sync Usage</div>
                                <div className="col-span-1"></div>
                            </div>

                            <AnimatePresence initial={false}>
                                {fields.map((field, index) => (
                                    <motion.div
                                        key={field.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="grid grid-cols-12 gap-3 items-center group bg-muted/5 hover:bg-muted/20 p-2 rounded-2xl border border-border/20 transition-all"
                                    >
                                        <div className="col-span-6 relative">
                                            <Database className="z-20 absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                {...register(`assets.${index}.name`, { required: true })}
                                                placeholder="Table or file name..."
                                                className={cn(
                                                    "pl-9 h-10 rounded-xl bg-background/50 border-border/40 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium",
                                                    errors.assets?.[index]?.name && "border-destructive focus:ring-destructive/5"
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <Controller
                                                control={control}
                                                name={`assets.${index}.asset_type`}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/40 text-sm font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <SelectValue />
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            <SelectItem value="table">Table</SelectItem>
                                                            <SelectItem value="view">View</SelectItem>
                                                            <SelectItem value="file">File</SelectItem>
                                                            <SelectItem value="stream">Stream</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                             <Controller
                                                control={control}
                                                name={`assets.${index}.usageType`}
                                                render={({ field }) => (
                                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/40 text-sm font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <SelectValue />
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            <SelectItem value="source">Source</SelectItem>
                                                            <SelectItem value="destination">Destination</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                onClick={() => remove(index)}
                                                disabled={fields.length <= 1}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-12 rounded-2xl border-dashed border-border/60 bg-background/20 hover:bg-background/50 hover:border-primary/40 transition-all font-bold text-muted-foreground gap-2 mt-2"
                                onClick={() => append({ name: '', asset_type: 'table', usageType: 'source' })}
                            >
                                <Plus className="h-4 w-4" /> Add Row
                            </Button>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-8 border-t border-border/40 bg-muted/10 gap-3">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            className="rounded-xl h-11 px-6 font-bold"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            Save {fields.length} Asset{fields.length !== 1 ? 's' : ''}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
