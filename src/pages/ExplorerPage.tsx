/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getConnections,
    executeRawQuery,
    getConnectionSchemaMetadata,
} from '@/lib/api';
import { PageMeta } from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import {
    Database, Play, Save, History as HistoryIcon,
    Table as TableIcon, Search, Columns, Loader2,
    Download, Copy, Terminal, Eraser, Braces, Binary,
    ListFilter, FileText, LayoutPanelTop, Plus, X,
    Maximize2, Minimize2, ChevronDown, Sparkles, Clock,
    Settings2, Split, Files, Code2, DatabaseZap
} from 'lucide-react';
import { toast } from 'sonner';
import Editor, { useMonaco } from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useTheme } from 'next-themes';
import { format as formatSql } from 'sql-formatter';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
}
from "@/components/ui/select";
import {
    TooltipProvider,
    Tooltip,
    TooltipContent,
    TooltipTrigger
}
from '@/components/ui/tooltip';

// Feature Components
import { SchemaBrowser } from '@/components/features/explorer/SchemaBrowser';
import { ResultsGrid } from '@/components/features/explorer/ResultsGrid';
import { QueryTabs } from '@/components/features/explorer/QueryTabs';
import { ExecutionHistory } from '@/components/features/explorer/ExecutionHistory';
import { type QueryTab, type HistoryItem, SUPPORTED_EXPLORER_TYPES } from '@/components/features/explorer/types';

