/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getConnections, executeRawQuery, getConnectionSchemaMetadata } from '@/lib/api';
import { PageMeta } from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import {
    Database, Play, AlertTriangle,
    Table as TableIcon, Loader2, Maximize2, Minimize2,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';
import Editor, { useMonaco } from '@monaco-editor/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

// Feature Components
import { SchemaBrowser } from '@/components/features/explorer/SchemaBrowser';
import { ResultsGrid } from '@/components/features/explorer/ResultsGrid';
import { ExecutionHistory } from '@/components/features/explorer/ExecutionHistory';
import { type QueryTab, type HistoryItem, SUPPORTED_EXPLORER_TYPES } from '@/components/features/explorer/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export const ExplorerPage: React.FC = () => {
    const { theme } = useTheme();
    const monaco = useMonaco();

    // --- State ---
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
    const [maximizedView, setMaximizedView] = useState<'none' | 'editor' | 'results'>('none');
    const [showHistory, setShowHistory] = useState(false);

    // History Persistence
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        const saved = localStorage.getItem('synqx-explorer-history');
        return saved ? JSON.parse(saved) : [];
    });

    const [tabs, setTabs] = useState<QueryTab[]>([{
        id: '1',
        title: 'query_main',
        query: '-- SQL Command Center\nSELECT * FROM tables LIMIT 10;',
        language: 'sql',
        results: null
    }]);
    const [activeTabId] = useState('1');
    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0], [tabs, activeTabId]);

    // Sync History to LocalStorage
    useEffect(() => {
        localStorage.setItem('synqx-explorer-history', JSON.stringify(history.slice(0, 50)));
    }, [history]);

    // --- Data Fetching ---
    const { data: connections } = useQuery({ queryKey: ['connections'], queryFn: getConnections });

    const currentConnection = useMemo(() =>
        connections?.find(c => c.id.toString() === selectedConnectionId),
        [connections, selectedConnectionId]);

    const isSupported = useMemo(() => {
        if (!currentConnection) return true;
        return SUPPORTED_EXPLORER_TYPES.includes(currentConnection.connector_type.toLowerCase());
    }, [currentConnection]);

    const { data: schemaMetadata } = useQuery({
        queryKey: ['schema-metadata', selectedConnectionId],
        queryFn: () => getConnectionSchemaMetadata(parseInt(selectedConnectionId!)),
        enabled: !!selectedConnectionId && isSupported
    });

    // --- Autocomplete Registration ---
    useEffect(() => {
        if (!monaco || !schemaMetadata || !isSupported) return;

        const provider = monaco.languages.registerCompletionItemProvider('sql', {
            provideCompletionItems: (model: any, position: any) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                const suggestions: any[] = [];
                Object.keys(schemaMetadata.metadata).forEach((table) => {
                    suggestions.push({
                        label: table,
                        kind: monaco.languages.CompletionItemKind.Class,
                        insertText: table,
                        detail: 'Table',
                        range,
                    });

                    schemaMetadata.metadata[table].forEach((column: string) => {
                        suggestions.push({
                            label: column,
                            kind: monaco.languages.CompletionItemKind.Field,
                            insertText: column,
                            detail: `Column (${table})`,
                            range,
                        });
                    });
                });

                return { suggestions };
            },
        });

        return () => provider.dispose();
    }, [monaco, schemaMetadata, isSupported]);

    // --- Mutation ---
    const executeMutation = useMutation({
        mutationFn: async () => executeRawQuery(parseInt(selectedConnectionId!), activeTab.query),
        onSuccess: (data) => {
            setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, results: data } : t));

            // Add to History
            const newHistoryItem: HistoryItem = {
                id: Math.random().toString(36).substr(2, 9),
                query: activeTab.query,
                timestamp: Date.now(),
                connectionName: currentConnection?.name || 'Unknown',
                rowCount: data.results.length
            };
            setHistory(prev => [newHistoryItem, ...prev]);

            toast.success("Execution Complete");
        },
        onError: (err: any) => {
            toast.error("Query Failed", { description: err.message });
        }
    });

    // --- Handlers ---
    const handleRestoreQuery = (query: string) => {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, query } : t));
        setShowHistory(false);
        toast.success("Query Restored to Editor");
    };

    const MaximizePortal = ({ children }: { children: React.ReactNode }) => {
        return createPortal(
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="fixed inset-0 z-9999 bg-background flex flex-col isolate"
            >
                <div className="flex-1 overflow-hidden relative">
                    {children}
                </div>
            </motion.div>,
            document.body
        );
    };

    const renderEditor = () => (
        <div className="h-full flex flex-col bg-background relative isolate">
            <div className="h-12 border-b border-border/40 flex items-center justify-between px-4 bg-muted/5 shrink-0">
                <div className="flex items-center gap-4">
                    <Select value={selectedConnectionId || ''} onValueChange={setSelectedConnectionId}>
                        <SelectTrigger className="w-56 h-8 bg-background/50 border-border/40 rounded-xl font-bold text-xs italic">
                            <SelectValue placeholder="Initialize Data Source" />
                        </SelectTrigger>
                        <SelectContent className="glass-panel border-border/40 rounded-2xl">
                            {connections?.map(c => {
                                const supported = SUPPORTED_EXPLORER_TYPES.includes(c.connector_type.toLowerCase());
                                return (
                                    <SelectItem key={c.id} value={c.id.toString()} className={cn("rounded-lg", !supported && "opacity-50 italic")}>
                                        <div className="flex items-center gap-2">
                                            {c.name}
                                            {!supported && <span className="text-[8px] uppercase font-black opacity-40">(Unsupported)</span>}
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                    <Button
                        size="sm"
                        onClick={() => executeMutation.mutate()}
                        disabled={executeMutation.isPending || !selectedConnectionId || !isSupported}
                        className="h-8 px-5 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
                    >
                        {executeMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Play size={10} fill="currentColor" />}
                        Run
                    </Button>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 rounded-xl transition-colors", showHistory && "bg-primary/10 text-primary")}
                        onClick={() => setShowHistory(!showHistory)}
                    >
                        <Clock size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => setMaximizedView(maximizedView === 'editor' ? 'none' : 'editor')}
                    >
                        {maximizedView === 'editor' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative group">
                {!isSupported && selectedConnectionId && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md p-12 text-center animate-in fade-in duration-300">
                        <div className="p-4 rounded-[2rem] bg-destructive/10 border border-destructive/20 text-destructive mb-6">
                            <AlertTriangle size={48} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground mb-2">
                            Unsupported Protocol
                        </h2>
                        <p className="text-sm text-muted-foreground font-medium max-w-sm leading-relaxed mb-8">
                            Interactive Explorer does not support <span className="text-foreground font-black italic">{currentConnection?.connector_type}</span> sources yet.
                        </p>
                        <Button variant="outline" className="rounded-2xl font-black uppercase text-[10px]" onClick={() => setSelectedConnectionId(null)}>
                            Return to Registry
                        </Button>
                    </div>
                )}
                <Editor
                    height="100%"
                    language="sql"
                    value={activeTab.query}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    onChange={(v) => setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, query: v || '' } : t))}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        padding: { top: 20 },
                        automaticLayout: true,
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: true,
                        readOnly: !isSupported
                    }}
                />
            </div>
        </div>
    );

    const renderResults = () => (
        <div className="h-full flex flex-col bg-card/10 relative overflow-hidden">
            <div className="h-10 border-b border-border/40 bg-muted/10 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                    <TableIcon size={14} className="text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Query Results</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-lg"
                    onClick={() => setMaximizedView(maximizedView === 'results' ? 'none' : 'results')}
                >
                    {maximizedView === 'results' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </Button>
            </div>
            {/* FIX: min-h-0 is mandatory here to allow the child to be smaller than its content */}
            <div className="flex-1 min-h-0 w-full relative">
                <ResultsGrid data={activeTab.results} isLoading={executeMutation.isPending} />
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col relative overflow-hidden animate-in fade-in duration-700 bg-background rounded-3xl border border-border/40 shadow-2xl">
            <PageMeta title="Explorer" />

            <AnimatePresence>
                {/* Maximization Overlays */}
                {maximizedView === 'editor' && (
                    <MaximizePortal>
                        {renderEditor()}
                    </MaximizePortal>
                )}
                {maximizedView === 'results' && (
                    <MaximizePortal >
                        {renderResults()}
                    </MaximizePortal>
                )}

                {/* History Sidebar Overlay */}
                {showHistory && (
                    <>
                        {/* Backdrop for history */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowHistory(false)}
                            className="absolute inset-0 bg-background/20 backdrop-blur-sm z-80"
                        />
                        <ExecutionHistory
                            history={history}
                            onClose={() => setShowHistory(false)}
                            onRestore={handleRestoreQuery}
                            onClear={() => setHistory([])}
                        />
                    </>
                )}
            </AnimatePresence>

            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={20} minSize={15} className="bg-muted/5 border-r border-border/40 flex flex-col">
                    <div className="p-4 border-b border-border/40 bg-muted/10 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <Database size={14} /> Schema Catalog
                    </div>
                    <SchemaBrowser connectionId={selectedConnectionId ? parseInt(selectedConnectionId) : null} onTableClick={(t) => handleRestoreQuery(`SELECT * FROM ${t} LIMIT 50;`)} />
                </ResizablePanel>

                <ResizableHandle withHandle className="bg-transparent" />

                <ResizablePanel defaultSize={80}>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel defaultSize={50} minSize={20} className="relative overflow-hidden isolate">
                            {renderEditor()}
                        </ResizablePanel>

                        <ResizableHandle withHandle className="bg-transparent" />

                        <ResizablePanel defaultSize={50} minSize={10} className="overflow-hidden">
                            {renderResults()}
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default ExplorerPage;