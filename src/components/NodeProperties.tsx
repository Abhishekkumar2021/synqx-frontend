import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { type Node } from '@xyflow/react';

interface NodePropertiesProps {
  node: Node | null;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}

interface FormData {
  label: string;
  type: string; // operator_type
  operator_class: string;
  config: string; // JSON string
  
  // Dynamic fields
  filter_condition: string;
  map_rename: string; // JSON or string representation
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onClose, onUpdate, onDelete }) => {
  const { register, handleSubmit, setValue, watch, getValues } = useForm<FormData>();
  const [showJson, setShowJson] = useState(false);

  // Watchers for conditional UI
  const nodeType = watch('type');
  const operatorClass = watch('operator_class');

  useEffect(() => {
    if (node) {
      const config = node.data.config as any || {};
      
      setValue('label', node.data.label as string);
      setValue('type', (node.data.type as string) || 'default');
      setValue('operator_class', (node.data.operator_class as string) || 'pandas_transform');
      setValue('config', JSON.stringify(config, null, 2));

      // Hydrate dynamic fields from config
      if (config.condition) setValue('filter_condition', config.condition);
      // For map, we might want to handle it better, but for now just rely on JSON or generic
    }
  }, [node, setValue]);

  if (!node) return null;

  // Helper to sync dynamic fields to JSON config
  const syncToConfig = (updates: Record<string, any>) => {
      try {
          const currentConfig = JSON.parse(getValues('config') || '{}');
          const newConfig = { ...currentConfig, ...updates };
          setValue('config', JSON.stringify(newConfig, null, 2));
      } catch (e) {
          // ignore invalid JSON for now
      }
  };

  const onSubmit = (data: FormData) => {
    try {
      let config = JSON.parse(data.config);
      
      // If using specific UI, override config values
      if (data.type === 'transform') {
          if (data.operator_class === 'filter') {
              config = { ...config, condition: data.filter_condition };
          }
      }

      onUpdate(node.id, {
        label: data.label,
        type: data.type,
        operator_class: data.operator_class,
        config: config
      });
    } catch (e) {
      alert("Invalid JSON configuration");
    }
  };

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border shadow-2xl p-4 flex flex-col gap-4 animate-in slide-in-from-right duration-200 z-10">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="font-semibold text-lg">Node Properties</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-4 overflow-y-auto">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input 
            {...register('label', { required: true })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Node Type (Operator Type) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Node Type</label>
          <select 
            {...register('type')}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="source">Source</option>
            <option value="transform">Transform</option>
            <option value="destination">Destination</option>
          </select>
        </div>

        {/* TRANSFORM SPECIFIC UI */}
        {nodeType === 'transform' && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-border/50">
                <label className="text-sm font-medium text-primary">Processor</label>
                <select 
                    {...register('operator_class')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                    <option value="pandas_transform">Generic (Pandas)</option>
                    <option value="filter">Filter Rows</option>
                    <option value="map">Map / Custom Expression</option>
                    <option value="aggregate">Aggregate (Group By)</option>
                    <option value="join">Join / Merge</option>
                    <option value="rename_columns">Rename Columns</option>
                    <option value="drop_columns">Drop Columns</option>
                    <option value="deduplicate">Deduplicate Rows</option>
                    <option value="fill_nulls">Fill Missing Values</option>
                </select>

                {operatorClass === 'filter' && (
                    <div className="mt-2 space-y-1 animate-in fade-in">
                        <label className="text-xs font-medium">Condition (Pandas Query)</label>
                        <input 
                            {...register('filter_condition', { 
                                onChange: (e) => syncToConfig({ condition: e.target.value }) 
                            })}
                            placeholder="age > 30"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                         <p className="text-[10px] text-muted-foreground">e.g., `amount &gt; 100`</p>
                    </div>
                )}

                {operatorClass === 'aggregate' && (
                     <div className="mt-2 space-y-3 animate-in fade-in">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Group By (comma separated)</label>
                            <input 
                                placeholder="category, region"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                onChange={(e) => syncToConfig({ group_by: e.target.value.split(',').map(s => s.trim()) })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Aggregates (JSON)</label>
                            <textarea 
                                placeholder='{"amount": "sum", "id": "count"}'
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                                onChange={(e) => {
                                    try {
                                        syncToConfig({ aggregates: JSON.parse(e.target.value) })
                                    } catch(err) { /* ignore typing */ }
                                }}
                            />
                        </div>
                    </div>
                )}

                {operatorClass === 'join' && (
                     <div className="mt-2 space-y-3 animate-in fade-in">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Join On Column</label>
                            <input 
                                placeholder="user_id"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                onChange={(e) => syncToConfig({ on: e.target.value })}
                            />
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-medium">Join Type</label>
                            <select 
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                onChange={(e) => syncToConfig({ how: e.target.value })}
                            >
                                <option value="left">Left Join</option>
                                <option value="inner">Inner Join</option>
                                <option value="outer">Full Outer</option>
                            </select>
                        </div>
                    </div>
                )}

                {operatorClass === 'rename_columns' && (
                    <div className="mt-2 space-y-1 animate-in fade-in">
                        <label className="text-xs font-medium">Rename Map (JSON)</label>
                        <textarea 
                            placeholder='{"old_col": "new_col", "another_old": "another_new"}'
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                            onChange={(e) => {
                                try {
                                    syncToConfig({ rename_map: JSON.parse(e.target.value) })
                                } catch(err) { /* ignore typing */ }
                            }}
                        />
                        <p className="text-[10px] text-muted-foreground">e.g., {"{ \"customer_id\": \"cust_id\" }"}</p>
                    </div>
                )}

                {operatorClass === 'drop_columns' && (
                    <div className="mt-2 space-y-1 animate-in fade-in">
                        <label className="text-xs font-medium">Columns to Drop (comma separated)</label>
                        <input 
                            placeholder="col1, col2, id"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            onChange={(e) => syncToConfig({ columns: e.target.value.split(',').map(s => s.trim()) })}
                        />
                        <p className="text-[10px] text-muted-foreground">e.g., `_source, _etl_metadata`</p>
                    </div>
                )}

                {operatorClass === 'deduplicate' && (
                    <div className="mt-2 space-y-3 animate-in fade-in">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Subset Columns (comma separated, optional)</label>
                            <input 
                                placeholder="col1, col2"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                onChange={(e) => {
                                    const val = e.target.value.trim();
                                    syncToConfig({ subset: val ? val.split(',').map(s => s.trim()) : null });
                                }}
                            />
                            <p className="text-[10px] text-muted-foreground">Empty means deduplicate based on all columns.</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Keep Strategy</label>
                            <select 
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                onChange={(e) => syncToConfig({ keep: e.target.value })}
                            >
                                <option value="first">First Occurrence</option>
                                <option value="last">Last Occurrence</option>
                                <option value="False">Drop All Duplicates</option>
                            </select>
                        </div>
                    </div>
                )}

                {operatorClass === 'fill_nulls' && (
                    <div className="mt-2 space-y-3 animate-in fade-in">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Columns to Fill (comma separated, optional)</label>
                            <input 
                                placeholder="col1, col2"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                onChange={(e) => {
                                    const val = e.target.value.trim();
                                    syncToConfig({ subset: val ? val.split(',').map(s => s.trim()) : null });
                                }}
                            />
                            <p className="text-[10px] text-muted-foreground">Empty means fill nulls in all columns.</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Fill Method</label>
                            <select 
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.startsWith('strategy:')) {
                                        syncToConfig({ strategy: val.split(':')[1], value: undefined });
                                    } else {
                                        syncToConfig({ value: val, strategy: undefined });
                                    }
                                }}
                            >
                                <option value="">-- Select --</option>
                                <option value="strategy:mean">Strategy: Mean</option>
                                <option value="strategy:median">Strategy: Median</option>
                                <option value="strategy:mode">Strategy: Mode</option>
                                <option value="strategy:ffill">Strategy: Forward Fill</option>
                                <option value="strategy:bfill">Strategy: Backward Fill</option>
                                <option value="0">Value: 0</option>
                                <option value="N/A">Value: N/A</option>
                                <option value="-1">Value: -1</option>
                            </select>
                            <p className="text-[10px] text-muted-foreground">Select a strategy or specify a literal value.</p>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* JSON Config Toggle */}
        <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Advanced Configuration</label>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowJson(!showJson)}>
                {showJson ? 'Hide' : 'Show'} JSON
            </Button>
        </div>

        {showJson && (
            <div className="space-y-2 flex-1 flex flex-col min-h-[200px]">
            <textarea 
                {...register('config')}
                className="flex-1 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                spellCheck={false}
            />
            </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-border mt-auto">
          <Button type="submit" className="flex-1">
            Apply Changes
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            size="icon" 
            onClick={() => {
                if(confirm('Delete this node?')) {
                    onDelete(node.id);
                    onClose();
                }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};