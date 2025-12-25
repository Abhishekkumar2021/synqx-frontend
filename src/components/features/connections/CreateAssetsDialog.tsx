/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { type AssetBulkCreate, bulkCreateAssets } from '@/lib/api';
import { AssetType, ConnectorType } from '@/lib/enums';
import { ASSET_META } from '@/lib/asset-definitions';
import { toast } from 'sonner';
import { Plus, X, Database, ArrowRightLeft, Sparkles, Loader2, Code, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateAssetsDialogProps {
    connectionId: number;
    connectorType: ConnectorType;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type FormValues = {
    assets: {
        name: string;
        asset_type: string;
        usageType: 'source' | 'destination';
        query?: string;
        is_incremental_capable: boolean;
        watermark_column?: string;
        write_mode: 'append' | 'replace' | 'upsert';
    }[];
};

const CONNECTOR_ASSET_TYPES: Partial<Record<ConnectorType, AssetType[]>> = {
    [ConnectorType.POSTGRESQL]: [AssetType.TABLE, AssetType.VIEW, AssetType.SQL_QUERY],
    [ConnectorType.MYSQL]: [AssetType.TABLE, AssetType.VIEW, AssetType.SQL_QUERY],
    [ConnectorType.MARIADB]: [AssetType.TABLE, AssetType.VIEW, AssetType.SQL_QUERY],
    [ConnectorType.MSSQL]: [AssetType.TABLE, AssetType.VIEW, AssetType.SQL_QUERY],
    [ConnectorType.ORACLE]: [AssetType.TABLE, AssetType.VIEW, AssetType.SQL_QUERY],
    [ConnectorType.SQLITE]: [AssetType.TABLE, AssetType.VIEW, AssetType.SQL_QUERY],
    [ConnectorType.SNOWFLAKE]: [AssetType.TABLE, AssetType.VIEW, AssetType.SQL_QUERY],
    [ConnectorType.BIGQUERY]: [AssetType.TABLE, AssetType.VIEW, AssetType.SQL_QUERY],
    [ConnectorType.REDSHIFT]: [AssetType.TABLE, AssetType.VIEW, AssetType.SQL_QUERY],
    [ConnectorType.DATABRICKS]: [AssetType.TABLE, AssetType.VIEW, AssetType.SQL_QUERY],
    [ConnectorType.MONGODB]: [AssetType.COLLECTION, AssetType.NOSQL_QUERY],
    [ConnectorType.REDIS]: [AssetType.KEY_PATTERN],
    [ConnectorType.ELASTICSEARCH]: [AssetType.COLLECTION, AssetType.NOSQL_QUERY],
    [ConnectorType.CASSANDRA]: [AssetType.TABLE, AssetType.NOSQL_QUERY],
    [ConnectorType.DYNAMODB]: [AssetType.TABLE, AssetType.NOSQL_QUERY],
    [ConnectorType.LOCAL_FILE]: [AssetType.FILE],
    [ConnectorType.S3]: [AssetType.FILE],
    [ConnectorType.GCS]: [AssetType.FILE],
    [ConnectorType.AZURE_BLOB]: [AssetType.FILE],
    [ConnectorType.FTP]: [AssetType.FILE],
    [ConnectorType.SFTP]: [AssetType.FILE],
    [ConnectorType.REST_API]: [AssetType.API_ENDPOINT],
    [ConnectorType.GRAPHQL]: [AssetType.API_ENDPOINT],
    [ConnectorType.KAFKA]: [AssetType.STREAM],
    [ConnectorType.RABBITMQ]: [AssetType.STREAM],
    [ConnectorType.CUSTOM_SCRIPT]: [
        AssetType.PYTHON_SCRIPT,
        AssetType.SHELL_SCRIPT,
        AssetType.JAVASCRIPT_SCRIPT
    ],
};

const DEFAULT_ASSET_TYPES = [AssetType.TABLE, AssetType.FILE];

const QUERY_SCRIPT_TYPES = [
    AssetType.SQL_QUERY, AssetType.NOSQL_QUERY,
    AssetType.PYTHON_SCRIPT, AssetType.SHELL_SCRIPT, AssetType.JAVASCRIPT_SCRIPT
];

export const CreateAssetsDialog: React.FC<CreateAssetsDialogProps> = ({ connectionId, connectorType, open, onOpenChange }) => {
    const queryClient = useQueryClient();
    const availableAssetTypes = CONNECTOR_ASSET_TYPES[connectorType] || DEFAULT_ASSET_TYPES;
    const defaultAssetType = availableAssetTypes[0];

    const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
        defaultValues: {
            assets: [{
                name: '',
                asset_type: defaultAssetType,
                usageType: 'source',
                query: '',
                is_incremental_capable: false,
                watermark_column: 'timestamp',
                write_mode: 'append'
            }]
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: "assets" });
    const watchedAssets = watch("assets");

    useEffect(() => {
        if (open) {
            reset({
                assets: [{
                    name: '',
                    asset_type: defaultAssetType,
                    usageType: 'source',
                    query: '',
                    is_incremental_capable: false,
                    watermark_column: 'timestamp',
                    write_mode: 'append'
                }]
            });
        }
    }, [open, reset, defaultAssetType]);

    const mutation = useMutation({
        mutationFn: (payload: AssetBulkCreate) => bulkCreateAssets(connectionId, payload),
        onSuccess: (data) => {
            if (data.successful_creates > 0) {
                toast.success("Assets Created", { description: `${data.successful_creates} assets successfully added.`, });
            }
            if (data.failed_creates > 0) {
                toast.warning("Partial Success", { description: `${data.failed_creates} assets failed.`, });
            }
            queryClient.invalidateQueries({ queryKey: ['assets', connectionId] });
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast.error("Operation Failed", { description: err.response?.data?.detail?.message || "Error during creation." });
        }
    });

    const onSubmit = (data: FormValues) => {
        const payload: AssetBulkCreate = {
            assets: data.assets.filter(a => a.name.trim() !== '').map(asset => {
                let config: Record<string, any> = {};
                if ([AssetType.SQL_QUERY, AssetType.NOSQL_QUERY].includes(asset.asset_type as AssetType)) {
                    config.query = asset.query;
                } else if (QUERY_SCRIPT_TYPES.includes(asset.asset_type as AssetType)) {
                    config.code = asset.query;
                    config.language = asset.asset_type;
                }
                if (asset.is_incremental_capable && asset.watermark_column) {
                    config.watermark_column = asset.watermark_column;
                }
                if (asset.usageType === 'destination') {
                    config.write_mode = asset.write_mode;
                }
                return {
                    name: asset.name,
                    asset_type: asset.asset_type,
                    is_source: asset.usageType === 'source',
                    is_destination: asset.usageType === 'destination',
                    is_incremental_capable: asset.is_incremental_capable,
                    config: Object.keys(config).length > 0 ? config : undefined
                };
            }),
        };
        if (payload.assets.length === 0) {
            toast.error("Validation Error", { description: "Please provide at least one asset." });
            return;
        }
        mutation.mutate(payload);
    };

    const getPlaceholder = (type: string) => {
        if (type === AssetType.SQL_QUERY) return "SELECT * FROM ...";
        if (type === AssetType.PYTHON_SCRIPT) return "def extract():\n    return [{'id': 1}]";
        if (type === AssetType.JAVASCRIPT_SCRIPT) return "console.log(JSON.stringify([{'id': 1}]))";
        if (type === AssetType.SHELL_SCRIPT) return "curl https://api.example.com/data";
        return '{ "collection": "users", ... }';
    };

    const getQueryHelp = (type: string) => {
        if (type === AssetType.SQL_QUERY) return "Enter a valid SQL query.";
        if ([AssetType.PYTHON_SCRIPT, AssetType.JAVASCRIPT_SCRIPT, AssetType.SHELL_SCRIPT].includes(type as AssetType))
            return "Enter script code. Standard output must be valid JSON.";
        return "Enter a JSON object query.";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-[2rem] border-border/60 glass-panel shadow-2xl backdrop-blur-3xl">
                <DialogHeader className="p-8 pb-6 border-b border-border/40 bg-muted/20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary ring-1 ring-border/50 shadow-sm">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold tracking-tight">Manual Asset Registration</DialogTitle>
                            <DialogDescription className="text-sm font-medium text-muted-foreground">
                                Add physical data entities or define query-based assets.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1">
                        <div className="p-8 pt-6 space-y-4">
                            <div className="grid grid-cols-12 gap-4 px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                <div className="col-span-4">Asset Name / Identifier</div>
                                <div className="col-span-3">Type</div>
                                <div className="col-span-2">Sync Usage</div>
                                <div className="col-span-2">Strategy</div>
                                <div className="col-span-1"></div>
                            </div>

                            <AnimatePresence initial={false}>
                                {fields.map((field, index) => {
                                    const assetType = watchedAssets?.[index]?.asset_type;
                                    const isQuery = QUERY_SCRIPT_TYPES.includes(assetType as AssetType);
                                    const isIncremental = watchedAssets?.[index]?.is_incremental_capable;

                                    return (
                                        <motion.div
                                            key={field.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="flex flex-col gap-3 bg-muted/5 hover:bg-muted/20 p-3 rounded-2xl border border-border/20 transition-all"
                                        >
                                            <div className="grid grid-cols-12 gap-3 items-center w-full">
                                                <div className="col-span-4 relative">
                                                    <Database className="z-20 absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                                    <Input
                                                        {...register(`assets.${index}.name`, { required: true })}
                                                        placeholder={isQuery ? "Name..." : "Table or file name..."}
                                                        className="pl-9 h-10 rounded-xl bg-background/50 border-border/40 text-sm font-medium"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Controller
                                                        control={control}
                                                        name={`assets.${index}.asset_type`}
                                                        render={({ field: f }) => (
                                                            <Select onValueChange={(val) => { f.onChange(val); if (QUERY_SCRIPT_TYPES.includes(val as AssetType)) setValue(`assets.${index}.usageType`, 'source'); }} defaultValue={f.value}>
                                                                <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/40 text-sm font-medium">
                                                                    <div className="flex items-center gap-2">
                                                                        {ASSET_META[f.value as AssetType] && React.createElement(ASSET_META[f.value as AssetType].icon, { className: "h-3.5 w-3.5 text-muted-foreground" })}
                                                                        <SelectValue />
                                                                    </div>
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl max-h-60">
                                                                    {availableAssetTypes.map(type => (
                                                                        <SelectItem key={type} value={type}>
                                                                            <div className="flex items-center gap-2">
                                                                                {React.createElement(ASSET_META[type].icon, { className: "h-3.5 w-3.5 opacity-70" })}
                                                                                {ASSET_META[type].name}
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <Controller
                                                        control={control}
                                                        name={`assets.${index}.usageType`}
                                                        render={({ field: f }) => (
                                                            <Select onValueChange={f.onChange} value={f.value} disabled={isQuery}>
                                                                <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/40 text-sm font-medium">
                                                                    <div className="flex items-center gap-2"><ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" /><SelectValue /></div>
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl"><SelectItem value="source">Source</SelectItem><SelectItem value="destination">Destination</SelectItem></SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                </div>
                                                <div className="col-span-2 flex items-center gap-2">
                                                    {watchedAssets?.[index]?.usageType === 'source' ? (
                                                        <Controller
                                                            control={control}
                                                            name={`assets.${index}.is_incremental_capable`}
                                                            render={({ field: f }) => (
                                                                <div className="flex items-center gap-2 bg-background/50 border border-border/40 rounded-xl px-3 h-10 w-full">
                                                                    <Switch checked={f.value} onCheckedChange={f.onChange} className="scale-75 data-[state=checked]:bg-primary" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{f.value ? 'Incr.' : 'Full'}</span>
                                                                </div>
                                                            )}
                                                        />
                                                    ) : (
                                                        <Controller
                                                            control={control}
                                                            name={`assets.${index}.write_mode`}
                                                            render={({ field: f }) => (
                                                                <Select onValueChange={f.onChange} value={f.value}>
                                                                    <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/40 text-[10px] font-bold uppercase"><SelectValue /></SelectTrigger>
                                                                    <SelectContent className="rounded-xl"><SelectItem value="append">Append</SelectItem><SelectItem value="replace">Replace</SelectItem><SelectItem value="upsert">Upsert</SelectItem></SelectContent>
                                                                </Select>
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                                <div className="col-span-1 flex justify-center">
                                                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive" onClick={() => remove(index)} disabled={fields.length <= 1}><X className="h-4 w-4" /></Button>
                                                </div>
                                            </div>

                                            {isIncremental && (
                                                <div className="w-full pb-2 px-1">
                                                    <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-xl p-3">
                                                        <TrendingUp className="h-4 w-4 text-primary" />
                                                        <Label className="text-xs font-semibold whitespace-nowrap">Watermark Column:</Label>
                                                        <Input {...register(`assets.${index}.watermark_column`, { required: isIncremental })} placeholder="e.g. updated_at" className="h-8 text-xs bg-background/80 border-border/50" />
                                                    </div>
                                                </div>
                                            )}

                                            {isQuery && (
                                                <div className="w-full pb-1">
                                                    <div className="relative">
                                                        <Code className="z-20 absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                                                        <Textarea {...register(`assets.${index}.query`, { required: isQuery })} placeholder={getPlaceholder(assetType)} className="min-h-20 font-mono text-xs pl-9 bg-background/30" />
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">{getQueryHelp(assetType)}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-12 rounded-2xl border-dashed border-border/60 bg-background/20 hover:bg-background/50 transition-all font-bold text-muted-foreground gap-2 mt-2"
                                onClick={() => append({ name: '', asset_type: defaultAssetType, usageType: 'source', query: '', is_incremental_capable: false, watermark_column: 'timestamp', write_mode: 'append' })}
                            >
                                <Plus className="h-4 w-4" /> Add Row
                            </Button>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-8 border-t border-border/40 bg-muted/10 gap-3">
                        <Button type="button" variant="ghost" className="rounded-xl h-11 px-6 font-bold" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2" disabled={mutation.isPending}>
                            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Save {fields.length} Asset{fields.length !== 1 ? 's' : ''}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};