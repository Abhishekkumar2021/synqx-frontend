/* eslint-disable no-empty */
/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import {
    X, Trash2, Save, Code, Sliders,
    Filter, Layers, Database, HardDriveUpload,
    Braces, ListPlus, ShieldCheck, Copy,
    PaintBucket, FileType, Type, Regex
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type Node } from '@xyflow/react';
import { toast } from 'sonner';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue,
    SelectGroup,
    SelectLabel
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { getConnections, getConnectionAssets } from '@/lib/api';
import { NODE_DEFINITIONS, getNodeIcon } from '@/lib/pipeline-definitions';

interface NodePropertiesProps {
    node: Node | null;
    onClose: () => void;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
}

interface FormData {
    label: string;
    type: string;
    operator_class: string;
    config: string; // JSON string

    // Dynamic fields for visual editor
    filter_condition: string;
    join_on: string;
    join_type: string;
    group_by: string;
    drop_columns: string;
    
    // Asset Selection
    connection_id: string;
    asset_id: string;

    // New Operator Fields
    map_transformations: string; // JSON string
    agg_functions: string; // JSON string
    validate_schema: string; // JSON string
    dedup_subset: string;
    fill_value: string;
    fill_method: string;
    cast_mapping: string; // JSON string
    rename_mapping: string; // JSON string
    regex_column: string;
    regex_pattern: string;
    regex_replacement: string;

    // Retry & Timeout
    max_retries: number;
    timeout_seconds: number;
}

const isTransformLike = (type: string) => 
    ['transform', 'join', 'union', 'merge', 'validate', 'noop'].includes(type);

const findTypeForOpClass = (opClass: string) => {
    for (const cat of NODE_DEFINITIONS) {
        const item = cat.items.find(i => (i as any).opClass === opClass);
        if (item) return item.type;
    }
    return 'transform';
};

