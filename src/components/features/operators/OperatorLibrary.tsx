import React, { useState, useMemo } from 'react';
import {
    Code2, Filter, ArrowRightLeft,
    Type, Hash, Search,
    Copy, FileCode, Sliders, X,
    Database, HardDriveUpload, CheckCircle2,
    PlayCircle, GitMerge, Layers} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CodeBlock } from '@/components/ui/docs/CodeBlock';
import { motion, AnimatePresence } from 'framer-motion';
interface OperatorDef {
    id: string;
    name: string;
    type: 'extract' | 'load' | 'transform' | 'validate' | 'noop' | 'merge' | 'union' | 'join';
    description: string;
    icon: React.ElementType;
    category: 'Sources' | 'Destinations' | 'Transformations' | 'Set Operations' | 'Data Quality' | 'Advanced' | 'Formatting';
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
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-muted/20 p-4 rounded-3xl border border-border/40 backdrop-blur-md">
                <div className="relative group w-full md:w-80">
                    <Search className="z-20 absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        className="pl-11 h-11 rounded-2xl bg-background/50 border-border/50 focus:bg-background focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"placeholder="Search operators..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                <ScrollArea className="w-full md:w-auto">
                    <div className="flex gap-2">
                        <Button 
                            variant={filterCategory === null ? "default" : "ghost"} 
                            size="sm"
                            onClick={() => setFilterCategory(null)}
                            className="rounded-full px-4 h-8 text-[11px] font-bold uppercase"
                        >
                            All
                        </Button>
                        {categories.map(cat => (
                            <Button 
                                key={cat}
                                variant={filterCategory === cat ? "default" : "ghost"} 
                                size="sm"
                                onClick={() => setFilterCategory(cat)}
                                className="rounded-full px-4 h-8 text-[11px] font-bold uppercase"
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
            </div>

            {/* Operator Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                    {filtered.map((op, idx) => (
                        <motion.div
                            key={op.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: idx * 0.01 }}
                            onClick={() => setSelectedOp(op)}
                            className="group p-5 rounded-3xl glass-card glass-card-hover cursor-pointer border-0"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/10 shadow-sm">
                                    <op.icon size={20} />
                                </div>
                                <Badge variant="outline" className="rounded-full text-[9px] px-2 py-0 border-border/40 font-bold uppercase">
                                    {op.category}
                                </Badge>
                            </div>
                            <h3 className="font-bold text-base tracking-tight mb-1">{op.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{op.description}</p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* macOS Style Detail Dialog */}
            <Dialog open={!!selectedOp} onOpenChange={(open) => !open && setSelectedOp(null)}>
                <DialogContent className="sm:max-w-[680px] p-0 border-0 glass-panel shadow-2xl rounded-[2.5rem] overflow-hidden">
                    {selectedOp && (
                        <div className="flex flex-col h-full bg-linear-to-b from-transparent to-muted/20">
                            {/* Visual Header */}
                            <div className="p-8 pb-4 relative">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 rounded-3xl bg-background shadow-xl border border-border/50 text-primary ring-1 ring-black/5 dark:ring-white/10">
                                        <selectedOp.icon size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-primary/20 text-primary border-primary/20 text-[10px] font-black px-2 uppercase">
                                                {selectedOp.category}
                                            </Badge>
                                            <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest">{selectedOp.id}</span>
                                        </div>
                                        <DialogTitle className="text-3xl font-black tracking-tighter">
                                            {selectedOp.name}
                                        </DialogTitle>
                                    </div>
                                </div>
                                <DialogDescription className="mt-6 text-base text-muted-foreground font-medium leading-relaxed">
                                    {selectedOp.description}
                                </DialogDescription>
                            </div>

                            {/* macOS Style Segmented Controls (Tabs) */}
                            <Tabs defaultValue="config" className="w-full flex-1">
                                <div className="px-8 py-2">
                                    <TabsList className="
                                        w-full bg-black/5 dark:bg-white/5 
                                        p-1 rounded-2xl h-11 backdrop-blur-md 
                                        border border-black/3 dark:border-white/5
                                    ">
                                        <TabsTrigger 
                                            value="config" 
                                            className="
                                                flex-1 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                                                data-[state=active]:bg-white dark:data-[state=active]:bg-card
                                                data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.1)] 
                                                dark:data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.4)]
                                                data-[state=active]:text-primary
                                            "
                                        >
                                            Configuration
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="example" 
                                            className="
                                                flex-1 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                                                data-[state=active]:bg-white dark:data-[state=active]:bg-card
                                                data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.1)] 
                                                dark:data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.4)]
                                                data-[state=active]:text-primary
                                            "
                                        >
                                            JSON Example
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="h-[400px] overflow-hidden">
                                    <TabsContent value="config" className="m-0 h-full p-8 overflow-y-auto">
                                        <div className="space-y-4">
                                            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                                                <Sliders size={12} /> Expected Parameters
                                            </h4>
                                            <div className="grid gap-2">
                                                {Object.entries(selectedOp.configSchema).map(([key, type]) => (
                                                    <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-card/50 border border-border/40 hover:bg-card transition-colors">
                                                        <code className="text-sm font-black text-primary font-mono">{key}</code>
                                                        <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border/50 px-2 py-1 rounded-lg">
                                                            {type}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="example" className="m-0 h-full bg-black/5 dark:bg-black/20">
                                        <CodeBlock 
                                            language="json" 
                                            code={selectedOp.example} 
                                            className="h-full rounded-none border-0"
                                            title="payload.json"
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
