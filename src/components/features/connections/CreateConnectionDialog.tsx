/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createConnection, type ConnectionCreate } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ShieldCheck, Lock, RefreshCw, CheckCircle2, Server
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Form,
    FormControl, 
    FormField, 
    FormItem, 
    FormMessage 
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
    DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { CONNECTOR_META, CONNECTOR_CONFIG_SCHEMAS, SafeIcon } from '@/lib/connector-definitions';

const connectionSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    type: z.string().min(1, "Connection type is required"),
    description: z.string().optional(),
    config: z.record(z.string(), z.any()),
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

interface CreateConnectionDialogProps {
    initialData?: any;
    onClose: () => void;
}

export const CreateConnectionDialog: React.FC<CreateConnectionDialogProps> = ({ initialData, onClose }) => {
    const isEditMode = !!initialData;
    const [step, setStep] = useState<'select' | 'configure'>('select');
    const [selectedType, setSelectedType] = useState<string | null>(initialData?.type || null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (initialData?.type) {
            setSelectedType(initialData.type);
            setStep('configure');
        }
    }, [initialData]);

    const form = useForm<ConnectionFormValues>({
        resolver: zodResolver(connectionSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            type: initialData?.type || '',
            config: initialData?.config || {}
        }
    });

    const configValues = form.watch('config') || {};

    const mutation = useMutation({
        mutationFn: (data: ConnectionFormValues) => createConnection(data as ConnectionCreate),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            toast.success(`Connection ${isEditMode ? 'updated' : 'created'} successfully`);
            onClose();
        },
        onError: (_err: any) => toast.error(`Failed to ${isEditMode ? 'update' : 'create'} connection`)
    });

    const handleSelect = (type: string) => {
        setSelectedType(type);
        form.setValue('type', type);
        if (!isEditMode) {
            const schema = CONNECTOR_CONFIG_SCHEMAS[type];
            if (schema) {
                const defaults: any = {};
                schema.fields?.forEach((f: any) => { if (f.defaultValue) defaults[f.name] = f.defaultValue; });
                form.setValue('config', defaults);
            }
        }
        setStep('configure');
    };

    // --- STEP 1: Selection ---
    if (step === 'select' && !isEditMode) {
        return (
            <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl">
                <DialogHeader className="px-8 py-6 border-b border-border/50 shrink-0 bg-muted/5">
                    <DialogTitle className="text-xl font-bold">Select a Connector</DialogTitle>
                    <DialogDescription>Choose your data source or destination to proceed.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-8 bg-muted/5 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                        {Object.entries(CONNECTOR_META).map(([key, meta]) => (
                            <button
                                key={key}
                                onClick={() => handleSelect(key)}
                                className="group relative flex flex-col items-center gap-4 p-6 rounded-[2rem] border border-white/10 bg-card hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 text-center overflow-hidden hover:-translate-y-1"
                            >
                                <div className={cn("p-5 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-background transition-colors shadow-inner", meta.color.replace('text-', 'text-opacity-80 text-'))}>
                                    <SafeIcon icon={meta.icon} className="h-8 w-8" />
                                </div>
                                <div className="space-y-1 z-10">
                                    <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{meta.name}</h4>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold opacity-70">{meta.category}</span>
                                </div>
                                {meta.popular && (
                                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">HOT</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- STEP 2: Configuration ---
    const meta = (selectedType && CONNECTOR_META[selectedType]) 
        ? CONNECTOR_META[selectedType] 
        : { name: selectedType || 'Unknown', icon: <Server />, description: 'Custom or deprecated connector type.', color: 'bg-muted text-muted-foreground' };
        
    const schema = selectedType ? CONNECTOR_CONFIG_SCHEMAS[selectedType] : null;

    return (
        <div className="flex h-full">
            {/* Sidebar for Dialog */}
            <div className="w-[300px] bg-muted/10 border-r border-border/50 p-8 hidden md:flex flex-col gap-8 shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/20 pointer-events-none" />
                
                <div className="z-10">
                    {!isEditMode && (
                        <Button 
                            variant="link" 
                            size="sm" 
                            className="-ml-4 mb-6 text-muted-foreground hover:text-primary transition-colors" 
                            onClick={() => setStep('select')}
                        >
                            &larr; Change Connector
                        </Button>
                    )}
                    <div className={cn("h-20 w-20 rounded-[1.5rem] flex items-center justify-center mb-6 border border-white/10 shadow-xl", meta?.color)}>
                        {/* SAFE CLONE usage */}
                        <SafeIcon icon={meta.icon} className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">{isEditMode ? 'Edit' : 'Configure'} {meta?.name}</h3>
                    <p className="text-sm text-muted-foreground mt-4 leading-relaxed font-medium opacity-80">{meta?.description}</p>
                </div>

                <div className="mt-auto space-y-4 z-10">
                     <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-600/80 dark:text-blue-400 backdrop-blur-sm">
                        <div className="flex items-center gap-2 font-bold mb-1.5 uppercase tracking-wide opacity-90">
                            <ShieldCheck className="h-3.5 w-3.5" /> Secure Storage
                        </div>
                        Credentials are encrypted at rest using AES-256 GCM.
                    </div>
                </div>
            </div>

            {/* Form Area */}
            <div className="flex-1 flex flex-col h-full bg-background/50 backdrop-blur-sm min-w-0">
                <DialogHeader className="px-8 py-6 border-b border-border/50 shrink-0">
                    <DialogTitle className="text-lg font-bold">Connection Details</DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* SAFE GUARD: Form Provider wraps everything */}
                    <Form {...form}>
                        <form id="conn-form" onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-10 max-w-lg mx-auto py-4">
                            
                            {/* General Section */}
                            <div className="space-y-6">
                                {/* Use standard HTML h4 for headers, NOT FormLabel */}
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-3 opacity-80">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold ring-2 ring-background">1</span>
                                    General Information
                                </h4>
                                <div className="grid gap-6 pl-9">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            {/* FIX: Using Label primitive instead of FormLabel to prevent context crash */}
                                            <Label className="text-sm font-semibold">Connection Name</Label>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Production DB" className="bg-background/40 border-white/10" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            {/* FIX: Using Label primitive */}
                                            <Label className="text-sm font-semibold">Description</Label>
                                            <FormControl>
                                                <Input {...field} placeholder="Optional context" className="bg-background/40 border-white/10" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

                            {/* Config Section */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-3 opacity-80">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold ring-2 ring-background">2</span>
                                    Credentials
                                </h4>
                                <div className="grid gap-6 pl-9">
                                    {schema?.fields?.map((field: any) => {
                                        // Dependency Check
                                        if (field.dependency) {
                                            const depVal = configValues[field.dependency.field];
                                            if (depVal !== field.dependency.value) return null;
                                        }
                                        return (
                                            <FormField key={field.name} control={form.control} name={`config.${field.name}`} render={({ field: f }) => (
                                                <FormItem>
                                                    {/* FIX: Using Label primitive */}
                                                    <Label className="text-sm font-semibold">{field.label}</Label>
                                                    <FormControl>
                                                        {field.type === 'select' ? (
                                                            <Select onValueChange={f.onChange} defaultValue={f.value}>
                                                                <SelectTrigger className="bg-background/40 border-white/10"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {field.options?.map((o: any) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <div className="relative">
                                                                <Input 
                                                                    {...f} 
                                                                    type={field.type} 
                                                                    placeholder={field.placeholder} 
                                                                    className={cn("bg-background/40 border-white/10", field.type === 'password' && 'pl-10')} 
                                                                />
                                                                {field.type === 'password' && (
                                                                    <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground opacity-70" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        );
                                    })}
                                    {(!schema?.fields || schema.fields.length === 0) && (
                                        <div className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded-xl border border-border/50 text-center">
                                            No additional configuration required for this connector type.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>

                <DialogFooter className="p-6 border-t border-border/50 bg-muted/5 shrink-0 flex items-center justify-between z-20">
                    <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">Cancel</Button>
                    <Button form="conn-form" type="submit" disabled={mutation.isPending} className="px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                        {mutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        {isEditMode ? 'Update Connection' : 'Save Connection'}
                    </Button>
                </DialogFooter>
            </div>
        </div>
    );
};