export const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onClose, onUpdate, onDelete }) => {
    const { register, handleSubmit, setValue, watch, getValues, reset, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            label: '',
            type: 'default',
            operator_class: 'pandas_transform',
            config: '{}',
            filter_condition: '',
            join_on: '',
            join_type: 'inner',
            group_by: '',
            drop_columns: '',
            connection_id: '',
            asset_id: '',
            map_transformations: '{}',
            agg_functions: '{}',
            validate_schema: '[]',
            dedup_subset: '',
            fill_value: '',
            fill_method: 'value',
            cast_mapping: '{}',
            rename_mapping: '{}',
            regex_column: '',
            regex_pattern: '',
            regex_replacement: '',
            max_retries: 3,
            timeout_seconds: 3600
        }
    });
    const [activeTab, setActiveTab] = useState('settings');

    // Watchers
    const nodeType = watch('type');
    const operatorClass = watch('operator_class');
    const selectedConnectionId = watch('connection_id');
    const fillMethod = watch('fill_method');

    // Fetch Connections
    const { data: connections } = useQuery({
        queryKey: ['connections'],
        queryFn: getConnections,
    });

    // Fetch Assets for selected connection
    const { data: assets } = useQuery({
        queryKey: ['assets', selectedConnectionId],
        queryFn: () => getConnectionAssets(parseInt(selectedConnectionId)),
        enabled: !!selectedConnectionId,
    });

    const filteredAssets = assets?.filter(a => {
        if (nodeType === 'source') return a.is_source;
        if (nodeType === 'sink' || nodeType === 'destination') return a.is_destination;
        return true;
    });

    useEffect(() => {
        if (node) {
            const config = node.data.config as any || {};
            
            let currentType = (node.data.type as string) || 'default';
            const currentOpClass = (node.data.operator_class as string) || 'pandas_transform';

            // Auto-correct type if it is generic but the class implies a specific type
            // This fixes issues where 'transform' type is persisted but 'join' class is used.
            if (currentType === 'transform' || currentType === 'default') {
                const inferredType = findTypeForOpClass(currentOpClass);
                if (inferredType && inferredType !== 'transform') {
                    currentType = inferredType;
                }
            }

            const defaultValues: FormData = {
                label: node.data.label as string,
                type: currentType,
                operator_class: currentOpClass,
                config: JSON.stringify(config, null, 2),
                
                // Defaults
                filter_condition: '',
                join_on: '',
                join_type: 'inner',
                group_by: '',
                drop_columns: '',
                connection_id: '',
                asset_id: '',
                map_transformations: '{}',
                agg_functions: '{}',
                validate_schema: '[]',
                dedup_subset: '',
                fill_value: '',
                fill_method: 'value',
                cast_mapping: '{}',
                rename_mapping: '{}',
                regex_column: '',
                regex_pattern: '',
                regex_replacement: '',
                max_retries: 3,
                timeout_seconds: 3600
            };

            // Hydrate visual fields from JSON config
            if (config.condition) defaultValues.filter_condition = config.condition;
            if (config.on) defaultValues.join_on = config.on;
            if (config.how) defaultValues.join_type = config.how;
            if (config.columns && Array.isArray(config.columns)) defaultValues.drop_columns = config.columns.join(', ');
            if (config.group_by && Array.isArray(config.group_by)) defaultValues.group_by = config.group_by.join(', ');
            
            // Hydrate New Fields
            if (config.transformations) defaultValues.map_transformations = JSON.stringify(config.transformations, null, 2);
            if (config.aggregates) defaultValues.agg_functions = JSON.stringify(config.aggregates, null, 2);
            if (config.schema) defaultValues.validate_schema = JSON.stringify(config.schema, null, 2);
            if (config.subset && Array.isArray(config.subset)) defaultValues.dedup_subset = config.subset.join(', ');
            if (config.value !== undefined) defaultValues.fill_value = String(config.value);
            if (config.method) defaultValues.fill_method = config.method;
            
            // Mapping fields (Cast / Rename)
            if (config.columns && !Array.isArray(config.columns)) {
                 if (currentOpClass === 'rename_columns') defaultValues.rename_mapping = JSON.stringify(config.columns, null, 2);
                 if (currentOpClass === 'type_cast') defaultValues.cast_mapping = JSON.stringify(config.columns, null, 2);
            }
            // Fallback for 'mapping' key if used
             if (config.mapping) {
                 if (currentOpClass === 'rename_columns') defaultValues.rename_mapping = JSON.stringify(config.mapping, null, 2);
                 if (currentOpClass === 'type_cast') defaultValues.cast_mapping = JSON.stringify(config.mapping, null, 2);
             }

            if (config.column) defaultValues.regex_column = config.column;
            if (config.pattern) defaultValues.regex_pattern = config.pattern;
            if (config.replacement) defaultValues.regex_replacement = config.replacement;

            // Hydrate Retry & Timeout
            defaultValues.max_retries = node.data.max_retries !== undefined ? (node.data.max_retries as number) : 3;
            defaultValues.timeout_seconds = node.data.timeout_seconds !== undefined ? (node.data.timeout_seconds as number) : 3600;

            // Hydrate Asset Selection
            if (node.data.connection_id) defaultValues.connection_id = String(node.data.connection_id);
            if (node.data.asset_id) defaultValues.asset_id = String(node.data.asset_id);
            if (node.data.source_asset_id) defaultValues.asset_id = String(node.data.source_asset_id);
            if (node.data.destination_asset_id) defaultValues.asset_id = String(node.data.destination_asset_id);

            // Use reset to update all fields at once, preventing race conditions with watchers
            // and ensuring the form state is clean for the selected node.
            // We cast defaultValues to any to avoid strict TS issues with optional fields if needed, 
            // but FormData matches.
            reset(defaultValues);
        }
    }, [node, reset]);

    if (!node) return null;

    const Icon = getNodeIcon(node.type || 'default');

    // Helper: Update the hidden JSON config based on visual inputs
    const syncVisualToConfig = (updates: Record<string, any>) => {
        try {
            const currentConfig = JSON.parse(getValues('config') || '{}');
            const newConfig = { ...currentConfig, ...updates };
            setValue('config', JSON.stringify(newConfig, null, 2));
        } catch (e) {
            // Silent fail on invalid JSON during typing
        }
    };

    const onSubmit = (data: FormData) => {
        try {
            const config = JSON.parse(data.config);

            // Merge visual fields based on operator class/type
            if (isTransformLike(data.type)) {
                if (data.operator_class === 'filter') config.condition = data.filter_condition;
                if (data.operator_class === 'join') {
                    config.on = data.join_on;
                    config.how = data.join_type;
                }
                if (data.operator_class === 'drop_columns') {
                    config.columns = data.drop_columns.split(',').map(s => s.trim()).filter(Boolean);
                }
                if (data.operator_class === 'map') {
                    config.transformations = JSON.parse(data.map_transformations || '{}');
                }
                if (data.operator_class === 'aggregate') {
                    config.group_by = data.group_by.split(',').map(s => s.trim()).filter(Boolean);
                    config.aggregates = JSON.parse(data.agg_functions || '{}');
                }
                if (data.operator_class === 'validate') {
                    config.schema = JSON.parse(data.validate_schema || '[]');
                }
                if (data.operator_class === 'deduplicate') {
                    config.subset = data.dedup_subset.split(',').map(s => s.trim()).filter(Boolean);
                }
                if (data.operator_class === 'fill_nulls') {
                    config.method = data.fill_method;
                    config.value = data.fill_method === 'value' ? data.fill_value : undefined;
                }
                if (data.operator_class === 'type_cast') {
                    config.columns = JSON.parse(data.cast_mapping || '{}');
                }
                if (data.operator_class === 'rename_columns') {
                    config.columns = JSON.parse(data.rename_mapping || '{}');
                }
                if (data.operator_class === 'regex_replace') {
                    config.column = data.regex_column;
                    config.pattern = data.regex_pattern;
                    config.replacement = data.regex_replacement;
                }
            }

            const payload: any = {
                label: data.label,
                type: data.type,
                operator_class: data.operator_class,
                config: config,
                connection_id: data.connection_id ? parseInt(data.connection_id) : undefined,
                asset_id: data.asset_id ? parseInt(data.asset_id) : undefined,
                max_retries: data.max_retries,
                timeout_seconds: data.timeout_seconds,
            };

            // Distinct fields for Source/Sink to match API expectations if needed or just store in data
            if (data.type === 'source' && data.asset_id) {
                payload.source_asset_id = parseInt(data.asset_id);
            }
            if (data.type === 'sink' && data.asset_id) {
                payload.destination_asset_id = parseInt(data.asset_id);
            }

            onUpdate(node.id, payload);
            toast.success("Node Configuration Synchronized", {
                description: `Operator "${data.label}" has been updated.`
            });
        } catch (e) {
            toast.error("Invalid Configuration", {
                description: "Please check your input values (especially JSON fields) for syntax errors."
            });
        }
    };

    return (
        <div className="h-full flex flex-col bg-background/20 backdrop-blur-3xl">
            {/* --- Header --- */}
            <div className="flex items-center justify-between p-8 border-b border-border/10 bg-muted/20 shrink-0 relative overflow-hidden">
                {/* Header Gradient */}
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-5 relative z-10">
                    <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center border-2 shadow-2xl transition-all duration-500",
                        node.type === 'source' ? "bg-chart-1/10 text-chart-1 border-chart-1/20 shadow-chart-1/5" :
                            isTransformLike(node.type || '') ? 
                                (node.type === 'validate' ? "bg-chart-4/10 text-chart-4 border-chart-4/20 shadow-chart-4/5" :
                                 ['join', 'union', 'merge'].includes(node.type || '') ? "bg-chart-5/10 text-chart-5 border-chart-5/20 shadow-chart-5/5" :
                                 "bg-chart-3/10 text-chart-3 border-chart-3/20 shadow-chart-3/5") :
                                node.type === 'sink' ? "bg-chart-2/10 text-chart-2 border-chart-2/20 shadow-chart-2/5" :
                                    "bg-muted text-muted-foreground border-border/10"
                    )}>
                        <Icon className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-black text-xl tracking-tight text-foreground">Inspector</h3>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-1.5 h-4 border-primary/20 bg-primary/5 text-primary">
                                {node.type?.toUpperCase()}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-bold font-mono opacity-40">{node.id}</span>
                        </div>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose} 
                    className="rounded-xl h-10 w-10 hover:bg-foreground/5 text-muted-foreground hover:text-foreground relative z-10 transition-all active:scale-90"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* --- Tabs & Content --- */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-6 shrink-0">
                        <TabsList className="w-full grid grid-cols-2 h-11 bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="settings" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"><Sliders className="h-4 w-4" /> Settings</TabsTrigger>
                            <TabsTrigger value="advanced" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"><Code className="h-4 w-4" /> Advanced</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-8">

                            {/* Common Fields */}
                            <div className="space-y-5">
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold ml-1 text-foreground">
                                        Node Label <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        {...register('label', { required: 'Label is required' })}
                                        className={cn(
                                            "h-11 rounded-xl bg-background/50 border-border/50 focus-visible:bg-background focus-visible:ring-primary/20 transition-all",
                                            errors.label && "border-destructive focus-visible:ring-destructive/20"
                                        )}
                                        placeholder="Enter a descriptive name"
                                    />
                                    {errors.label && <p className="text-[10px] text-destructive ml-1">{errors.label.message}</p>}
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-semibold ml-1 text-foreground">Operator Type</Label>
                                    <div className="relative">
                                        <Select
                                            value={watch('type')}
                                            onValueChange={(v) => setValue('type', v)}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl bg-background/50">
                                                <SelectValue placeholder="Select node type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="source">Source</SelectItem>
                                                <SelectItem value="transform">Transform</SelectItem>
                                                <SelectItem value="join">Join</SelectItem>
                                                <SelectItem value="union">Union</SelectItem>
                                                <SelectItem value="merge">Merge</SelectItem>
                                                <SelectItem value="validate">Validate</SelectItem>
                                                <SelectItem value="noop">No-Op</SelectItem>
                                                <SelectItem value="sink">Sink (Destination)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border/40" />

                            {/* --- Visual Editor Tab --- */}
                            <TabsContent value="settings" className="m-0 space-y-6 focus-visible:outline-none">

                                {isTransformLike(nodeType) && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2.5">
                                            <Label className="text-primary font-semibold ml-1">Transformation Logic</Label>
                                            <div className="relative">
                                                <Select
                                                    value={watch('operator_class')}
                                                    onValueChange={(v) => {
                                                        setValue('operator_class', v);
                                                        // Update visual type based on operator class
                                                        const newType = findTypeForOpClass(v);
                                                        setValue('type', newType);
                                                    }}
                                                >
                                                    <SelectTrigger className="h-11 rounded-xl bg-background/50">
                                                        <SelectValue placeholder="Select transformation" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[300px]">
                                                        {NODE_DEFINITIONS.map((category) => {
                                                            const transformItems = category.items.filter(i => i.type !== 'source' && i.type !== 'sink');
                                                            if (transformItems.length === 0) return null;
                                                            return (
                                                                <SelectGroup key={category.category}>
                                                                    <SelectLabel>{category.category}</SelectLabel>
                                                                    {transformItems.map((item) => (
                                                                        <SelectItem key={(item as any).opClass} value={(item as any).opClass}>
                                                                            {item.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectGroup>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Dynamic Fields */}
                                        <div className="p-5 rounded-2xl border border-border/40 bg-muted/20 space-y-5 shadow-sm">

                                            {operatorClass === 'filter' && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="p-1.5 rounded-md bg-chart-3/10">
                                                            <Filter className="h-4 w-4 text-chart-3" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-foreground">Filter Condition <span className="text-destructive">*</span></span>
                                                    </div>
                                                    <Input
                                                        {...register('filter_condition', { 
                                                            required: 'Filter condition is required',
                                                            onChange: (e) => syncVisualToConfig({ condition: e.target.value }) 
                                                        })}
                                                        placeholder="e.g. age > 18"
                                                        className={cn(
                                                            "font-mono text-xs h-10 rounded-lg bg-background/80 border-border/50",
                                                            errors.filter_condition && "border-destructive"
                                                        )}
                                                    />
                                                    {errors.filter_condition && <p className="text-[10px] text-destructive">{errors.filter_condition.message}</p>}
                                                    <p className="text-[10px] text-muted-foreground pl-1">Pandas query string format.</p>
                                                </div>
                                            )}

                                            {operatorClass === 'join' && (
                                                <div className="space-y-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 rounded-md bg-chart-3/10">
                                                            <Layers className="h-4 w-4 text-chart-3" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-foreground">Join Configuration</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-medium ml-1 text-muted-foreground">Join Column <span className="text-destructive">*</span></Label>
                                                            <Input
                                                                {...register('join_on', { 
                                                                    required: 'Join column is required',
                                                                    onChange: (e) => syncVisualToConfig({ on: e.target.value }) 
                                                                })}
                                                                placeholder="id"
                                                                className={cn(
                                                                    "h-10 rounded-lg bg-background/80 border-border/50",
                                                                    errors.join_on && "border-destructive"
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-medium ml-1 text-muted-foreground">Join Type</Label>
                                                            <div className="relative">
                                                                <Select
                                                                    value={watch('join_type')}
                                                                    onValueChange={(v) => {
                                                                        setValue('join_type', v);
                                                                        syncVisualToConfig({ how: v });
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-10 rounded-lg bg-background/80">
                                                                        <SelectValue placeholder="Join type" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="left">Left</SelectItem>
                                                                        <SelectItem value="inner">Inner</SelectItem>
                                                                        <SelectItem value="outer">Full Outer</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {operatorClass === 'drop_columns' && (
                                                <div className="space-y-3">
                                                    <Label className="ml-1 text-sm font-semibold text-foreground">Columns to Drop</Label>
                                                    <Input
                                                        {...register('drop_columns', {
                                                            onChange: (e) => syncVisualToConfig({ columns: e.target.value.split(',') })
                                                        })}
                                                        placeholder="col1, col2, _metadata"
                                                        className="h-10 rounded-lg bg-background/80 border-border/50"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground pl-1">Comma separated list of column names.</p>
                                                </div>
                                            )}
                                            
                                            {/* --- New Operators --- */}

                                            {operatorClass === 'map' && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="p-1.5 rounded-md bg-chart-3/10">
                                                            <ListPlus className="h-4 w-4 text-chart-3" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-foreground">Transformations</span>
                                                    </div>
                                                    <Textarea 
                                                        {...register('map_transformations', {
                                                            validate: (v) => { try { JSON.parse(v); return true; } catch { return 'Invalid JSON'; } },
                                                            onChange: (e) => { try { syncVisualToConfig({ transformations: JSON.parse(e.target.value) }) } catch {} }
                                                        })}
                                                        placeholder='{ "new_col": "col1 * 2", "status": "upper(status_col)" }'
                                                        className="font-mono text-xs h-24 rounded-lg bg-background/80 border-border/50"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground pl-1">JSON object mapping column names to expressions.</p>
                                                </div>
                                            )}

                                            {operatorClass === 'aggregate' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-3">
                                                        <Label className="text-xs font-medium ml-1 text-muted-foreground">Group By</Label>
                                                        <Input 
                                                            {...register('group_by', {
                                                                onChange: (e) => syncVisualToConfig({ group_by: e.target.value.split(',') })
                                                            })}
                                                            placeholder="category, region"
                                                            className="h-10 rounded-lg bg-background/80 border-border/50"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-xs font-medium ml-1 text-muted-foreground">Aggregates (JSON)</Label>
                                                        <Textarea 
                                                            {...register('agg_functions', {
                                                                onChange: (e) => { try { syncVisualToConfig({ aggregates: JSON.parse(e.target.value) }) } catch {} }
                                                            })}
                                                            placeholder='{ "sales": "sum", "id": "count" }'
                                                            className="font-mono text-xs h-20 rounded-lg bg-background/80 border-border/50"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {operatorClass === 'validate' && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="p-1.5 rounded-md bg-chart-3/10">
                                                            <ShieldCheck className="h-4 w-4 text-chart-3" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-foreground">Validation Schema</span>
                                                    </div>
                                                    <Textarea 
                                                        {...register('validate_schema', {
                                                            onChange: (e) => { try { syncVisualToConfig({ schema: JSON.parse(e.target.value) }) } catch {} }
                                                        })}
                                                        placeholder='[ { "column": "age", "check": ">= 0" } ]'
                                                        className="font-mono text-xs h-32 rounded-lg bg-background/80 border-border/50"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground pl-1">List of validation rules (JSON).</p>
                                                </div>
                                            )}

                                            {operatorClass === 'deduplicate' && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="p-1.5 rounded-md bg-chart-3/10">
                                                            <Copy className="h-4 w-4 text-chart-3" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-foreground">Subset Columns</span>
                                                    </div>
                                                    <Input 
                                                        {...register('dedup_subset', {
                                                            onChange: (e) => syncVisualToConfig({ subset: e.target.value.split(',') })
                                                        })}
                                                        placeholder="email, transaction_id"
                                                        className="h-10 rounded-lg bg-background/80 border-border/50"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground pl-1">Optional: Comma-separated columns to check for duplicates.</p>
                                                </div>
                                            )}

                                            {operatorClass === 'fill_nulls' && (
                                                <div className="space-y-5">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="p-1.5 rounded-md bg-chart-3/10">
                                                            <PaintBucket className="h-4 w-4 text-chart-3" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-foreground">Fill Strategy</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-medium ml-1 text-muted-foreground">Method</Label>
                                                            <Select
                                                                value={watch('fill_method')}
                                                                onValueChange={(v) => {
                                                                    setValue('fill_method', v);
                                                                    syncVisualToConfig({ method: v, value: v === 'value' ? getValues('fill_value') : undefined });
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-10 rounded-lg bg-background/80">
                                                                    <SelectValue placeholder="Method" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="value">Fixed Value</SelectItem>
                                                                    <SelectItem value="ffill">Forward Fill</SelectItem>
                                                                    <SelectItem value="bfill">Backward Fill</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        {fillMethod === 'value' && (
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-medium ml-1 text-muted-foreground">Value</Label>
                                                                <Input 
                                                                    {...register('fill_value', {
                                                                        required: fillMethod === 'value' ? 'Value is required' : false,
                                                                        onChange: (e) => syncVisualToConfig({ value: e.target.value, method: 'value' })
                                                                    })}
                                                                    placeholder="0, 'N/A', etc."
                                                                    className="h-10 rounded-lg bg-background/80 border-border/50"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {operatorClass === 'type_cast' && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="p-1.5 rounded-md bg-chart-3/10">
                                                            <FileType className="h-4 w-4 text-chart-3" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-foreground">Type Mapping</span>
                                                    </div>
                                                    <Textarea 
                                                        {...register('cast_mapping', {
                                                            onChange: (e) => { try { syncVisualToConfig({ columns: JSON.parse(e.target.value) }) } catch {} }
                                                        })}
                                                        placeholder='{ "age": "int", "price": "float" }'
                                                        className="font-mono text-xs h-24 rounded-lg bg-background/80 border-border/50"
                                                    />
                                                </div>
                                            )}

                                            {operatorClass === 'rename_columns' && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="p-1.5 rounded-md bg-chart-3/10">
                                                            <Type className="h-4 w-4 text-chart-3" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-foreground">Rename Columns</span>
                                                    </div>
                                                    <Textarea 
                                                        {...register('rename_mapping', {
                                                            onChange: (e) => { try { syncVisualToConfig({ columns: JSON.parse(e.target.value) }) } catch {} }
                                                        })}
                                                        placeholder='{ "old_name": "new_name" }'
                                                        className="font-mono text-xs h-24 rounded-lg bg-background/80 border-border/50"
                                                    />
                                                </div>
                                            )}

                                            {operatorClass === 'regex_replace' && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="p-1.5 rounded-md bg-chart-3/10">
                                                            <Regex className="h-4 w-4 text-chart-3" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-foreground">Regex Replacement</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-medium ml-1 text-muted-foreground">Target Column</Label>
                                                        <Input 
                                                            {...register('regex_column', {
                                                                required: 'Column is required',
                                                                onChange: (e) => syncVisualToConfig({ column: e.target.value })
                                                            })}
                                                            className="h-10 rounded-lg bg-background/80 border-border/50"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-medium ml-1 text-muted-foreground">Pattern (Regex)</Label>
                                                            <Input 
                                                                {...register('regex_pattern', {
                                                                    required: 'Pattern is required',
                                                                    onChange: (e) => syncVisualToConfig({ pattern: e.target.value })
                                                                })}
                                                                className="h-10 rounded-lg bg-background/80 border-border/50 font-mono"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-medium ml-1 text-muted-foreground">Replacement</Label>
                                                            <Input 
                                                                {...register('regex_replacement', {
                                                                    onChange: (e) => syncVisualToConfig({ replacement: e.target.value })
                                                                })}
                                                                className="h-10 rounded-lg bg-background/80 border-border/50"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Fallback for others */}
                                            {operatorClass === 'pandas_transform' && (
                                                <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border/60">
                                                    <Braces className="h-10 w-10 mb-3 opacity-30" />
                                                    <p className="text-sm">
                                                        Generic transformations are best configured via the
                                                        <span className="text-primary font-medium cursor-pointer ml-1 hover:underline" onClick={() => setActiveTab('advanced')}>Advanced Tab</span>.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(nodeType === 'source' || nodeType === 'sink') && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                         <div className="p-5 rounded-2xl border border-border/40 bg-muted/20 space-y-5 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={cn("p-1.5 rounded-md", nodeType === 'source' ? "bg-chart-1/10" : "bg-chart-2/10")}>
                                                    {nodeType === 'source' ? <Database className="h-4 w-4 text-chart-1" /> : <HardDriveUpload className="h-4 w-4 text-chart-2" />}
                                                </div>
                                                <span className="text-sm font-semibold text-foreground">
                                                    {nodeType === 'source' ? 'Source' : 'Target'} Asset
                                                </span>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium ml-1 text-muted-foreground">Connection <span className="text-destructive">*</span></Label>
                                                    <Select
                                                        value={watch('connection_id')}
                                                        onValueChange={(v) => {
                                                            setValue('connection_id', v);
                                                            setValue('asset_id', ''); // Reset asset on connection change
                                                        }}
                                                    >
                                                        <SelectTrigger className={cn("h-10 rounded-lg bg-background/80", !watch('connection_id') && errors.connection_id && "border-destructive")}>
                                                            <SelectValue placeholder="Select connection" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {connections?.map((c) => (
                                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {!watch('connection_id') && <Input type="hidden" {...register('connection_id', { required: 'Connection is required' })} />}
                                                    {errors.connection_id && <p className="text-[10px] text-destructive">{errors.connection_id.message}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium ml-1 text-muted-foreground">Asset <span className="text-destructive">*</span></Label>
                                                    <Select
                                                        value={watch('asset_id')}
                                                        onValueChange={(v) => setValue('asset_id', v)}
                                                        disabled={!watch('connection_id')}
                                                    >
                                                        <SelectTrigger className={cn("h-10 rounded-lg bg-background/80", !watch('asset_id') && errors.asset_id && "border-destructive")}>
                                                            <SelectValue placeholder={watch('connection_id') ? "Select asset" : "Select connection first"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {filteredAssets?.map((a) => (
                                                                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {!watch('asset_id') && <Input type="hidden" {...register('asset_id', { required: 'Asset is required' })} />}
                                                    {errors.asset_id && <p className="text-[10px] text-destructive">{errors.asset_id.message}</p>}
                                                </div>
                                            </div>
                                         </div>
                                    </div>
                                )}

                                <Separator className="bg-border/40" />

                                {/* Execution Reliability Section */}
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-6">
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <div className="p-1.5 rounded-md bg-primary/10">
                                            <ShieldCheck className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-sm font-semibold text-foreground tracking-tight">Execution Reliability</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6 px-1">
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Max Retries</Label>
                                            <Input 
                                                type="number"
                                                min={0}
                                                max={10}
                                                {...register('max_retries', { valueAsNumber: true })}
                                                className="h-11 rounded-xl bg-background/50 border-border/50 focus-visible:bg-background transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Timeout (Sec)</Label>
                                            <Input 
                                                type="number"
                                                min={0}
                                                {...register('timeout_seconds', { valueAsNumber: true })}
                                                className="h-11 rounded-xl bg-background/50 border-border/50 focus-visible:bg-background transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/50 italic font-medium px-2">
                                        Automated recovery attempts and hard execution limits for this node.
                                    </p>
                                </div>
                            </TabsContent>

                            {/* --- JSON Editor Tab --- */}
                            <TabsContent value="advanced" className="m-0 h-full focus-visible:outline-none">
                                <div className="space-y-3 h-full">
                                    <div className="flex items-center justify-between pl-1">
                                        <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                            <Code className="h-4 w-4 text-muted-foreground" /> Raw Configuration
                                        </Label>
                                        <Badge variant="outline" className="text-[10px] h-5 border-border/50 bg-muted/20 text-muted-foreground">JSON</Badge>
                                    </div>
                                    <Textarea
                                        {...register('config', { 
                                            required: 'Config is required',
                                            validate: (v) => {
                                                try {
                                                    JSON.parse(v);
                                                    return true;
                                                } catch (e) {
                                                    return 'Invalid JSON format';
                                                }
                                            }
                                        })}
                                        className={cn(
                                            "font-mono text-xs leading-relaxed min-h-[350px] resize-none bg-muted/30 border-border/40 text-foreground/90 rounded-xl p-4 shadow-inner focus-visible:ring-primary/20",
                                            errors.config && "border-destructive focus-visible:ring-destructive/20"
                                        )}
                                        spellCheck={false}
                                    />
                                    {errors.config && <p className="text-[10px] text-destructive ml-1">{errors.config.message}</p>}
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollArea>

                    {/* --- Footer Actions --- */}
                    <div className="p-8 border-t border-border/10 bg-muted/40 backdrop-blur-2xl shrink-0 flex gap-4 relative z-10">
                        {/* Footer Glow */}
                        <div className="absolute inset-0 bg-linear-to-tr from-primary/5 to-transparent pointer-events-none" />
                        
                        <Button 
                            type="submit" 
                            className="flex-1 rounded-3xl h-14 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 bg-primary text-primary-foreground"
                        >
                            <Save className="mr-2.5 h-4 w-4" /> Update Operator
                        </Button>
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-14 w-14 rounded-3xl border border-border/10 bg-foreground/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all group"
                                >
                                    <Trash2 className="h-5 w-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent className="rounded-[2.5rem] bg-background/95 backdrop-blur-2xl border-border/20 shadow-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-2xl font-black tracking-tight">Purge Operator?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-base font-medium">
                                        This will permanently remove this node from the current execution sequence.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter className="mt-8">
                                    <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-11 px-6">Abort</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold uppercase tracking-widest text-[10px] h-11 px-6"
                                        onClick={() => {
                                            onDelete(node.id);
                                            onClose();
                                        }}
                                    >
                                        Delete Forever
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </Tabs>
            </form>
        </div>
    );
};