export const ExplorerPage: React.FC = () => {
    const queryClient = useQueryClient();
    const monaco = useMonaco();
    const editorRef = useRef<any>(null);
    const { theme } = useTheme();

    // --- State ---
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(() => {
        const queryParams = new URLSearchParams(window.location.search);
        return queryParams.get('connectionId');
    });

    const [tabs, setTabs] = useState<QueryTab[]>(() => {
        const saved = localStorage.getItem('synqx-explorer-tabs');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved tabs", e);
            }
        }
        return [{ id: '1', title: 'Query 1', query: '-- Select a connection to start querying\nSELECT * FROM table LIMIT 10;', language: 'sql', results: null }];
    });

    const [activeTabId, setActiveTabId] = useState(() => {
        return localStorage.getItem('synqx-explorer-active-tab') || '1';
    });

    const [isEditorMaximized, setIsEditorMaximized] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        const saved = localStorage.getItem('synqx-explorer-history');
        return saved ? JSON.parse(saved) : [];
    });
    const [showHistory, setShowHistory] = useState(false);

    // --- Derived State ---
    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0], [tabs, activeTabId]);

    // --- Persistence ---
    useEffect(() => {
        localStorage.setItem('synqx-explorer-tabs', JSON.stringify(tabs.map(t => ({ ...t, results: null }))));
    }, [tabs]);

    useEffect(() => {
        localStorage.setItem('synqx-explorer-active-tab', activeTabId);
    }, [activeTabId]);

    useEffect(() => {
        localStorage.setItem('synqx-explorer-history', JSON.stringify(history.slice(0, 50)));
    }, [history]);

    // --- Monaco Themes ---
    useEffect(() => {
        if (monaco) {
            monaco.editor.defineTheme('synqx-dark', {
                base: 'vs-dark', inherit: true, rules: [],
                colors: {
                    'editor.background': '#00000000',
                    'editor.lineHighlightBackground': '#ffffff05',
                    'editor.selectionBackground': '#3b82f630',
                    'editorCursor.foreground': '#3b82f6',
                }
            });
            monaco.editor.defineTheme('synqx-light', {
                base: 'vs', inherit: true, rules: [],
                colors: {
                    'editor.background': '#ffffff00',
                    'editor.lineHighlightBackground': '#00000005',
                    'editor.selectionBackground': '#3b82f620',
                    'editorCursor.foreground': '#3b82f6',
                }
            });
        }
    }, [monaco]);

    // --- Data Fetching ---
    const { data: connections, isLoading: isLoadingConnections } = useQuery({
        queryKey: ['connections'],
        queryFn: getConnections
    });

    const selectedConnection = useMemo(() => 
        connections?.find(c => c.id.toString() === selectedConnectionId),
    [connections, selectedConnectionId]);

    const { data: schemaMetadata } = useQuery({
        queryKey: ['schema-metadata', selectedConnectionId],
        queryFn: () => getConnectionSchemaMetadata(parseInt(selectedConnectionId!)),
        enabled: !!selectedConnectionId,
        retry: 1
    });

    const currentLanguage = useMemo(() => {
        if (!selectedConnection) return 'sql';
        if (selectedConnection.connector_type.toLowerCase().includes('mongo')) return 'json';
        return 'sql';
    }, [selectedConnection]);

    // --- Mutations ---
    const executeMutation = useMutation({
        mutationFn: async (qToRun?: string) => executeRawQuery(parseInt(selectedConnectionId!), qToRun || activeTab.query),
        onSuccess: (data, qRun) => {
            setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, results: data } : t));
            const historyItem: HistoryItem = {
                id: Math.random().toString(36).substring(7),
                query: (typeof qRun === 'string' ? qRun : activeTab.query),
                timestamp: Date.now(),
                connectionName: selectedConnection?.name || 'Unknown',
                rowCount: data.results.length
            };
            setHistory(prev => [historyItem, ...prev]);
            toast.success("Query Successful", { description: `Returned ${data.results.length} records.` });
        },
        onError: (err: any) => {
            toast.error("Execution Failed", { description: err.response?.data?.detail || "An error occurred." });
        }
    });

    // --- Handlers ---
    const handleRun = () => {
        if (!selectedConnectionId) {
            toast.error("Invalid Request", { description: "Choose a data source first." });
            return;
        }
        const selection = editorRef.current?.getSelection();
        const model = editorRef.current?.getModel();
        if (selection && model && !selection.isEmpty()) {
            executeMutation.mutate(model.getValueInRange(selection));
        } else {
            executeMutation.mutate(undefined);
        }
    };

    const addTab = () => {
        const nextNum = tabs.length > 0 ? Math.max(...tabs.map(t => parseInt(t.id))) + 1 : 1;
        const newId = nextNum.toString();
        setTabs([...tabs, {
            id: newId,
            title: `Query ${newId}`,
            query: currentLanguage === 'json' ? `{
  "collection": "collection",
  "filter": {},
  "limit": 10
}` : 'SELECT * FROM table LIMIT 10;',
            language: currentLanguage,
            results: null
        }]);
        setActiveTabId(newId);
    };

    const removeTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (tabs.length === 1) return;
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
    };

    const renameTab = (id: string, newTitle: string) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
    };

    const closeAllTabs = () => {
        const firstTab = tabs[0];
        setTabs([firstTab]);
        setActiveTabId(firstTab.id);
    };

    const updateActiveTabQuery = (val: string) => {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, query: val } : t));
    };

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
        editor.addCommand(monaco?.KeyMod.CtrlCmd | monaco?.KeyCode.Enter, () => handleRun());
    };

    const formatQuery = () => {
        try {
            updateActiveTabQuery(formatSql(activeTab.query, { language: 'postgresql', keywordCase: 'upper' }));
            toast.success("Query Formatted");
        } catch (e) {
            toast.error("Format Failed");
        }
    };

    const insertTextAtCursor = (text: string) => {
        if (editorRef.current) {
            const selection = editorRef.current.getSelection();
            editorRef.current.executeEdits("insertText", [{
                range: new monaco!.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn),
                text, forceMoveMarkers: true
            }]);
        }
    };

    const exportData = (format: 'json' | 'csv') => {
        if (!activeTab.results) return;
        const dataToExport = activeTab.results.results;
        const columns = activeTab.results.columns;

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `query_export_${new Date().getTime()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            const headers = columns.join(',');
            const rows = dataToExport.map(row => 
                columns.map(col => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(',')
            );
            const csv = [headers, ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `query_export_${new Date().getTime()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
        toast.success(`Exported as ${format.toUpperCase()}`);
    };

    const handleSchemaTableClick = (tableName: string) => {
         const newQuery = `SELECT * FROM ${tableName} LIMIT 50;`;
         updateActiveTabQuery(newQuery);
         // Optionally auto-run or just focus?
    };

    const handleHistoryRestore = (query: string) => {
        updateActiveTabQuery(query);
        setShowHistory(false);
        toast.success("Query Restored");
    };

    return (
        <div className="h-full flex flex-col bg-background overflow-hidden animate-in fade-in duration-300">
            <PageMeta title="Explorer" description="Run SQL queries and analyze data" />
            
            <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
                {/* --- Sidebar: Schema Browser --- */}
                {!isEditorMaximized && (
                    <>
                        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="border-r border-border/50 bg-muted/5 flex flex-col">
                           <div className="p-3 border-b border-border/50 bg-muted/20 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <Database className="h-3.5 w-3.5" />
                                Schema Browser
                           </div>
                           <div className="flex-1 overflow-hidden">
                               <SchemaBrowser 
                                    connectionId={selectedConnectionId ? parseInt(selectedConnectionId) : null}
                                    onTableClick={handleSchemaTableClick}
                                />
                           </div>
                        </ResizablePanel>
                        <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/50 transition-colors" />
                    </>
                )}

                {/* --- Main Content --- */}
                <ResizablePanel defaultSize={80}>
                    <ResizablePanelGroup direction="vertical">
                        
                        {/* --- Editor Section --- */}
                        <ResizablePanel defaultSize={isEditorMaximized ? 100 : 50} minSize={30}>
                            <div className="h-full flex flex-col bg-background relative">
                                {/* Toolbar Area */}
                                <div className="h-12 border-b border-border/50 flex items-center justify-between px-3 bg-muted/5 gap-4">
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="w-56">
                                            <Select value={selectedConnectionId || ''} onValueChange={setSelectedConnectionId}>
                                                <SelectTrigger className="h-8 text-xs font-medium border-border/50 bg-background hover:bg-muted/50 transition-colors focus:ring-0">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <DatabaseZap className="h-3.5 w-3.5 text-primary" />
                                                        <SelectValue placeholder="Select Connection" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {connections?.map(c => (
                                                        <SelectItem key={c.id} value={c.id.toString()} className="text-xs">
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="h-4 w-px bg-border/50 mx-1" />
                                        <Button 
                                            size="sm" 
                                            onClick={handleRun} 
                                            disabled={executeMutation.isPending || !selectedConnectionId}
                                            className={cn(
                                                "h-8 text-xs font-bold gap-2 transition-all shadow-sm",
                                                executeMutation.isPending ? "opacity-80" : "hover:scale-[1.02] active:scale-[0.98]"
                                            )}
                                        >
                                            {executeMutation.isPending ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Play className="h-3.5 w-3.5 fill-current" />
                                            )}
                                            RUN QUERY
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={formatQuery}>
                                                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="text-xs">Format Query</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className={cn("h-8 w-8", isEditorMaximized && "text-primary bg-primary/10")} 
                                                        onClick={() => setIsEditorMaximized(!isEditorMaximized)}
                                                    >
                                                        {isEditorMaximized ? (
                                                            <Minimize2 className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="text-xs">
                                                    {isEditorMaximized ? "Exit Full Screen" : "Maximize Editor"}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(!showHistory)}>
                                                        <HistoryIcon className={cn("h-3.5 w-3.5 transition-colors", showHistory ? "text-primary" : "text-muted-foreground")} />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="text-xs">History</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="bg-muted/10 border-b border-border/50">
                                    <QueryTabs 
                                        tabs={tabs} 
                                        activeTabId={activeTabId} 
                                        onTabSelect={setActiveTabId} 
                                        onTabRemove={removeTab} 
                                        onTabAdd={addTab} 
                                        onTabRename={renameTab}
                                        onCloseAll={closeAllTabs}
                                    />
                                </div>

                                {/* Monaco Editor */}
                                <div className="flex-1 relative group">
                                    {selectedConnectionId ? (
                                        <Editor
                                            height="100%"
                                            language={activeTab.language}
                                            value={activeTab.query}
                                            theme={theme === 'dark' ? 'synqx-dark' : 'synqx-light'}
                                            onChange={(val) => updateActiveTabQuery(val || '')}
                                            onMount={handleEditorDidMount}
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 13,
                                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                padding: { top: 16, bottom: 16 },
                                                lineNumbers: 'on',
                                                renderLineHighlight: 'all',
                                                scrollBeyondLastLine: false,
                                                automaticLayout: true,
                                                contextmenu: true,
                                            }}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/5 gap-4">
                                            <DatabaseZap className="h-12 w-12 opacity-20" />
                                            <div className="text-center">
                                                <p className="text-sm font-medium">No Connection Selected</p>
                                                <p className="text-xs">Select a database connection to start querying</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ResizablePanel>

                        {!isEditorMaximized && (
                            <>
                                <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/50 transition-colors" />

                                {/* --- Results Section --- */}
                                <ResizablePanel defaultSize={50} minSize={20} className="flex flex-col bg-background/50">
                                    {/* Results Header */}
                                    <div className="h-10 border-b border-border/50 bg-muted/10 flex items-center justify-between px-3 shrink-0">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                <TableIcon className="h-3.5 w-3.5" />
                                                Results
                                            </div>
                                            {activeTab.results && (
                                                <Badge variant="outline" className="h-5 text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2">
                                                    {activeTab.results.results.length} rows • {activeTab.results.execution_time_ms}ms
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 text-[10px] gap-1.5 text-muted-foreground hover:text-foreground"
                                                disabled={!activeTab.results}
                                                onClick={() => exportData('json')}
                                            >
                                                <Code2 className="h-3 w-3" />
                                                JSON
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 text-[10px] gap-1.5 text-muted-foreground hover:text-foreground"
                                                disabled={!activeTab.results}
                                                onClick={() => exportData('csv')}
                                            >
                                                <Files className="h-3 w-3" />
                                                CSV
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Results Content */}
                                    <div className="flex-1 overflow-hidden relative">
                                        {showHistory ? (
                                            <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-200">
                                                 <div className="h-full flex flex-col">
                                                    <div className="p-2 border-b border-border/50 flex items-center justify-between">
                                                        <span className="text-xs font-bold pl-2">Execution History</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowHistory(false)}>
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <ExecutionHistory 
                                                            history={history} 
                                                            onClear={() => setHistory([])}
                                                            onRestore={handleHistoryRestore}
                                                            onClose={() => setShowHistory(false)}
                                                        />
                                                    </div>
                                                 </div>
                                            </div>
                                        ) : (
                                            <ResultsGrid 
                                                data={activeTab.results} 
                                                isLoading={executeMutation.isPending} 
                                            />
                                        )}
                                    </div>
                                </ResizablePanel>
                            </>
                        )}
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};
