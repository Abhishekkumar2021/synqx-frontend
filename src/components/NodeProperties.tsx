/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
    X, Trash2, Save, Code, Sliders, 
    Filter, Layers, ArrowRightLeft, 
    Database, HardDriveUpload, PlayCircle,
    Braces
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { type Node } from '@xyflow/react';

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
}

// Icon helper
const getNodeIcon = (type: string) => {
    switch(type) {
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
    <div className="h-full flex flex-col bg-transparent">
      {/* --- Header --- */}
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/5 shrink-0">
        <div className="flex items-center gap-3">
            <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center border shadow-sm",
                node.type === 'source' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                node.type === 'transform' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                node.type === 'sink' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                "bg-primary/10 text-primary border-primary/20"
            )}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <h3 className="font-semibold text-lg leading-tight">Properties</h3>
                <p className="text-xs text-muted-foreground font-mono">{node.id}</p>
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* --- Tabs & Content --- */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-4 shrink-0">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="settings" className="gap-2"><Sliders className="h-3.5 w-3.5"/> Settings</TabsTrigger>
                    <TabsTrigger value="advanced" className="gap-2"><Code className="h-3.5 w-3.5"/> Advanced</TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                    
                    {/* Common Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Node Label</Label>
                            <Input 
                                {...register('label')} 
                                className="bg-background/50 border-border/50 focus:border-primary/50" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Operator Type</Label>
                            <select 
                                {...register('type')}
                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                            >
                                <option value="source">Source</option>
                                <option value="transform">Transform</option>
                                <option value="sink">Sink (Destination)</option>
                            </select>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* --- Visual Editor Tab --- */}
                    <TabsContent value="settings" className="m-0 space-y-6 focus-visible:outline-none">
                        
                        {nodeType === 'transform' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label className="text-primary font-semibold">Transformation Logic</Label>
                                    <select 
                                        {...register('operator_class')}
                                        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="pandas_transform">Generic (Custom Code)</option>
                                        <option value="filter">Filter Rows</option>
                                        <option value="join">Join / Merge</option>
                                        <option value="aggregate">Aggregate / Group By</option>
                                        <option value="drop_columns">Drop Columns</option>
                                        <option value="deduplicate">Deduplicate</option>
                                    </select>
                                </div>

                                {/* Dynamic Fields based on Operator Class */}
                                <div className="p-4 rounded-xl border border-border/50 bg-muted/10 space-y-4">
                                    
                                    {operatorClass === 'filter' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Filter className="h-4 w-4 text-purple-500" />
                                                <span className="text-sm font-medium">Filter Condition</span>
                                            </div>
                                            <Input 
                                                {...register('filter_condition', { onChange: (e) => syncVisualToConfig({ condition: e.target.value })})}
                                                placeholder="e.g. age > 18"
                                                className="font-mono text-xs"
                                            />
                                            <p className="text-[10px] text-muted-foreground">Pandas query string format.</p>
                                        </div>
                                    )}

                                    {operatorClass === 'join' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-4 w-4 text-purple-500" />
                                                <span className="text-sm font-medium">Join Configuration</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Join Column</Label>
                                                    <Input 
                                                        {...register('join_on', { onChange: (e) => syncVisualToConfig({ on: e.target.value })})}
                                                        placeholder="id"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Join Type</Label>
                                                    <select 
                                                        {...register('join_type', { onChange: (e) => syncVisualToConfig({ how: e.target.value })})}
                                                        className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm"
                                                    >
                                                        <option value="left">Left</option>
                                                        <option value="inner">Inner</option>
                                                        <option value="outer">Full Outer</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {operatorClass === 'drop_columns' && (
                                        <div className="space-y-2">
                                            <Label>Columns to Drop</Label>
                                            <Input 
                                                {...register('drop_columns', { 
                                                    onChange: (e) => syncVisualToConfig({ columns: e.target.value.split(',') })
                                                })}
                                                placeholder="col1, col2, _metadata"
                                            />
                                            <p className="text-[10px] text-muted-foreground">Comma separated list of column names.</p>
                                        </div>
                                    )}

                                    {operatorClass === 'pandas_transform' && (
                                        <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                                            <Braces className="h-8 w-8 mb-2 opacity-50" />
                                            <p className="text-xs">
                                                Generic transformations are best configured via the 
                                                <span className="text-primary font-medium cursor-pointer ml-1" onClick={() => setActiveTab('advanced')}>Advanced Tab</span>.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {nodeType === 'source' && (
                            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-sm text-blue-200/80">
                                <p>Source nodes are configured via the <strong>Connections</strong> page. Select the Connection ID in the Advanced tab.</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* --- JSON Editor Tab --- */}
                    <TabsContent value="advanced" className="m-0 h-full focus-visible:outline-none">
                        <div className="space-y-2 h-full">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Code className="h-3.5 w-3.5 text-muted-foreground" /> Raw Configuration
                                </Label>
                                <Badge variant="outline" className="text-[10px] h-5">JSON</Badge>
                            </div>
                            <Textarea 
                                {...register('config')}
                                className="font-mono text-xs leading-relaxed min-h-[300px] resize-none bg-[#0c0c0c] border-border/50 text-gray-300"
                                spellCheck={false}
                            />
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* --- Footer Actions --- */}
            <div className="p-6 border-t border-border/50 bg-background/50 backdrop-blur-md shrink-0 flex gap-3">
                <Button type="submit" className="flex-1 shadow-lg shadow-primary/20">
                    <Save className="mr-2 h-4 w-4" /> Apply Changes
                </Button>
                <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="shrink-0"
                    onClick={() => {
                        if(confirm('Delete this node? This cannot be undone.')) {
                            onDelete(node.id);
                            onClose();
                        }
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </Tabs>
      </form>
    </div>
  );
};