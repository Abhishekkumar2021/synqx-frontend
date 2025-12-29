/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, useCallback } from 'react';
import {
    Folder, File, ChevronRight, Home, 
    FileJson, FileText, Database, HardDrive,
    Search, Filter, ArrowLeft, 
    FileSpreadsheet, FileCode, Clock, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AssetFileExplorerProps {
    assets: any[]; 
    selectedAssets?: Set<string>;
    onToggleAsset?: (name: string, checked: boolean) => void;
    onToggleAll?: (checked: boolean) => void;
    readOnly?: boolean;
}

type FileSystemNode = {
    name: string;
    path: string; 
    type: 'directory' | 'file';
    asset?: any; 
    children?: Record<string, FileSystemNode>;
};

export const AssetFileExplorer: React.FC<AssetFileExplorerProps> = ({ 
    assets, 
    selectedAssets = new Set(), 
    onToggleAsset,
    onToggleAll,
    readOnly = false
}) => {
    const [currentPath, setCurrentPath] = useState<string>("");    const [searchQuery, setSearchQuery] = useState("");

    // Build Tree Structure
    const fileSystem = useMemo(() => {
        const root: FileSystemNode = { name: "root", path: "", type: "directory", children: {} };

        assets.forEach(asset => {
            const rawPath = (asset.fully_qualified_name || asset.name).replace(/\\/g, '/');
            const parts = rawPath.split('/').filter(Boolean);
            
            let currentLevel = root;
            
            parts.forEach((part: string | number, index: number) => {
                const isLast = index === parts.length - 1;
                const pathSoFar = parts.slice(0, index + 1).join('/');
                
                if (!currentLevel.children) currentLevel.children = {};

                if (!currentLevel.children[part]) {
                    currentLevel.children[part] = {
                        name: part as string,
                        path: pathSoFar,
                        type: isLast ? 'file' : 'directory',
                        children: isLast ? undefined : {},
                        asset: isLast ? asset : undefined
                    };
                }
                
                if (!isLast && currentLevel.children[part].type === 'file') {
                     currentLevel.children[part].type = 'directory';
                     currentLevel.children[part].children = currentLevel.children[part].children || {};
                }

                currentLevel = currentLevel.children[part];
            });
        });

        return root;
    }, [assets]);

    const getCurrentNode = (path: string): FileSystemNode | undefined => {
        if (!path) return fileSystem;
        const parts = path.split('/').filter(Boolean);
        let current = fileSystem;
        for (const part of parts) {
            if (current.children && current.children[part]) {
                current = current.children[part];
            } else {
                return undefined;
            }
        }
        return current;
    };

    const currentNode = getCurrentNode(currentPath);
    
    // Helper to get all file names under a node recursively
    const getAllFilesUnderNode = useCallback((node: FileSystemNode): string[] => {
        let results: string[] = [];
        if (node.type === 'file' && node.asset) {
            results.push(node.asset.name);
        }
        if (node.children) {
            Object.values(node.children).forEach(child => {
                results = results.concat(getAllFilesUnderNode(child));
            });
        }
        return results;
    }, []);

    // Filter and sort items
    const items = useMemo(() => {
        if (!currentNode?.children) return [];
        let allItems = Object.values(currentNode.children);
        
        if (searchQuery) {
            allItems = allItems.filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return allItems.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'directory' ? -1 : 1;
        });
    }, [currentNode, searchQuery]);

    const handleNavigateUp = () => {
        if (!currentPath) return;
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        setCurrentPath(parts.join('/'));
    };

    const breadcrumbs = currentPath.split('/').filter(Boolean);

    const getIcon = (item: FileSystemNode) => {
        if (item.type === 'directory') return <Folder className="h-4 w-4 text-blue-500 fill-blue-500/20" />;
        const ext = item.name.split('.').pop()?.toLowerCase();
        if (['json', 'jsonl'].includes(ext || '')) return <FileJson className="h-4 w-4 text-amber-500" />;
        if (['csv', 'tsv', 'txt'].includes(ext || '')) return <FileText className="h-4 w-4 text-emerald-500" />;
        if (['parquet', 'avro'].includes(ext || '')) return <Database className="h-4 w-4 text-purple-500" />;
        if (['xls', 'xlsx'].includes(ext || '')) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
        if (['xml'].includes(ext || '')) return <FileCode className="h-4 w-4 text-orange-500" />;
        return <File className="h-4 w-4 text-slate-400" />;
    };

    // Selection Logic
    const allFilesUnderCurrent = useMemo(() => 
        currentNode ? getAllFilesUnderNode(currentNode) : []
    , [currentNode, getAllFilesUnderNode]);

    const selectedFilesUnderCurrent = allFilesUnderCurrent.filter(name => selectedAssets.has(name));
    
    const isAllSelected = allFilesUnderCurrent.length > 0 && selectedFilesUnderCurrent.length === allFilesUnderCurrent.length;
    const isIndeterminate = selectedFilesUnderCurrent.length > 0 && selectedFilesUnderCurrent.length < allFilesUnderCurrent.length;

    const handleToggleCurrentFolder = (checked: boolean) => {
        allFilesUnderCurrent.forEach(name => {
            onToggleAsset?.(name, checked);
        });
    };

    const handleToggleGlobal = () => {
        const allAssetNames = assets.map(a => a.name);
        const shouldSelectAll = selectedAssets.size < allAssetNames.length;
        onToggleAll?.(shouldSelectAll);
    };

    const handleToggleFolderRecursive = (e: React.MouseEvent, node: FileSystemNode) => {
        e.stopPropagation();
        if (readOnly || !onToggleAsset) return;
        const files = getAllFilesUnderNode(node);
        const folderSelectedFiles = files.filter(f => selectedAssets.has(f));
        const shouldSelect = folderSelectedFiles.length < files.length;
        files.forEach(f => onToggleAsset(f, shouldSelect));
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full border-none rounded-none overflow-hidden bg-background/30 backdrop-blur-xl">
                {/* --- Modern Explorer Toolbar --- */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-muted/20 border-b border-border/40 shrink-0">
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setCurrentPath("")}
                            className={cn("h-8 w-8 rounded-lg", !currentPath && "bg-background shadow-sm text-primary")}
                        >
                            <Home className="h-4 w-4" />
                        </Button>
                        <div className="h-4 w-px bg-border/60 mx-1" />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg"
                            onClick={handleNavigateUp}
                            disabled={!currentPath}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* --- Breadcrumbs --- */}
                    <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1 px-2 py-1 bg-background/50 rounded-lg border border-border/40 min-h-9">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-2 shrink-0">Path:</span>
                        {breadcrumbs.length === 0 ? (
                            <span className="text-xs font-bold text-muted-foreground/60 px-1">/ root</span>
                        ) : (
                            breadcrumbs.map((part, index) => {
                                const path = breadcrumbs.slice(0, index + 1).join('/');
                                return (
                                    <React.Fragment key={path}>
                                        <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                                        <button 
                                            onClick={() => setCurrentPath(path)}
                                            className="px-2 py-0.5 rounded-md hover:bg-primary/10 hover:text-primary transition-all text-xs font-bold whitespace-nowrap"
                                        >
                                            {part}
                                        </button>
                                    </React.Fragment>
                                );
                            })
                        )}
                    </div>

                    {/* --- Search & Action --- */}
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Search className="z-20 absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Search current folder..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 pl-8 w-full sm:w-[200px] bg-background/50 border-border/40 focus:ring-primary/20 text-xs font-medium rounded-lg"
                            />
                        </div>
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border/40 bg-background/50">
                            <Filter className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* --- Content Area --- */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 hover:scrollbar-thumb-border/80 scrollbar-track-transparent">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPath}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="min-h-full"
                        >
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                                    <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
                                        <HardDrive className="h-8 w-8 text-muted-foreground/40" />
                                    </div>
                                    <h3 className="text-sm font-bold text-foreground">No assets found</h3>
                                    <p className="text-xs text-muted-foreground mt-1">This directory is empty or doesn't match filters.</p>
                                </div>
                            ) : (
                                <Table wrapperClassName="rounded-none border-none">
                                    <TableHeader className="bg-muted/10 sticky top-0 z-30 backdrop-blur-md border-b border-border/40">
                                        <TableRow className="hover:bg-transparent border-none">
                                            {!readOnly && (
                                                <TableHead className="w-12 pl-6">
                                                    <Checkbox 
                                                        checked={isAllSelected ? true : (isIndeterminate ? "indeterminate" : false)}
                                                        onCheckedChange={(c) => handleToggleCurrentFolder(!!c)}
                                                        disabled={allFilesUnderCurrent.length === 0}
                                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                    />
                                                </TableHead>
                                            )}
                                            <TableHead className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground/60", readOnly && "pl-6")}>Asset Name</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Format</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right pr-6">Size</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => (
                                            <TableRow 
                                                key={item.path}
                                                className={cn(
                                                    "group transition-all duration-200 border-b border-border/20 cursor-default",
                                                    item.type === 'directory' ? "cursor-pointer hover:bg-primary/3" : "hover:bg-muted/30"
                                                )}
                                                onClick={() => item.type === 'directory' && setCurrentPath(item.path)}
                                            >
                                                {!readOnly && (
                                                    <TableCell className="pl-6 py-3" onClick={(e) => e.stopPropagation()}>
                                                        {item.type === 'file' ? (
                                                            <Checkbox 
                                                                checked={selectedAssets.has(item.asset.name)}
                                                                onCheckedChange={(c) => onToggleAsset?.(item.asset.name, !!c)}
                                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-transform duration-200 group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary transition-all p-0 group/btn"
                                                                        onClick={(e) => handleToggleFolderRecursive(e, item)}
                                                                    >
                                                                        <div className={cn(
                                                                            "w-4 h-4 rounded border border-border flex items-center justify-center transition-all group-hover/btn:border-primary",
                                                                            getAllFilesUnderNode(item).length > 0 && getAllFilesUnderNode(item).every(f => selectedAssets.has(f)) && "bg-primary border-primary"
                                                                        )}>
                                                                            <div className={cn(
                                                                                "w-1 h-1 rounded-full bg-border transition-colors",
                                                                                getAllFilesUnderNode(item).some(f => selectedAssets.has(f)) && "bg-primary-foreground"
                                                                            )} />
                                                                        </div>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="right" className="text-[9px] font-black uppercase">
                                                                    Toggle All in Folder
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                )}
                                                <TableCell className={cn("py-3", readOnly && "pl-6")}>
                                                    <div className="flex items-center gap-3.5">
                                                        <div className={cn(
                                                            "p-2 rounded-lg transition-all duration-300 group-hover:shadow-sm",
                                                            item.type === 'directory' ? "bg-blue-500/5 group-hover:bg-blue-500/10" : "bg-muted/30 group-hover:bg-muted/50"
                                                        )}>
                                                            {getIcon(item)}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className={cn(
                                                                "text-sm font-bold tracking-tight transition-colors truncate",
                                                                item.type === 'directory' ? "group-hover:text-primary" : "text-foreground/80"
                                                            )}>
                                                                {item.name}
                                                            </span>
                                                            {item.type === 'file' && item.asset.format && (
                                                                <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                                                                    {item.asset.format} DATA ASSET
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center py-3">
                                                    {item.type === 'directory' ? (
                                                        <Badge variant="outline" className="h-5 text-[8px] font-black uppercase tracking-widest border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/5">
                                                            FOLDER
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="h-5 text-[8px] font-black uppercase tracking-widest bg-muted/50 border-border/40 text-muted-foreground/70">
                                                            {item.name.split('.').pop() || 'FILE'}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-6 py-3">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs font-black font-mono text-foreground/70 tracking-tight">
                                                            {item.asset?.size_bytes ? (
                                                                (item.asset.size_bytes / 1024).toFixed(1) + ' KB'
                                                            ) : '-'}
                                                        </span>
                                                        {item.type === 'file' && (
                                                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground/40 font-bold uppercase">
                                                                <Clock className="h-2.5 w-2.5" /> 
                                                                Recent
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* --- Status Bar --- */}
                <div className="bg-muted/30 border-t border-border/40 p-2.5 px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">{items.length} Elements in view</span>
                        </div>
                        <div className="h-3 w-px bg-border/60" />
                        <span className="text-[10px] font-bold text-muted-foreground/50 truncate max-w-[200px] sm:max-w-none">
                            LOCATION: {currentPath || "ROOT_CONTEXT"}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {!readOnly && (
                            <>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 px-3 text-[9px] font-black uppercase tracking-tighter hover:bg-primary/10 hover:text-primary transition-all gap-1.5"
                                    onClick={handleToggleGlobal}
                                >
                                    {selectedAssets.size === assets.length ? 'Deselect All' : 'Select All Assets'}
                                </Button>
                                <Badge variant="secondary" className="text-[9px] h-5 font-black uppercase bg-primary/10 text-primary border-none">
                                    {selectedAssets.size} Selected
                                </Badge>
                            </>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-background shadow-none opacity-40 hover:opacity-100 transition-opacity">
                                    <Info className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] font-bold uppercase tracking-widest p-2 bg-background border-border/60 shadow-xl">
                                Assets are filtered by supported extensions
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};