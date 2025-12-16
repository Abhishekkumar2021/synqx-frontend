/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createConnection, type ConnectionCreate } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Use primitive Label for robustness
import {
    ShieldCheck, Lock, RefreshCw, CheckCircle2, Server, ArrowLeft
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

// --- Zod Schema ---
const connectionSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    connector_type: z.string().min(1, "Connection type is required"),
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
    const [selectedType, setSelectedType] = useState<string | null>(initialData?.connector_type || null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (initialData?.connector_type) {
            setSelectedType(initialData.connector_type);
            setStep('configure');
        }
    }, [initialData]);

    const form = useForm<ConnectionFormValues>({
        resolver: zodResolver(connectionSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            connector_type: initialData?.connector_type || '',
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
        form.setValue('connector_type', type);
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

    // --- STEP 1: Selection View ---
    if (step === 'select' && !isEditMode) {
        return (
            <div className="flex flex-col h-full bg-background">
                <DialogHeader className="px-8 py-6 border-b border-border/40 shrink-0 bg-muted/10">
                    <DialogTitle className="text-xl font-bold">Select a Connector</DialogTitle>
                    <DialogDescription>Choose your data source or destination to proceed.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Object.entries(CONNECTOR_META).map(([key, meta]) => (
                            <button
                                key={key}
                                onClick={() => handleSelect(key)}
                                className={cn(
                                    "group relative flex flex-col items-center gap-4 p-6 rounded-[1.5rem] text-center overflow-hidden transition-all duration-300",
                                    "border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1"
                                )}
                            >
                                <div className={cn(
                                    "p-5 rounded-2xl border shadow-sm transition-transform duration-300 group-hover:scale-110",
                                    meta.color.replace('text-', 'text-opacity-80 text-'), // Use text color, but apply bg opacity if needed
                                    "bg-background border-border/50"
                                )}>
                                    <SafeIcon icon={meta.icon} className="h-8 w-8" />
                                </div>
                                <div className="space-y-1 z-10">
                                    <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{meta.name}</h4>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold opacity-70">{meta.category}</span>
                                </div>
                                {meta.popular && (
                                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                                        HOT
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- STEP 2: Configuration View ---
    const meta = (selectedType && CONNECTOR_META[selectedType])
        ? CONNECTOR_META[selectedType]
        : { name: selectedType || 'Unknown', icon: <Server />, description: 'Custom or deprecated connector type.', color: 'bg-muted text-muted-foreground' };

    const schema = selectedType ? CONNECTOR_CONFIG_SCHEMAS[selectedType] : null;

    return (
        <div className="flex h-full bg-background">

            {/* Sidebar (Info Panel) */}
            <div className="w-[280px] bg-muted/20 border-r border-border/50 p-6 hidden md:flex flex-col gap-8 shrink-0 relative overflow-hidden">
                <div className="z-10">
                    {!isEditMode && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-3 mb-6 text-muted-foreground hover:text-foreground gap-1"
                            onClick={() => setStep('select')}
                        >
                            <ArrowLeft className="h-4 w-4" /> Change Connector
                        </Button>
                    )}
                    <div className={cn(
                        "h-16 w-16 rounded-2xl flex items-center justify-center mb-6 border shadow-lg bg-background",
                        meta?.color.replace('text-', 'text-opacity-90 text-')
                    )}>
                        <SafeIcon icon={meta.icon} className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">
                        {isEditMode ? 'Edit' : 'Configure'} <br />
                        <span className="text-primary">{meta?.name}</span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-4 leading-relaxed font-medium">
                        {meta?.description}
                    </p>
                </div>

                <div className="mt-auto space-y-4 z-10">
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
                        <div className="flex items-center gap-2 font-bold mb-1.5 uppercase tracking-wide opacity-90">
                            <ShieldCheck className="h-3.5 w-3.5" /> Secure Storage
                        </div>
                        Credentials are encrypted at rest using AES-256 GCM.
                    </div>
                </div>
            </div>

            {/* Form Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-background/50 backdrop-blur-sm">
                <DialogHeader className="px-8 py-6 border-b border-border/40 shrink-0">
                    <DialogTitle className="text-lg font-bold">Connection Details</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* Form Provider wraps everything */}
                    <Form {...form}>
                        <form id="conn-form" onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-8 max-w-2xl mx-auto py-2">

                            {/* General Section */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-3 opacity-80">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold ring-1 ring-primary/20">1</span>
                                    General Information
                                </h4>
                                <div className="grid gap-5 pl-9">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <Label className="text-sm font-semibold mb-2 block">Connection Name</Label>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Production DB" className="h-10 rounded-lg bg-background" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <Label className="text-sm font-semibold mb-2 block">Description</Label>
                                            <FormControl>
                                                <Input {...field} placeholder="Optional context" className="h-10 rounded-lg bg-background" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            <div className="h-px w-full bg-border/50" />

                            {/* Config Section */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-3 opacity-80">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold ring-1 ring-primary/20">2</span>
                                    Credentials & Config
                                </h4>
                                <div className="grid gap-5 pl-9">
                                    {schema?.fields?.map((field: any) => {
                                        // Dependency Check
                                        if (field.dependency) {
                                            const depVal = configValues[field.dependency.field];
                                            if (depVal !== field.dependency.value) return null;
                                        }
                                        return (
                                            <FormField key={field.name} control={form.control} name={`config.${field.name}`} render={({ field: f }) => (
                                                <FormItem>
                                                    <Label className="text-sm font-semibold mb-2 block">{field.label}</Label>
                                                    <FormControl>
                                                        {field.type === 'select' ? (
                                                            <Select onValueChange={f.onChange} defaultValue={f.value}>
                                                                <SelectTrigger className="h-10 rounded-lg bg-background"><SelectValue /></SelectTrigger>
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
                                                                    className={cn("h-10 rounded-lg bg-background", field.type === 'password' && 'pl-10')}
                                                                />
                                                                {field.type === 'password' && (
                                                                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground opacity-70" />
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
                                        <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded-xl border border-border/50 text-center">
                                            No additional configuration required for this connector type.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>

                <DialogFooter className="p-6 border-t border-border/40 bg-muted/10 shrink-0 flex items-center justify-between z-20">
                    <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">Cancel</Button>
                    <Button form="conn-form" type="submit" disabled={mutation.isPending} className="px-6 rounded-full shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all">
                        {mutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        {isEditMode ? 'Update Connection' : 'Save Connection'}
                    </Button>
                </DialogFooter>
            </div>
        </div>
    );
};