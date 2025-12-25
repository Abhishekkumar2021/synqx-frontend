import { 
    Database, 
    HardDriveUpload, 
    ArrowRightLeft, 
    PlayCircle,
    Layers,
    ShieldCheck,
    Square,
    Filter,
    ListPlus,
    FileType,
    Type,
    Regex,
    Trash2,
    PaintBucket
} from 'lucide-react';

export interface OperatorField {
    name: string;
    label: string;
    type: 'text' | 'select' | 'textarea' | 'number' | 'json';
    placeholder?: string;
    options?: { label: string; value: string }[];
    configKey: string; // The key in the JSON config
    description?: string;
}

export interface OperatorDefinition {
    label: string;
    type: string;
    opClass?: string;
    icon: any;
    desc: string;
    fields?: OperatorField[];
}

export const NODE_DEFINITIONS: { category: string; items: OperatorDefinition[] }[] = [
    {
        category: "IO Operations",
        items: [
            { label: "Extractor (Source)", type: "source", icon: Database, desc: "Ingest data from configured sources" },
            { label: "Loader (Sink)", type: "sink", icon: HardDriveUpload, desc: "Load data into destination targets" }
        ]
    },
    {
        category: "Set Operations",
        items: [
            { 
                label: "Join Datasets", 
                type: "join", 
                opClass: "join", 
                icon: Layers, 
                desc: "Merge data based on keys",
                fields: [
                    { name: 'on', label: 'Join Key', type: 'text', configKey: 'on', placeholder: 'id' },
                    { 
                        name: 'how', label: 'Join Type', type: 'select', configKey: 'how', 
                        options: [
                            { label: 'Inner', value: 'inner' },
                            { label: 'Left', value: 'left' },
                            { label: 'Outer', value: 'outer' }
                        ] 
                    }
                ]
            },
            { 
                label: "Union All", 
                type: "union", 
                opClass: "union", 
                icon: Layers, 
                desc: "Combine datasets vertically" 
            }
        ]
    },
    {
        category: "Transformation",
        items: [
            { 
                label: "Filter Rows", 
                type: "transform", 
                opClass: "filter", 
                icon: Filter, 
                desc: "Filter based on predicates",
                fields: [
                    { name: 'condition', label: 'Filter Condition', type: 'text', configKey: 'condition', placeholder: "status == 'active'" }
                ]
            },
            { 
                label: "Map Fields", 
                type: "transform", 
                opClass: "map", 
                icon: ListPlus, 
                desc: "Transform column values",
                fields: [
                    { name: 'transformations', label: 'Transformations', type: 'json', configKey: 'transformations', placeholder: '{ "new_col": "col1 * 2" }' }
                ]
            },
            { 
                label: "Aggregate", 
                type: "transform", 
                opClass: "aggregate", 
                icon: ArrowRightLeft, 
                desc: "Group by and summarize",
                fields: [
                    { name: 'group_by', label: 'Group By', type: 'text', configKey: 'group_by', description: 'Comma separated columns' },
                    { name: 'aggregates', label: 'Aggregates', type: 'json', configKey: 'aggregates', placeholder: '{ "val": "sum" }' }
                ]
            }
        ]
    },
    {
        category: "Data Quality",
        items: [
            { 
                label: "Validate Schema", 
                type: "validate", 
                opClass: "validate", 
                icon: ShieldCheck, 
                desc: "Enforce schema & rules",
                fields: [
                    { name: 'schema', label: 'Validation Rules', type: 'json', configKey: 'schema', placeholder: '[ { "column": "id", "check": "not_null" } ]' }
                ]
            },
            { 
                label: "Deduplicate", 
                type: "transform", 
                opClass: "deduplicate", 
                icon: Square, 
                desc: "Remove duplicate records",
                fields: [
                    { name: 'subset', label: 'Subset Columns', type: 'text', configKey: 'subset', description: 'Comma separated' }
                ]
            },
            { 
                label: "Fill Nulls", 
                type: "transform", 
                opClass: "fill_nulls", 
                icon: PaintBucket, 
                desc: "Impute missing values",
                fields: [
                    { 
                        name: 'method', label: 'Method', type: 'select', configKey: 'method',
                        options: [
                            { label: 'Value', value: 'value' },
                            { label: 'Forward Fill', value: 'ffill' },
                            { label: 'Backward Fill', value: 'bfill' }
                        ]
                    },
                    { name: 'value', label: 'Constant Value', type: 'text', configKey: 'value' }
                ]
            }
        ]
    },
    {
        category: "Advanced",
        items: [
            { 
                label: "Type Cast", 
                type: "transform", 
                opClass: "type_cast", 
                icon: FileType, 
                desc: "Convert column types",
                fields: [
                    { name: 'cast_mapping', label: 'Type Mapping', type: 'json', configKey: 'cast_mapping', placeholder: '{ "col": "int" }' }
                ]
            },
            { 
                label: "Rename Columns", 
                type: "transform", 
                opClass: "rename_columns", 
                icon: Type, 
                desc: "Rename dataset columns",
                fields: [
                    { name: 'rename_mapping', label: 'Rename Mapping', type: 'json', configKey: 'rename_mapping', placeholder: '{ "old": "new" }' }
                ]
            },
            { 
                label: "Drop Columns", 
                type: "transform", 
                opClass: "drop_columns", 
                icon: Trash2, 
                desc: "Remove specific columns",
                fields: [
                    { name: 'columns', label: 'Target Columns', type: 'text', configKey: 'columns', description: 'Comma separated' }
                ]
            },
            { 
                label: "Regex Replace", 
                type: "transform", 
                opClass: "regex_replace", 
                icon: Regex, 
                desc: "Pattern based replacement",
                fields: [
                    { name: 'column', label: 'Column', type: 'text', configKey: 'column' },
                    { name: 'pattern', label: 'Pattern', type: 'text', configKey: 'pattern' },
                    { name: 'replacement', label: 'Replacement', type: 'text', configKey: 'replacement' }
                ]
            },
            { label: "Python Code", type: "transform", opClass: "code", icon: PlayCircle, desc: "Arbitrary Python execution" },
            { label: "No-Op", type: "noop", opClass: "noop", icon: Square, desc: "Pass-through (Testing)" }
        ]
    }
];

// Helper: Map Backend OperatorType to Frontend Node Type
export const mapOperatorToNodeType = (opType: string) => {
    switch (opType?.toLowerCase()) {
        case 'extract': return 'source';
        case 'load': return 'sink';
        case 'transform': return 'transform';
        case 'validate': return 'validate';
        case 'noop': return 'noop';
        case 'merge': return 'merge';
        case 'union': return 'union';
        case 'join': return 'join';
        default: return 'default';
    }
};

export const getNodeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'source': return Database;
        case 'sink': return HardDriveUpload;
        case 'join': 
        case 'union':
        case 'merge': return Layers;
        case 'validate': return ShieldCheck;
        case 'noop': return Square;
        case 'transform': return ArrowRightLeft;
        default: return PlayCircle;
    }
}

export const getOperatorDefinition = (opClass: string): OperatorDefinition | undefined => {
    for (const cat of NODE_DEFINITIONS) {
        const item = cat.items.find(i => i.opClass === opClass);
        if (item) return item;
    }
    return undefined;
};