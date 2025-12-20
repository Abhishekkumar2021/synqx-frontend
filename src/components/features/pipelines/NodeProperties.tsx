/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import {
    X, Trash2, Save, Code, Sliders,
    Filter, Layers, ArrowRightLeft,
    Database, HardDriveUpload, PlayCircle,
    Braces
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
}

// Icon helper
const getNodeIcon = (type: string) => {
    switch (type) {
        case 'source': return Database;
        case 'transform': return ArrowRightLeft;
        case 'sink': return HardDriveUpload;
        default: return PlayCircle;
    }
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onClose, onUpdate, onDelete }) => {
    const { register, handleSubmit, setValue, watch, getValues } = useForm<FormData>();
    const [activeTab, setActiveTab] = useState('settings');

    // Watchers
    const nodeType = watch('type');
    const operatorClass = watch('operator_class');
    const selectedConnectionId = watch('connection_id');

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

            setValue('label', node.data.label as string);
            setValue('type', (node.data.type as string) || 'default');
            setValue('operator_class', (node.data.operator_class as string) || 'pandas_transform');
            setValue('config', JSON.stringify(config, null, 2));

            // Hydrate visual fields from JSON config
            if (config.condition) setValue('filter_condition', config.condition);
            if (config.on) setValue('join_on', config.on);
            if (config.how) setValue('join_type', config.how);
            if (config.columns && Array.isArray(config.columns)) setValue('drop_columns', config.columns.join(', '));
            if (config.group_by && Array.isArray(config.group_by)) setValue('group_by', config.group_by.join(', '));
            
            // Hydrate Asset Selection
            if (node.data.connection_id) setValue('connection_id', String(node.data.connection_id));
            if (node.data.asset_id) setValue('asset_id', String(node.data.asset_id));
            // Backwards compatibility/Alternative storage for asset_id
            if (node.data.source_asset_id) setValue('asset_id', String(node.data.source_asset_id));
            if (node.data.destination_asset_id) setValue('asset_id', String(node.data.destination_asset_id));
        }
    }, [node, setValue]);

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

            // Merge visual fields based on type just before saving to be sure
            if (data.type === 'transform') {
                if (data.operator_class === 'filter') config.condition = data.filter_condition;
                if (data.operator_class === 'join') {
                    config.on = data.join_on;
                    config.how = data.join_type;
                }
                if (data.operator_class === 'drop_columns') {
                    config.columns = data.drop_columns.split(',').map(s => s.trim()).filter(Boolean);
                }
            }

            const payload: any = {
                label: data.label,
                type: data.type,
                operator_class: data.operator_class,
                config: config,
                connection_id: data.connection_id ? parseInt(data.connection_id) : undefined,
                asset_id: data.asset_id ? parseInt(data.asset_id) : undefined,
            };

            // Distinct fields for Source/Sink to match API expectations if needed or just store in data
            if (data.type === 'source' && data.asset_id) {
                payload.source_asset_id = parseInt(data.asset_id);
            }
            if (data.type === 'sink' && data.asset_id) {
                payload.destination_asset_id = parseInt(data.asset_id);
            }

            onUpdate(node.id, payload);

            // Close after save for better UX
            // onClose(); 
        } catch (e) {
            alert("Invalid JSON configuration");
        }
    };

    return (
        <div className="h-full flex flex-col bg-transparent">
            {/* --- Header --- */}
            <div className="flex items-center justify-between p-6 border-b border-border/40 bg-background/40 shrink-0 backdrop-blur-xl z-10">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm",
                        node.type === 'source' ? "bg-chart-1/10 text-chart-1 border-chart-1/20" :
                            node.type === 'transform' ? "bg-chart-3/10 text-chart-3 border-chart-3/20" :
                                node.type === 'sink' ? "bg-chart-2/10 text-chart-2 border-chart-2/20" :
                                    "bg-muted text-muted-foreground border-border"
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg leading-tight text-foreground">Properties</h3>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 opacity-80">{node.id}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* --- Tabs & Content --- */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 bg-background/20">
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
                                    <Label className="text-sm font-semibold ml-1 text-foreground">Node Label</Label>
                                    <Input
                                        {...register('label')}
                                        className="h-11 rounded-xl bg-background/50 border-border/50 focus-visible:bg-background focus-visible:ring-primary/20 transition-all"
                                        placeholder="Enter a descriptive name"
                                    />
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
                                                <SelectItem value="sink">Sink (Destination)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border/40" />

                            {/* --- Visual Editor Tab --- */}
                            <TabsContent value="settings" className="m-0 space-y-6 focus-visible:outline-none">

                                {nodeType === 'transform' && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2.5">
                                            <Label className="text-primary font-semibold ml-1">Transformation Logic</Label>
                                            <div className="relative">
                                                <Select
                                                    value={watch('operator_class')}
                                                    onValueChange={(v) => setValue('operator_class', v)}
                                                >
                                                    <SelectTrigger className="h-11 rounded-xl bg-background/50">
                                                        <SelectValue placeholder="Select transformation" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pandas_transform">Generic (Custom Code)</SelectItem>
                                                        <SelectItem value="filter">Filter Rows</SelectItem>
                                                        <SelectItem value="join">Join / Merge</SelectItem>
                                                        <SelectItem value="aggregate">Aggregate / Group By</SelectItem>
                                                        <SelectItem value="drop_columns">Drop Columns</SelectItem>
                                                        <SelectItem value="deduplicate">Deduplicate</SelectItem>
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
                                                        <span className="text-sm font-semibold text-foreground">Filter Condition</span>
                                                    </div>
                                                    <Input
                                                        {...register('filter_condition', { onChange: (e) => syncVisualToConfig({ condition: e.target.value }) })}
                                                        placeholder="e.g. age > 18"
                                                        className="font-mono text-xs h-10 rounded-lg bg-background/80 border-border/50"
                                                    />
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
                                                            <Label className="text-xs font-medium ml-1 text-muted-foreground">Join Column</Label>
                                                            <Input
                                                                {...register('join_on', { onChange: (e) => syncVisualToConfig({ on: e.target.value }) })}
                                                                placeholder="id"
                                                                className="h-10 rounded-lg bg-background/80 border-border/50"
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
                                                <div className="p-1.5 rounded-md bg-chart-1/10">
                                                    <Database className="h-4 w-4 text-chart-1" />
                                                </div>
                                                <span className="text-sm font-semibold text-foreground">
                                                    {nodeType === 'source' ? 'Source' : 'Target'} Asset
                                                </span>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium ml-1 text-muted-foreground">Connection</Label>
                                                    <Select
                                                        value={watch('connection_id')}
                                                        onValueChange={(v) => {
                                                            setValue('connection_id', v);
                                                            setValue('asset_id', ''); // Reset asset on connection change
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-10 rounded-lg bg-background/80">
                                                            <SelectValue placeholder="Select connection" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {connections?.map((c) => (
                                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium ml-1 text-muted-foreground">Asset</Label>
                                                    <Select
                                                        value={watch('asset_id')}
                                                        onValueChange={(v) => setValue('asset_id', v)}
                                                        disabled={!watch('connection_id')}
                                                    >
                                                        <SelectTrigger className="h-10 rounded-lg bg-background/80">
                                                            <SelectValue placeholder={watch('connection_id') ? "Select asset" : "Select connection first"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {filteredAssets?.map((a) => (
                                                                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                         </div>
                                    </div>
                                )}
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
                                        {...register('config')}
                                        className="font-mono text-xs leading-relaxed min-h-[350px] resize-none bg-muted/30 border-border/40 text-foreground/90 rounded-xl p-4 shadow-inner focus-visible:ring-primary/20"
                                        spellCheck={false}
                                    />
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollArea>

                    {/* --- Footer Actions --- */}
                    <div className="p-6 border-t border-border/40 bg-background/60 backdrop-blur-xl shrink-0 flex gap-4 z-10">
                        <Button type="submit" className="flex-1 shadow-lg shadow-primary/20 rounded-xl h-12 font-semibold text-base hover:scale-[1.02] transition-transform">
                            <Save className="mr-2 h-4 w-4" /> Apply Changes
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="h-12 w-12 rounded-xl border border-destructive/20
                 bg-destructive/5 text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete node?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently remove the node.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground"
                                        onClick={() => {
                                            onDelete(node.id);
                                            onClose();
                                        }}
                                    >
                                        Delete
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