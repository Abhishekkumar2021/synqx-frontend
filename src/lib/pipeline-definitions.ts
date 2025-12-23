import { 
    Database, 
    HardDriveUpload, 
    ArrowRightLeft, 
    PlayCircle,
    Layers,
    ShieldCheck,
    Square
} from 'lucide-react';

export const NODE_DEFINITIONS = [
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
            { label: "Join Datasets", type: "join", opClass: "join", icon: Layers, desc: "Merge data based on keys" },
            { label: "Union All", type: "union", opClass: "union", icon: Layers, desc: "Combine datasets vertically" },
            { label: "Merge", type: "merge", opClass: "merge", icon: Layers, desc: "Upsert/Merge data logic" }
        ]
    },
    {
        category: "Transformation",
        items: [
            { label: "Filter Rows", type: "transform", opClass: "filter", icon: ArrowRightLeft, desc: "Filter based on predicates" },
            { label: "Map Fields", type: "transform", opClass: "map", icon: ArrowRightLeft, desc: "Transform column values" },
            { label: "Aggregate", type: "transform", opClass: "aggregate", icon: ArrowRightLeft, desc: "Group by and summarize" },
            { label: "Generic Pandas", type: "transform", opClass: "pandas_transform", icon: ArrowRightLeft, desc: "Custom Pandas operations" }
        ]
    },
    {
        category: "Data Quality",
        items: [
            { label: "Validate Schema", type: "validate", opClass: "validate", icon: ShieldCheck, desc: "Enforce schema & rules" },
            { label: "Deduplicate", type: "transform", opClass: "deduplicate", icon: ArrowRightLeft, desc: "Remove duplicate records" },
            { label: "Fill Nulls", type: "transform", opClass: "fill_nulls", icon: ArrowRightLeft, desc: "Impute missing values" },
            { label: "Type Cast", type: "transform", opClass: "type_cast", icon: ArrowRightLeft, desc: "Convert column types" }
        ]
    },
    {
        category: "Advanced",
        items: [
            { label: "Python Code", type: "transform", opClass: "code", icon: ArrowRightLeft, desc: "Arbitrary Python execution" },
            { label: "Rename Cols", type: "transform", opClass: "rename_columns", icon: ArrowRightLeft, desc: "Rename dataset columns" },
            { label: "Drop Cols", type: "transform", opClass: "drop_columns", icon: ArrowRightLeft, desc: "Remove specific columns" },
            { label: "Regex Replace", type: "transform", opClass: "regex_replace", icon: ArrowRightLeft, desc: "Pattern based replacement" },
            { label: "No-Op", type: "noop", opClass: "noop", icon: Square, desc: "Pass-through (Testing)" }
        ]
    }
];

// Helper: Map Backend OperatorType to Frontend Node Type
export const mapOperatorToNodeType = (opType: string) => {
    switch (opType) {
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

// Helper: Map Frontend Node Type to Backend OperatorType
export const mapNodeTypeToOperator = (nodeType: string, operatorClass?: string) => {
    // Explicit overrides based on operator class (backward compatibility or specific transforms)
    if (operatorClass === 'merge') return 'merge';
    if (operatorClass === 'union') return 'union';
    if (operatorClass === 'join') return 'join';
    if (operatorClass === 'validate') return 'validate';
    if (operatorClass === 'noop') return 'noop';
    
    // Direct mapping from Node Type
    switch (nodeType) {
        case 'source': return 'extract';
        case 'sink': return 'load';
        case 'join': return 'join';
        case 'union': return 'union';
        case 'merge': return 'merge';
        case 'validate': return 'validate';
        case 'noop': return 'noop';
        case 'transform': return 'transform';
        default: return 'transform';
    }
};

export const getNodeIcon = (type: string) => {
    switch (type) {
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
