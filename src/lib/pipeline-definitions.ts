/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
    Database, 
    HardDriveUpload, 
    ArrowRightLeft, 
    PlayCircle,
    Layers,
    ShieldCheck,
    Square,
    Filter,
    FileType,
    Type,
    Regex,
    Trash2,
    PaintBucket,
    SortAsc
} from 'lucide-react';
import { OperatorType } from './enums';

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
    opClass: string; 
    icon: any;
    desc: string;
    fields?: OperatorField[];
}

export const NODE_DEFINITIONS: { category: string; items: OperatorDefinition[] }[] = [
    {
        category: "IO Operations",
        items: [
            {
                label: "Extractor (Source)", 
                type: "source", 
                opClass: "extractor", 
                icon: Database, 
                desc: "Ingest data from a source connection" 
            },
            {
                label: "Loader (Sink)", 
                type: "sink", 
                opClass: "loader", 
                icon: HardDriveUpload, 
                desc: "Load data into a destination connection" 
            }
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
                            { label: 'Right', value: 'right' },
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
            },
            {
                label: "Merge (Upsert)", 
                type: "merge", 
                opClass: "merge", 
                icon: Layers, 
                desc: "Upsert/Merge data logic" 
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
                label: "Aggregate", 
                type: "transform", 
                opClass: "aggregate", 
                icon: ArrowRightLeft, 
                desc: "Group by and summarize",
                fields: [
                    { name: 'group_by', label: 'Group By', type: 'text', configKey: 'group_by', description: 'Comma separated columns' },
                    { name: 'aggregates', label: 'Aggregates', type: 'json', configKey: 'aggregates', placeholder: '{ "val": "sum" }' }
                ]
            },
            {
                label: "Sort Data", 
                type: "transform", 
                opClass: "sort", 
                icon: SortAsc, 
                desc: "Order data by columns",
                fields: [
                    { name: 'columns', label: 'Sort Columns', type: 'text', configKey: 'columns', description: 'Comma separated columns' },
                    {
                        name: 'ascending', label: 'Direction', type: 'select', configKey: 'ascending',
                        options: [
                            { label: 'Ascending', value: 'true' },
                            { label: 'Descending', value: 'false' }
                        ]
                    }
                ]
            },
            {
                label: "Generic Pandas", 
                type: "transform", 
                opClass: "pandas_transform", 
                icon: ArrowRightLeft, 
                desc: "Custom Pandas operations",
                fields: [
                    { name: 'filter_query', label: 'Filter Query', type: 'text', configKey: 'filter_query', placeholder: "col > 10" },
                    { name: 'rename_columns', label: 'Rename Mapping', type: 'json', configKey: 'rename_columns', placeholder: '{"old": "new"}' },
                    { name: 'drop_columns', label: 'Drop Columns', type: 'text', configKey: 'drop_columns', description: 'Comma separated' }
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
                    { name: 'subset', label: 'Subset Columns', type: 'text', configKey: 'subset', description: 'Comma separated' },
                    {
                        name: 'keep', label: 'Keep', type: 'select', configKey: 'keep',
                        options: [
                            { label: 'First', value: 'first' },
                            { label: 'Last', value: 'last' },
                            { label: 'None (Drop All)', value: 'false' }
                        ]
                    }
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
                        name: 'strategy', label: 'Strategy', type: 'select', configKey: 'strategy',
                        options: [
                            { label: 'Constant Value', value: '' },
                            { label: 'Mean', value: 'mean' },
                            { label: 'Median', value: 'median' },
                            { label: 'Mode', value: 'mode' },
                            { label: 'Forward Fill', value: 'ffill' },
                            { label: 'Backward Fill', value: 'bfill' }
                        ]
                    },
                    { name: 'value', label: 'Constant Value', type: 'text', configKey: 'value', description: 'Used if strategy is empty' },
                    { name: 'subset', label: 'Columns', type: 'text', configKey: 'subset', description: 'Comma separated (optional)' }
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
                    { name: 'casts', label: 'Type Mapping', type: 'json', configKey: 'casts', placeholder: '{ "col": "int" }' }
                ]
            },
            {
                label: "Rename Columns", 
                type: "transform", 
                opClass: "rename_columns", 
                icon: Type, 
                desc: "Rename dataset columns",
                fields: [
                    { name: 'rename_map', label: 'Rename Mapping', type: 'json', configKey: 'rename_map', placeholder: '{ "old": "new" }' }
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
            { label: "Python Code", type: "transform", opClass: "code", icon: PlayCircle, desc: "Arbitrary Python execution",
                fields: [
                    { name: 'code', label: 'Python Code', type: 'textarea', configKey: 'code', placeholder: "def transform(df):\n    return df" }
                ]
            },
            { label: "No-Op", type: "noop", opClass: "noop", icon: Square, desc: "Pass-through (Testing)" }
        ]
    }
];

// Helper: Map Backend OperatorType to Frontend Node Type
export const mapOperatorToNodeType = (opType: string) => {
    switch (opType?.toLowerCase()) {
        case OperatorType.EXTRACT: return 'source';
        case OperatorType.LOAD: return 'sink';
        case OperatorType.TRANSFORM: return 'transform';
        case OperatorType.VALIDATE: return 'validate';
        case OperatorType.NOOP: return 'noop';
        case OperatorType.MERGE: return 'merge';
        case OperatorType.UNION: return 'union';
        case OperatorType.JOIN: return 'join';
        default: return 'default';
    }
};

// Helper: Map Frontend Node Type to Backend OperatorType
export const mapNodeTypeToOperator = (nodeType: string, operatorClass?: string) => {
    // Explicit overrides based on operator class (backward compatibility or specific transforms)
    if (operatorClass === 'merge') return OperatorType.MERGE;
    if (operatorClass === 'union') return OperatorType.UNION;
    if (operatorClass === 'join') return OperatorType.JOIN;
    if (operatorClass === 'validate') return OperatorType.VALIDATE;
    if (operatorClass === 'noop') return OperatorType.NOOP;
    
    // Direct mapping from Node Type
    switch (nodeType?.toLowerCase()) {
        case 'source': return OperatorType.EXTRACT;
        case 'sink': return OperatorType.LOAD;
        case 'join': return OperatorType.JOIN;
        case 'union': return OperatorType.UNION;
        case 'merge': return OperatorType.MERGE;
        case 'validate': return OperatorType.VALIDATE;
        case 'noop': return OperatorType.NOOP;
        case 'transform': return OperatorType.TRANSFORM;
        default: return OperatorType.TRANSFORM;
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