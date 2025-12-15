/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
    X, Trash2, Save, Code, Sliders, 
    Filter, Layers, ArrowRightLeft, 
    Database, HardDriveUpload, PlayCircle,
    Braces, ChevronDown
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
                    <TabsTrigger value="settings" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"><Sliders className="h-4 w-4"/> Settings</TabsTrigger>
                    <TabsTrigger value="advanced" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"><Code className="h-4 w-4"/> Advanced</TabsTrigger>
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
                                <select 
                                    {...register('type')}
                                    className="flex h-11 w-full items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none transition-all hover:bg-background cursor-pointer text-foreground"
                                >
                                    <option value="source">Source</option>
                                    <option value="transform">Transform</option>
                                    <option value="sink">Sink (Destination)</option>
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-muted-foreground">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
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
                                        <select 
                                            {...register('operator_class')}
                                            className="flex h-11 w-full items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none transition-all hover:bg-background cursor-pointer text-foreground"
                                        >
                                            <option value="pandas_transform">Generic (Custom Code)</option>
                                            <option value="filter">Filter Rows</option>
                                            <option value="join">Join / Merge</option>
                                            <option value="aggregate">Aggregate / Group By</option>
                                            <option value="drop_columns">Drop Columns</option>
                                            <option value="deduplicate">Deduplicate</option>
                                        </select>
                                        <div className="absolute right-3 top-3.5 pointer-events-none text-muted-foreground">
                                            <ChevronDown className="h-4 w-4" />
                                        </div>
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
                                                {...register('filter_condition', { onChange: (e) => syncVisualToConfig({ condition: e.target.value })})}
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
                                                        {...register('join_on', { onChange: (e) => syncVisualToConfig({ on: e.target.value })})}
                                                        placeholder="id"
                                                        className="h-10 rounded-lg bg-background/80 border-border/50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium ml-1 text-muted-foreground">Join Type</Label>
                                                    <div className="relative">
                                                        <select 
                                                            {...register('join_type', { onChange: (e) => syncVisualToConfig({ how: e.target.value })})}
                                                            className="flex h-10 w-full rounded-lg border border-border/50 bg-background/80 px-3 py-1 text-sm shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
                                                        >
                                                            <option value="left">Left</option>
                                                            <option value="inner">Inner</option>
                                                            <option value="outer">Full Outer</option>
                                                        </select>
                                                        <div className="absolute right-3 top-3 pointer-events-none text-muted-foreground">
                                                            <ChevronDown className="h-3.5 w-3.5" />
                                                        </div>
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

                        {nodeType === 'source' && (
                            <div className="p-5 rounded-2xl border border-chart-1/20 bg-chart-1/5 text-sm text-foreground/80 shadow-sm">
                                <p className="leading-relaxed text-center">Source nodes are configured via the <strong>Connections</strong> page. <br/>Use the Advanced tab to verify the Connection ID.</p>
                            </div>
                        )}
                        
                        {nodeType === 'sink' && (
                            <div className="p-5 rounded-2xl border border-chart-2/20 bg-chart-2/5 text-sm text-foreground/80 shadow-sm">
                                <p className="leading-relaxed text-center">Data destinations are configured in the <strong>Settings</strong> page. <br/>Use the Advanced tab to set the target table name.</p>
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
                <Button 
                    type="button" 
                    variant="secondary" 
                    size="icon" 
                    className="shrink-0 h-12 w-12 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all"
                    onClick={() => {
                        if(confirm('Delete this node? This cannot be undone.')) {
                            onDelete(node.id);
                            onClose();
                        }
                    }}
                >
                    <Trash2 className="h-5 w-5" />
                </Button>
            </div>
        </Tabs>
      </form>
    </div>
  );
};