import React, { useState, useMemo } from 'react';
import {
    Code2, Filter, ArrowRightLeft,
    Type, Hash, Search,
    Copy, FileCode, Sliders, X,
    Database, HardDriveUpload, CheckCircle2,
    PlayCircle, GitMerge, Layers} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from '@/components/ui/docs/CodeBlock';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OperatorDef {
    id: string;
    name: string;
    type: 'extract' | 'load' | 'transform' | 'validate' | 'noop' | 'merge' | 'union' | 'join';
    description: string;
    icon: React.ElementType;
    category: 'Sources' | 'Destinations' | 'Transformations' | 'Set Operations' | 'Data Quality' | 'Advanced' | 'Formatting';
    color: string;
    configSchema: Record<string, string>;
    example: string;
}

const OPERATORS: OperatorDef[] = [
    // --- Sources ---
    {
        id: 'source_connector',
        name: 'Extractor (Source)',
        type: 'extract',
        description: 'Ingest data from a configured source connector (Database, API, File, etc.).',
        icon: Database,
        category: 'Sources',
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        configSchema: {
            "connection_id": "integer (required)",
            "asset_id": "integer (required)",
            "incremental": "boolean (default: false)"
        },
        example: `{ 
  "operator_type": "extract",
  "config": {
    "connection_id": 101,
    "asset_id": 55,
    "incremental": true
  }
}`
    },
    // --- Destinations ---
    {
        id: 'destination_sink',
        name: 'Loader (Sink)',
        type: 'load',
        description: 'Load processed data into a destination target.',
        icon: HardDriveUpload,
        category: 'Destinations',
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        configSchema: {
            "connection_id": "integer (required)",
            "asset_id": "integer (required)",
            "mode": "string ('append', 'replace', 'upsert')"
        },
        example: `{ 
  "operator_type": "load",
  "config": {
    "connection_id": 202,
    "asset_id": 88,
    "mode": "append"
  }
}`
    },
    // --- Set Operations ---
    {
        id: 'join',
        name: 'Join Datasets',
        type: 'join',
        description: 'Merge two datasets horizontally based on a common key.',
        icon: GitMerge,
        category: 'Set Operations',
        color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        configSchema: {
            "on": "string (column name)",
            "how": "string ('inner', 'left', 'right', 'outer')",
            "right_on": "string (optional, if different)"
        },
        example: `{ 
  "operator_type": "join",
  "operator_class": "join",
  "config": {
    "on": "user_id",
    "how": "inner"
  }
}`
    },
    {
        id: 'union',
        name: 'Union All',
        type: 'union',
        description: 'Combine multiple datasets vertically (stacking rows).',
        icon: Layers,
        category: 'Set Operations',
        color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        configSchema: {
            "deduplicate": "boolean (default: false)"
        },
        example: `{ 
  "operator_type": "union",
  "operator_class": "union",
  "config": {
    "deduplicate": false
  }
}`
    },
    // --- Transformations ---
    {
        id: 'filter',
        name: 'Filter Rows',
        type: 'transform',
        description: 'Filter dataset rows based on a condition string (Pandas query syntax).',
        icon: Filter,
        category: 'Transformations',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        configSchema: {
            "query": "string (e.g. 'age > 18')"
        },
        example: `{ 
  "operator_type": "transform",
  "operator_class": "filter",
  "config": {
    "query": "status == 'active' and score >= 0.8"
  }
}`
    },
    {
        id: 'map',
        name: 'Map Values',
        type: 'transform',
        description: 'Map values in a column using a dictionary or expression.',
        icon: ArrowRightLeft,
        category: 'Transformations',
        color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        configSchema: {
            "column": "string",
            "mapping": "dict",
            "default": "any (optional)"
        },
        example: `{ 
  "operator_type": "transform",
  "operator_class": "map",
  "config": {
    "column": "country_code",
    "mapping": {
      "US": "United States",
      "UK": "United Kingdom"
    },
    "default": "Unknown"
  }
}`
    },
    {
        id: 'rename_columns',
        name: 'Rename Columns',
        type: 'transform',
        description: 'Rename one or more columns in the dataset.',
        icon: Type,
        category: 'Formatting',
        color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
        configSchema: {
            "columns": "dict {old_name: new_name}"
        },
        example: `{ 
  "operator_type": "transform",
  "operator_class": "rename_columns",
  "config": {
    "columns": {
      "id": "user_id",
      "created_at": "timestamp"
    }
  }
}`
    },
    {
        id: 'drop_columns',
        name: 'Drop Columns',
        type: 'transform',
        description: 'Remove specific columns from the dataset.',
        icon: X,
        category: 'Formatting',
        color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        configSchema: {
            "columns": "list[string]"
        },
        example: `{ 
  "operator_type": "transform",
  "operator_class": "drop_columns",
  "config": {
    "columns": ["internal_id", "temp_flag"]
  }
}`
    },
    {
        id: 'type_cast',
        name: 'Type Cast',
        type: 'transform',
        description: 'Convert column data types (e.g., string to int).',
        icon: Hash,
        category: 'Data Quality',
        color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
        configSchema: {
            "columns": "dict {column: type}"
        },
        example: `{ 
  "operator_type": "transform",
  "operator_class": "type_cast",
  "config": {
    "columns": {
      "price": "float",
      "quantity": "int",
      "is_active": "bool"
    }
  }
}`
    },
    {
        id: 'fill_nulls',
        name: 'Fill Nulls',
        type: 'transform',
        description: 'Replace missing (NaN/Null) values with a specified value.',
        icon: Sliders,
        category: 'Data Quality',
        color: 'text-lime-500 bg-lime-500/10 border-lime-500/20',
        configSchema: {
            "columns": "list[string] (optional)",
            "value": "any",
            "method": "string ('ffill', 'bfill')"
        },
        example: `{ 
  "operator_type": "transform",
  "operator_class": "fill_nulls",
  "config": {
    "value": 0,
    "columns": ["score", "count"]
  }
}`
    },
    {
        id: 'deduplicate',
        name: 'Deduplicate',
        type: 'transform',
        description: 'Remove duplicate rows based on specific columns.',
        icon: Copy,
        category: 'Data Quality',
        color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
        configSchema: {
            "subset": "list[string]",
            "keep": "string ('first', 'last', false)"
        },
        example: `{ 
  "operator_type": "transform",
  "operator_class": "deduplicate",
  "config": {
    "subset": ["email"],
    "keep": "last"
  }
}`
    },
    // --- Advanced ---
    {
        id: 'code',
        name: 'Python Code',
        type: 'transform',
        description: 'Execute arbitrary Python code to transform the DataFrame.',
        icon: Code2,
        category: 'Advanced',
        color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        configSchema: {
            "code": "string"
        },
        example: `{ 
  "operator_type": "transform",
  "operator_class": "code",
  "config": {
    "code": "def transform(df):\n    df['total'] = df['price'] * df['qty']\n    return df"
  }
}`
    },
    {
        id: 'regex_replace',
        name: 'Regex Replace',
        type: 'transform',
        description: 'Replace string patterns using Regular Expressions.',
        icon: FileCode,
        category: 'Formatting',
        color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
        configSchema: {
            "column": "string",
            "pattern": "string",
            "replacement": "string"
        },
        example: `{ 
  "operator_type": "transform",
  "operator_class": "regex_replace",
  "config": {
    "column": "phone",
    "pattern": "[^0-9]",
    "replacement": ""
  }
}`
    },
    {
        id: 'validate',
        name: 'Validate Schema',
        type: 'validate',
        description: 'Enforce schema rules and data expectations.',
        icon: CheckCircle2,
        category: 'Data Quality',
        color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
        configSchema: {
            "schema": "dict (column: type)",
            "strict": "boolean"
        },
        example: `{ 
  "operator_type": "validate",
  "operator_class": "schema_check",
  "config": {
    "schema": { "id": "int", "email": "string" },
    "strict": true
  }
}`
    },
    {
        id: 'noop',
        name: 'No-Op',
        type: 'noop',
        description: 'Pass-through operator for testing or placeholders.',
        icon: PlayCircle,
        category: 'Advanced',
        color: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
        configSchema: {},
        example: `{ 
  "operator_type": "noop",
  "config": {}
}`
    }
];

