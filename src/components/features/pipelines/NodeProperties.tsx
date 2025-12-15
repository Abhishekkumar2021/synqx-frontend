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
    } catch (e) {
      alert("Invalid JSON configuration");
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* --- Header --- */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-4">
            <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center border shadow-lg ring-1 ring-white/10",
                node.type === 'source' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                node.type === 'transform' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                node.type === 'sink' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                "bg-primary/10 text-primary border-primary/20"
            )}>
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <h3 className="font-bold text-xl leading-tight">Properties</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5 opacity-70">{node.id}</p>
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* --- Tabs & Content --- */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-6 shrink-0">
                <TabsList className="w-full grid grid-cols-2 h-11 bg-white/5 rounded-2xl p-1">
                    <TabsTrigger value="settings" className="gap-2 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:shadow-sm"><Sliders className="h-4 w-4"/> Settings</TabsTrigger>
                    <TabsTrigger value="advanced" className="gap-2 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:shadow-sm"><Code className="h-4 w-4"/> Advanced</TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                    
                    {/* Common Fields */}
                    <div className="space-y-5">
                        <div className="space-y-2.5">
                            <Label className="text-sm font-semibold ml-1">Node Label</Label>
                            <Input 
                                {...register('label')} 
                                className="glass-input h-11 rounded-2xl" 
                            />
                        </div>
                        <div className="space-y-2.5">
                            <Label className="text-sm font-semibold ml-1">Operator Type</Label>
                            <div className="relative">
                                <select 
                                    {...register('type')}
                                    className="flex h-11 w-full items-center justify-between rounded-2xl glass-input px-4 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none transition-colors"
                                >
                                    <option value="source" className="bg-background">Source</option>
                                    <option value="transform" className="bg-background">Transform</option>
                                    <option value="sink" className="bg-background">Sink (Destination)</option>
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none opacity-50">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* --- Visual Editor Tab --- */}
                    <TabsContent value="settings" className="m-0 space-y-6 focus-visible:outline-none">
                        
                        {nodeType === 'transform' && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2.5">
                                    <Label className="text-primary font-semibold ml-1">Transformation Logic</Label>
                                    <div className="relative">
                                        <select 
                                            {...register('operator_class')}
                                            className="flex h-11 w-full items-center justify-between rounded-2xl glass-input px-4 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-primary appearance-none transition-colors"
                                        >
                                            <option value="pandas_transform" className="bg-background">Generic (Custom Code)</option>
                                            <option value="filter" className="bg-background">Filter Rows</option>
                                            <option value="join" className="bg-background">Join / Merge</option>
                                            <option value="aggregate" className="bg-background">Aggregate / Group By</option>
                                            <option value="drop_columns" className="bg-background">Drop Columns</option>
                                            <option value="deduplicate" className="bg-background">Deduplicate</option>
                                        </select>
                                        <div className="absolute right-3 top-3.5 pointer-events-none opacity-50">
                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Fields based on Operator Class */}
                                <div className="p-5 rounded-3xl border border-white/5 bg-white/5 space-y-5 shadow-inner">
                                    
                                    {operatorClass === 'filter' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="p-1.5 rounded-lg bg-purple-500/10">
                                                    <Filter className="h-4 w-4 text-purple-400" />
                                                </div>
                                                <span className="text-sm font-semibold">Filter Condition</span>
                                            </div>
                                            <Input 
                                                {...register('filter_condition', { onChange: (e) => syncVisualToConfig({ condition: e.target.value })})}
                                                placeholder="e.g. age > 18"
                                                className="font-mono text-xs glass-input h-10 rounded-xl"
                                            />
                                            <p className="text-[10px] text-muted-foreground pl-1">Pandas query string format.</p>
                                        </div>
                                    )}

                                    {operatorClass === 'join' && (
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-purple-500/10">
                                                    <Layers className="h-4 w-4 text-purple-400" />
                                                </div>
                                                <span className="text-sm font-semibold">Join Configuration</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium ml-1">Join Column</Label>
                                                    <Input 
                                                        {...register('join_on', { onChange: (e) => syncVisualToConfig({ on: e.target.value })})}
                                                        placeholder="id"
                                                        className="h-10 rounded-xl glass-input"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium ml-1">Join Type</Label>
                                                    <div className="relative">
                                                        <select 
                                                            {...register('join_type', { onChange: (e) => syncVisualToConfig({ how: e.target.value })})}
                                                            className="flex h-10 w-full rounded-xl glass-input px-3 py-1 text-sm shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
                                                        >
                                                            <option value="left" className="bg-background">Left</option>
                                                            <option value="inner" className="bg-background">Inner</option>
                                                            <option value="outer" className="bg-background">Full Outer</option>
                                                        </select>
                                                        <div className="absolute right-3 top-3.5 pointer-events-none opacity-50">
                                                            <svg width="8" height="5" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5"/></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {operatorClass === 'drop_columns' && (
                                        <div className="space-y-3">
                                            <Label className="ml-1 text-sm font-semibold">Columns to Drop</Label>
                                            <Input 
                                                {...register('drop_columns', { 
                                                    onChange: (e) => syncVisualToConfig({ columns: e.target.value.split(',') })
                                                })}
                                                placeholder="col1, col2, _metadata"
                                                className="h-10 rounded-xl glass-input"
                                            />
                                            <p className="text-[10px] text-muted-foreground pl-1">Comma separated list of column names.</p>
                                        </div>
                                    )}

                                    {operatorClass === 'pandas_transform' && (
                                        <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-black/10 rounded-2xl border border-dashed border-white/10">
                                            <Braces className="h-10 w-10 mb-3 opacity-30" />
                                            <p className="text-sm">
                                                Generic transformations are best configured via the 
                                                <span className="text-primary font-bold cursor-pointer ml-1 hover:underline" onClick={() => setActiveTab('advanced')}>Advanced Tab</span>.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {nodeType === 'source' && (
                            <div className="p-5 rounded-3xl border border-blue-500/20 bg-blue-500/5 text-sm text-blue-200/80 shadow-lg shadow-blue-500/5">
                                <p className="leading-relaxed">Source nodes are configured via the <strong>Connections</strong> page. Select the Connection ID in the Advanced tab.</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* --- JSON Editor Tab --- */}
                    <TabsContent value="advanced" className="m-0 h-full focus-visible:outline-none">
                        <div className="space-y-3 h-full">
                            <div className="flex items-center justify-between pl-1">
                                <Label className="flex items-center gap-2 text-sm font-semibold">
                                    <Code className="h-4 w-4 text-muted-foreground" /> Raw Configuration
                                </Label>
                                <Badge variant="outline" className="text-[10px] h-5 border-white/10 bg-white/5">JSON</Badge>
                            </div>
                            <Textarea 
                                {...register('config')}
                                className="font-mono text-xs leading-relaxed min-h-[350px] resize-none glass-input text-gray-300 rounded-2xl p-4 shadow-inner"
                                spellCheck={false}
                            />
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* --- Footer Actions --- */}
            <div className="p-6 border-t border-white/5 bg-white/5 backdrop-blur-xl shrink-0 flex gap-4">
                <Button type="submit" className="flex-1 shadow-lg shadow-primary/20 rounded-xl h-12 font-semibold text-base hover:scale-[1.02] transition-transform">
                    <Save className="mr-2 h-4 w-4" /> Apply Changes
                </Button>
                <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="shrink-0 h-12 w-12 rounded-xl shadow-lg shadow-destructive/20 hover:scale-105 transition-transform"
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