export const OperatorLibrary: React.FC = () => {
    const [selectedOp, setSelectedOp] = useState<OperatorDef | null>(null);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState<string | null>(null);

    const filtered = useMemo(() => OPERATORS.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                            t.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory ? t.category === filterCategory : true;
        return matchesSearch && matchesCategory;
    }), [search, filterCategory]);

    const categories = useMemo(() => Array.from(new Set(OPERATORS.map(t => t.category))), []);

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Search & Category Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shrink-0 animate-in fade-in duration-500">
                <div className="relative group w-full md:w-80">
                    <Search className="z-20 absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        className="pl-12 h-11 rounded-2xl bg-background/50 border-border/40 focus:bg-background focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm text-xs font-bold"
                        placeholder="Search operators..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-1.5 p-1.5 bg-muted/20 rounded-2xl shadow-inner ring-1 ring-white/5 dark:ring-white/10 overflow-x-auto max-w-full scrollbar-none">
                    <button 
                        onClick={() => setFilterCategory(null)}
                        className={cn(
                            "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 whitespace-nowrap",
                            filterCategory === null ? "bg-background text-primary shadow-lg ring-1 ring-black/5 dark:ring-white/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        All Units
                    </button>
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={cn(
                                "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 whitespace-nowrap",
                                filterCategory === cat ? "bg-background text-primary shadow-lg ring-1 ring-black/5 dark:ring-white/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Operator Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-0.5 pb-10">
                <AnimatePresence mode="popLayout">
                    {filtered.map((op, idx) => (
                        <motion.div
                            key={op.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: idx * 0.01 }}
                            onClick={() => setSelectedOp(op)}
                            className="group p-6 rounded-[2rem] border border-border/40 bg-background/40 backdrop-blur-md hover:bg-background/60 hover:border-primary/30 hover:shadow-2xl hover:-translate-y-1 cursor-pointer transition-all duration-500 flex flex-col relative overflow-hidden active:scale-[0.98] ring-1 ring-white/5 shadow-sm"
                        >
                            {/* Visual Accent */}
                            <div className={cn("absolute -top-10 -right-10 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full", op.color.split(' ')[0].replace('text-', 'bg-'))} />

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className={cn("p-3 rounded-2xl border border-border/40 transition-all duration-500 group-hover:scale-110 shadow-sm bg-background/50 backdrop-blur-md", op.color)}>
                                    <op.icon size={22} strokeWidth={2.5} />
                                </div>
                                <Badge variant="outline" className="rounded-lg text-[8px] px-2 py-0.5 border-border/60 font-black uppercase tracking-widest bg-background/50">
                                    {op.category}
                                </Badge>
                            </div>
                            <h3 className="font-black text-lg tracking-tighter mb-2 text-foreground relative z-10">{op.name}</h3>
                            <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-3 relative z-10 group-hover:text-muted-foreground transition-colors">{op.description}</p>
                            
                            <div className="mt-auto pt-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2.5 group-hover:translate-x-0 relative z-10">
                                Inspect Node <ArrowRightLeft size={10} className="-rotate-45" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* macOS Style Detail Dialog */}
            <Dialog open={!!selectedOp} onOpenChange={(open) => !open && setSelectedOp(null)}>
                <DialogContent className="sm:max-w-[720px] p-0 border-border/60 bg-background/95 backdrop-blur-3xl shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden ring-1 ring-white/10">
                    {selectedOp && (
                        <div className="flex flex-col h-full relative">
                            {/* Visual Background Accent */}
                            <div className={cn("absolute top-0 right-0 w-[400px] h-[400px] blur-[120px] opacity-20 pointer-events-none rounded-full", selectedOp.color.split(' ')[0].replace('text-', 'bg-'))} />

                            {/* Visual Header */}
                            <div className="p-10 pb-8 relative z-10">
                                <div className="flex items-start gap-8">
                                    <div className={cn("p-6 rounded-[2rem] bg-background shadow-2xl border transition-all duration-700 ring-1 ring-white/10 group-hover:scale-105", selectedOp.color)}>
                                        <selectedOp.icon size={48} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge className={cn("border-none text-[9px] font-black px-3 py-1 uppercase tracking-widest rounded-full shadow-lg", selectedOp.color)}>
                                                    {selectedOp.category}
                                                </Badge>
                                                <div className="h-4 w-px bg-border/40" />
                                                <span className="text-[10px] font-mono font-black opacity-30 uppercase tracking-[0.3em]">{selectedOp.id}</span>
                                            </div>
                                        </div>
                                        <DialogTitle className="text-4xl font-black tracking-tighter text-foreground leading-none">
                                            {selectedOp.name}
                                        </DialogTitle>
                                        <DialogDescription className="text-base text-muted-foreground/80 leading-relaxed tracking-tight">
                                            {selectedOp.description}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </div>

                            {/* macOS Style Segmented Controls (Tabs) */}
                            <Tabs defaultValue="config" className="w-full flex-1 relative z-10 flex flex-col min-h-0">
                                <div className="px-10 py-4 shrink-0">
                                    <TabsList className="
                                        w-full bg-muted/30 p-1.5 rounded-[1.5rem] h-14 backdrop-blur-md 
                                        border border-border/40 shadow-inner gap-1 ring-1 ring-white/5
                                    ">
                                        <TabsTrigger 
                                            value="config" 
                                            className="
                                                flex-1 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500
                                                data-[state=active]:bg-background
                                                data-[state=active]:shadow-2xl 
                                                data-[state=active]:text-primary
                                                data-[state=active]:ring-1 data-[state=active]:ring-black/5
                                            "
                                        >
                                            Architecture
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="example" 
                                            className="
                                                flex-1 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500
                                                data-[state=active]:bg-background
                                                data-[state=active]:shadow-2xl 
                                                data-[state=active]:text-primary
                                                data-[state=active]:ring-1 data-[state=active]:ring-black/5
                                            "
                                        >
                                            Implementation
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    <TabsContent value="config" className="m-0 h-full p-10 pt-4 overflow-y-auto custom-scrollbar">
                                        <div className="space-y-8 pb-10">
                                            <div className="space-y-4">
                                                <h4 className="flex items-center gap-3 text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.3em] ml-1">
                                                    <Sliders size={14} className="text-primary/60" /> Hardware Schema
                                                </h4>
                                                <div className="grid gap-3">
                                                    {Object.entries(selectedOp.configSchema).map(([key, type]) => (
                                                        <div key={key} className="flex items-center justify-between p-5 rounded-2xl bg-white/2 border border-border/40 hover:bg-white/4 transition-all duration-300 group shadow-inner ring-1 ring-white/5">
                                                            <div className="flex flex-col gap-1">
                                                                <code className="text-base font-black text-foreground font-mono tracking-tighter group-hover:text-primary transition-colors">{key}</code>
                                                                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">Parameter Key</span>
                                                            </div>
                                                            <Badge variant="outline" className="text-[10px] font-black text-muted-foreground/60 bg-muted/50 border-border/40 px-4 py-1 rounded-lg uppercase tracking-widest">
                                                                {type}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                    {Object.keys(selectedOp.configSchema).length === 0 && (
                                                        <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-border/40 gap-4 text-muted-foreground/40">
                                                            <Layers size={40} className="opacity-20" />
                                                            <span className="text-xs font-black uppercase tracking-[0.3em]">Static Node Unit</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="example" className="m-0 h-full">
                                        <CodeBlock 
                                            language="json" 
                                            code={selectedOp.example} 
                                            className="h-full rounded-none border-0 font-mono text-xs leading-relaxed"
                                            title="manifest.json"
                                        />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
