/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getConnection,
    testConnection,
    deleteConnection,
    discoverAssets,
    getConnectionAssets,
    bulkCreateAssets,
    type Asset,
    type ConnectionTestResult,
    getConnectionImpact,
    getConnectionUsageStats,
    getConnectionEnvironment,
    type ConnectionEnvironmentInfo,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    ArrowLeft, Database, RefreshCw, Search,
    ShieldCheck, AlertTriangle,
    Clock, Activity,
    Layers,
    Key, Server, Settings2, 
    MoreVertical, Trash2, Pencil, 
    CheckCircle2, Download, Plus,
    Sparkles, Terminal, Cpu, FileCode
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent
} from "@/components/ui/dialog";
import { CreateConnectionDialog } from '@/components/features/connections/CreateConnectionDialog';
import { AssetTableRow } from '@/components/features/connections/AssetTableRow';
import { PageMeta } from '@/components/common/PageMeta';
import { CreateAssetsDialog } from '@/components/features/connections/CreateAssetsDialog';
import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfigField } from '@/components/features/connections/ConfigField';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageAutocomplete } from '@/components/common/PackageAutocomplete';
import { installDependency, listDependencies, uninstallDependency, initializeEnvironment } from '@/lib/api';

const PYTHON_PACKAGES = [
    'pandas', 'numpy', 'scipy', 'scikit-learn', 'requests', 'beautifulsoup4', 'faker', 'sqlalchemy',
    'polars', 'dask', 'pyspark', 'matplotlib', 'seaborn', 'plotly', 'nltk', 'spacy', 'tensorflow',
    'pytorch', 'keras', 'fastapi', 'flask', 'django', 'celery', 'redis', 'pymongo', 'psycopg2-binary',
    'mysql-connector-python', 'snowflake-connector-python', 'boto3', 'google-cloud-storage', 'azure-storage-blob'
];

const NODE_PACKAGES = [
    'lodash', 'moment', 'axios', 'node-fetch', 'date-fns', 'uuid', 'faker', 'chance', 'csv-parser',
    'fast-csv', 'json2csv', 'xml2js', 'xlsx', 'mongodb', 'pg', 'mysql2', 'redis', 'ioredis', 'aws-sdk',
    '@google-cloud/storage', '@azure/storage-blob', 'express', 'fastify', 'socket.io', 'mongoose',
    'sequelize', 'typeorm', 'prisma', 'chalk', 'dotenv', 'fs-extra'
];

const EnvironmentInfo = ({ connectionId }: { connectionId: number }) => {
    const { data: envInfo, isLoading, isError, refetch } = useQuery({
        queryKey: ['connectionEnvironment', connectionId],
        queryFn: () => getConnectionEnvironment(connectionId),
    });

    const [activeTab, setActiveTab] = useState<'general' | 'python' | 'shell' | 'node'>('general');
    const [installing, setInstalling] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [pkgName, setPkgName] = useState("");

    const handleInstall = async (language: string) => {
        if (!pkgName) return;
        setInstalling(true);
        try {
            await installDependency(connectionId, language, pkgName);
            toast.success(`Installed ${pkgName}`);
            setPkgName("");
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Installation failed");
        } finally {
            setInstalling(false);
        }
    };

    const handleInitialize = async (language: string) => {
        setInitializing(true);
        try {
            await initializeEnvironment(connectionId, language);
            toast.success(`${language} environment initialized`);
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Initialization failed");
        } finally {
            setInitializing(false);
        }
    };

    if (isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />;
    if (isError || !envInfo) return null;

    if (!envInfo.python_version && (!envInfo.available_tools || Object.keys(envInfo.available_tools).length === 0)) {
        return null;
    }

    const installedPackages = envInfo.installed_packages || {};
    const availableTools = envInfo.available_tools || {};
    const npmPackages = envInfo.npm_packages || {};
    const initializedLangs = new Set(envInfo.initialized_languages || []);

    const renderTabContent = (language: string, content: React.ReactNode) => {
        if (!initializedLangs.has(language)) {
            return (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8 bg-muted/5 rounded-xl border border-dashed border-border/40">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Terminal className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold text-foreground">Environment Not Initialized</h4>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Initialize the isolated {language} environment to manage dependencies and execute scripts safely.
                        </p>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={() => handleInitialize(language)}
                        disabled={initializing}
                        className="gap-2 font-bold"
                    >
                        {initializing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Initialize {language.charAt(0).toUpperCase() + language.slice(1)} Env
                    </Button>
                </div>
            );
        }
        return content;
    };

    return (
        <div className="rounded-2xl border border-border/40 bg-background/40 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[500px]">
            {/* Sidebar */}
            <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-border/40 bg-muted/10 p-2 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
                <button
                    onClick={() => setActiveTab('general')}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all w-full text-left",
                        activeTab === 'general' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/20"
                    )}
                >
                    <Terminal className="h-3.5 w-3.5" />
                    General Info
                </button>
                <button
                    onClick={() => setActiveTab('python')}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all w-full text-left",
                        activeTab === 'python' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/20"
                    )}
                >
                    <FileCode className="h-3.5 w-3.5" />
                    Python
                    {initializedLangs.has('python') && (
                        <Badge variant="secondary" className="ml-auto text-[9px] h-4 px-1">{Object.keys(installedPackages).length}</Badge>
                    )}
                </button>
                {envInfo.node_version && (
                    <button
                        onClick={() => setActiveTab('node')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all w-full text-left",
                            activeTab === 'node' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/20"
                        )}
                    >
                        <FileCode className="h-3.5 w-3.5" />
                        Node.js
                        {initializedLangs.has('node') && (
                            <Badge variant="secondary" className="ml-auto text-[9px] h-4 px-1">{Object.keys(npmPackages).length}</Badge>
                        )}
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('shell')}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all w-full text-left",
                        activeTab === 'shell' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/20"
                    )}
                >
                    <Cpu className="h-3.5 w-3.5" />
                    Shell
                    <Badge variant="secondary" className="ml-auto text-[9px] h-4 px-1">{Object.keys(availableTools).length}</Badge>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 hover:scrollbar-thumb-border/80 scrollbar-track-transparent">
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <Terminal className="h-4 w-4 text-primary" />
                                Environment Overview
                            </h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                {envInfo.python_version && (
                                    <ConfigField 
                                        label="Python Runtime" 
                                        value={envInfo.python_version.split(' ')[0]} 
                                        icon={<FileCode className="h-3.5 w-3.5" />}
                                    />
                                )}
                                {envInfo.node_version && (
                                    <ConfigField 
                                        label="Node.js Runtime" 
                                        value={envInfo.node_version} 
                                        icon={<FileCode className="h-3.5 w-3.5" />}
                                    />
                                )}
                                {envInfo.platform && (
                                    <ConfigField 
                                        label="OS Platform" 
                                        value={envInfo.platform} 
                                        icon={<Cpu className="h-3.5 w-3.5" />}
                                    />
                                )}
                                {envInfo.base_path && (
                                    <ConfigField label="Script Base Path" value={envInfo.base_path} copyable />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'python' && renderTabContent('python', (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <FileCode className="h-4 w-4 text-primary" />
                                Installed Packages
                            </h3>
                            <div className="flex items-center gap-2 w-full max-w-sm">
                                <PackageAutocomplete 
                                    value={pkgName}
                                    onChange={setPkgName}
                                    onSelect={(val) => setPkgName(val)}
                                    options={PYTHON_PACKAGES}
                                    placeholder="Search python package..."
                                    className="h-8 text-xs"
                                    leftIcon={FileCode}
                                />
                                <Button 
                                    size="sm" 
                                    className="h-8 px-3 text-xs shrink-0" 
                                    onClick={() => handleInstall('python')}
                                    disabled={installing || !pkgName}
                                >
                                    {installing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {Object.entries(installedPackages).sort((a, b) => a[0].localeCompare(b[0])).map(([pkg, ver]) => (
                                <div key={pkg} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-muted/5 border border-border/20 hover:bg-muted/10 transition-colors group">
                                    <span className="font-medium truncate mr-2 text-foreground/80 group-hover:text-foreground" title={pkg}>{pkg}</span>
                                    <Badge variant="outline" className="text-[10px] font-mono bg-background/50 text-muted-foreground h-5 border-border/30">
                                        {String(ver)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {activeTab === 'node' && renderTabContent('node', (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <FileCode className="h-4 w-4 text-primary" />
                                NPM Packages
                            </h3>
                            <div className="flex items-center gap-2 w-full max-w-sm">
                                <PackageAutocomplete 
                                    value={pkgName}
                                    onChange={setPkgName}
                                    onSelect={(val) => setPkgName(val)}
                                    options={NODE_PACKAGES}
                                    placeholder="Search npm package..."
                                    className="h-8 text-xs"
                                    leftIcon={FileCode}
                                />
                                <Button 
                                    size="sm" 
                                    className="h-8 px-3 text-xs shrink-0" 
                                    onClick={() => handleInstall('node')}
                                    disabled={installing || !pkgName}
                                >
                                    {installing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {Object.entries(npmPackages).sort((a, b) => a[0].localeCompare(b[0])).map(([pkg, ver]) => (
                                <div key={pkg} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-muted/5 border border-border/20 hover:bg-muted/10 transition-colors group">
                                    <span className="font-medium truncate mr-2 text-foreground/80 group-hover:text-foreground" title={pkg}>{pkg}</span>
                                    <Badge variant="outline" className="text-[10px] font-mono bg-background/50 text-muted-foreground h-5 border-border/30">
                                        {String(ver)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {activeTab === 'shell' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-primary" />
                            Available Shell Tools
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(availableTools).map(([tool, path]) => (
                                <div key={tool} className="flex flex-col text-xs px-3 py-2 rounded-lg bg-muted/5 border border-border/20 hover:bg-muted/10 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-foreground uppercase tracking-wider">{tool}</span>
                                        <Badge variant="outline" className="text-[9px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20 h-4 px-1.5">
                                            Available
                                        </Badge>
                                    </div>
                                    <code className="text-[10px] text-muted-foreground font-mono bg-background/30 px-1.5 py-0.5 rounded truncate" title={String(path)}>
                                        {String(path)}
                                    </code>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AssetsTabContent = ({
    connectionId,
    connectorType,
    assets,
    discoveredAssets,
    isLoading,
    onDiscover,
    setDiscoveredAssets
}: {
    connectionId: number,
    connectorType: any,
    assets: Asset[] | undefined,
    discoveredAssets: any[],
    isLoading: boolean,
    onDiscover: () => void,
    setDiscoveredAssets: (assets: any[]) => void
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedDiscovered, setSelectedDiscovered] = useState<Set<string>>(new Set());
    
    const queryClient = useQueryClient();

    const filteredAssets = useMemo(() => {
        if (!assets) return [];
        return assets.filter(asset =>
            asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.asset_type?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [assets, searchQuery]);

    const filteredDiscovered = useMemo(() => {
        return discoveredAssets.filter(asset =>
            asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (asset.type || asset.asset_type)?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [discoveredAssets, searchQuery]);

    const handleSelectDiscovered = (name: string, checked: boolean) => {
        setSelectedDiscovered(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(name);
            } else {
                newSet.delete(name);
            }
            return newSet;
        });
    };

    const handleSelectAllDiscovered = (checked: boolean) => {
        if (checked) {
            setSelectedDiscovered(new Set(filteredDiscovered.map(a => a.name)));
        } else {
            setSelectedDiscovered(new Set());
        }
    };

    const bulkImportMutation = useMutation({
        mutationFn: async ({ assetNames, asDestination }: { assetNames: string[], asDestination: boolean }) => {
            const assetsToCreate = assetNames.map(name => ({
                name,
                asset_type: 'table',
                is_source: !asDestination,
                is_destination: asDestination,
            }));
            return bulkCreateAssets(connectionId, { assets: assetsToCreate });
        },
        onSuccess: (data) => {
            if (data.successful_creates > 0) {
                toast.success("Bulk Import Successful", {
                    description: `${data.successful_creates} of ${data.total_requested} assets were created.`,
                });
            }
            if (data.failed_creates > 0) {
                toast.warning("Some assets failed to import", {
                    description: `${data.failed_creates} assets could not be created.`,
                });
            }
            queryClient.invalidateQueries({ queryKey: ['assets', connectionId] });
            const successfulNames = new Set(
                [...selectedDiscovered].filter(
                    name => !data.failures.some((f: { name: string; reason: string }) => f.name === name)
                )
            );
            setDiscoveredAssets(discoveredAssets.filter(a => !successfulNames.has(a.name)));
            setSelectedDiscovered(new Set());
        },
        onError: (err: any) => {
            toast.error("Bulk Import Failed", {
                description: err.response?.data?.detail?.message || "An unexpected error occurred."
            });
        }
    });


    return (
        <div className="h-full flex flex-col rounded-2xl border border-border/40 bg-background/40 backdrop-blur-xl shadow-xl overflow-hidden relative">
            <div className="p-4 md:p-5 border-b border-border/40 bg-muted/10 flex flex-col md:flex-row items-center justify-between shrink-0 gap-4 md:gap-6">
                <div className="space-y-0.5 relative z-10">
                    <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Layers className="h-3.5 w-3.5" />
                        </div>
                        Assets Registry
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-tight pl-1">
                        <span className="text-foreground">{assets?.length || 0}</span> MANAGED • <span className="text-amber-600 dark:text-amber-500">{discoveredAssets.length}</span> DISCOVERED
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-56 group">
                        <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors z-20" />
                        <Input
                            placeholder="Filter assets..."
                            className="pl-8 h-8 rounded-lg bg-background/50 border-border/40 focus:bg-background focus:border-primary/30 focus:ring-2 focus:ring-primary/5 transition-all shadow-none text-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                        <Button
                            onClick={onDiscover}
                            size="icon"
                            variant="outline"
                            className="rounded-lg border-border/40 bg-background/50 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5 transition-all h-8 w-8 shrink-0 shadow-none"
                            disabled={isLoading}
                            title="Discover new assets"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", isLoading && "animate-spin text-primary")} />
                        </Button>
                        <Button 
                            size="sm" 
                            className="rounded-lg shadow-sm h-8 px-3 gap-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95" 
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Asset</span>
                        </Button>
                    </div>
                </div>
            </div>

            <CreateAssetsDialog 
                connectionId={connectionId}
                connectorType={connectorType}
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 hover:scrollbar-thumb-border/80 scrollbar-track-transparent">
                <AnimatePresence mode="popLayout">
                    {filteredDiscovered.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-b border-border/40 rounded-none relative z-20"
                        >
                            <div className="sticky top-0 z-30 px-6 py-2.5 bg-muted/90 backdrop-blur-md border-b border-border/40 flex items-center justify-between gap-2 shadow-sm">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-500">
                                        <Sparkles className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest">
                                        Discovered Potential Assets
                                    </h3>
                                </div>
                                {selectedDiscovered.size > 0 ? (
                                     <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-amber-600/80 uppercase tracking-tighter">
                                            {selectedDiscovered.size} selected
                                        </span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button 
                                                    size="sm" 
                                                    className="h-7 px-3 rounded-lg bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 border-none gap-1.5 text-[10px] font-bold" 
                                                    disabled={bulkImportMutation.isPending}
                                                >
                                                    {bulkImportMutation.isPending ? (
                                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Download className="h-3 w-3" />
                                                    )}
                                                    Import
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-border/60 shadow-xl p-1">
                                                <DropdownMenuItem 
                                                    onClick={() => bulkImportMutation.mutate({ assetNames: Array.from(selectedDiscovered), asDestination: false })}
                                                    className="rounded-lg text-xs font-medium py-2 gap-2"
                                                >
                                                    <Database className="h-3.5 w-3.5 text-primary" />
                                                    Import as Source(s)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => bulkImportMutation.mutate({ assetNames: Array.from(selectedDiscovered), asDestination: true })}
                                                    className="rounded-lg text-xs font-medium py-2 gap-2"
                                                >
                                                    <Download className="h-3.5 w-3.5 text-emerald-500" />
                                                    Import as Destination(s)
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                     </div>
                                ) : (
                                    <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-500 bg-amber-500/10 text-[10px] font-bold">
                                        {filteredDiscovered.length} NEW ITEMS
                                    </Badge>
                                )}
                            </div>
                            <Table wrapperClassName="rounded-none border-none shadow-none">
                                <TableHeader className="bg-muted/30 border-b border-border/20">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="w-12 pl-6">
                                            <Checkbox
                                                checked={selectedDiscovered.size > 0 && selectedDiscovered.size === filteredDiscovered.length}
                                                onCheckedChange={(checked) => handleSelectAllDiscovered(Boolean(checked))}
                                                className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                            />
                                        </TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/70">Asset Name</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/70 text-right pr-6">Type</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDiscovered.map((asset, idx) => (
                                        <TableRow 
                                            key={idx} 
                                            className={cn(
                                                "hover:bg-amber-500/5 transition-colors border-b border-amber-500/10 group",
                                                selectedDiscovered.has(asset.name) && "bg-amber-500/5"
                                            )}
                                        >
                                            <TableCell className="pl-6 py-2.5">
                                                <Checkbox
                                                    checked={selectedDiscovered.has(asset.name)}
                                                    onCheckedChange={(checked) => handleSelectDiscovered(asset.name, Boolean(checked))}
                                                    className="border-amber-500/30 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                                />
                                            </TableCell>
                                            <TableCell className="font-bold text-sm text-foreground/80 group-hover:text-amber-700 dark:group-hover:text-amber-500 transition-colors">
                                                {asset.name}
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-2.5">
                                                <Badge variant="outline" className="capitalize text-[9px] font-bold tracking-widest bg-muted/50 border-amber-500/20 text-muted-foreground">
                                                    {asset.type || asset.asset_type}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Managed Assets Section */}
                <div className="relative z-10">
                    <div className="sticky top-0 z-30 px-6 py-2.5 bg-muted/90 backdrop-blur-md border-b border-border/40 font-bold text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-2 shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        Active Managed Assets
                    </div>
                    
                    {isLoading && !assets ? (
                        <div className="divide-y divide-border/20">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex justify-between items-center py-4 px-6">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-24 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : filteredAssets.length > 0 ? (
                        <Table wrapperClassName="rounded-none border-none shadow-none">
                            <TableHeader className="bg-muted/20 border-b border-border/20">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground/70">Asset</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/70">Type</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/70">Schema</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/70">Sync Status</TableHead>
                                    <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground/70">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-border/30">
                                {filteredAssets.map((asset) => (
                                    <AssetTableRow key={asset.id} asset={asset} connectionId={connectionId} />
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative mb-6"
                            >
                                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                                <div className="relative h-20 w-20 glass-card rounded-3xl border-border/40 flex items-center justify-center shadow-xl">
                                    {searchQuery ? (
                                        <Search className="h-10 w-10 text-muted-foreground/30" />
                                    ) : (
                                        <Database className="h-10 w-10 text-muted-foreground/30" />
                                    )}
                                </div>
                            </motion.div>
                            <h3 className="font-bold text-xl text-foreground">
                                {searchQuery ? "No matching assets found" : "No managed assets yet"}
                            </h3>
                            <p className="text-sm mt-2 max-w-sm leading-relaxed text-muted-foreground font-medium">
                                {searchQuery
                                    ? `We couldn't find any assets matching "${searchQuery}". Try a broader term.`
                                    : "You haven't added any assets to this connection yet. Discover assets or add them manually."}
                            </p>
                            {!searchQuery && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-8 rounded-xl border-dashed border-border/60 bg-background/50 hover:border-primary/50 hover:bg-primary/5 px-6 gap-2 font-bold transition-all shadow-sm" 
                                    onClick={onDiscover}
                                >
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    Discover Assets Now
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ConfigurationTabContent = ({ 
    connection, 
    impactData, 
    loadingImpact,
    usageStats,
    loadingUsageStats
}: { 
    connection: any;
    impactData: any;
    loadingImpact: boolean;
    usageStats: any;
    loadingUsageStats: boolean;
}) => {
    const config = connection.config || {};
    
    const mainFields = ['host', 'port', 'database', 'username', 'database_path', 'url', 'account', 'warehouse', 'schema', 'role', 'bucket', 'region'];
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'api_key', 'access_key'];
    
    const configEntries = Object.entries(config).filter(
        ([key]) => !mainFields.includes(key.toLowerCase()) && !sensitiveKeys.some(sk => key.toLowerCase().includes(sk))
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border/50 hover:scrollbar-thumb-border/80 scrollbar-track-transparent">
            {/* Config Details */}
            <div className="lg:col-span-3 space-y-6 pb-20">
                <div className="rounded-2xl border border-border/40 bg-background/40 backdrop-blur-xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-border/40 bg-muted/10 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                    <Settings2 className="h-3.5 w-3.5" />
                                </div>
                                Technical Parameters
                            </h3>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20 tracking-widest px-2 py-0.5">
                            CONFIG ID: {connection.id}
                        </Badge>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <ConfigField label="Display Name" value={connection.name} copyable />
                            <ConfigField 
                                label="Connector Engine" 
                                value={
                                    <Badge variant="outline" className="capitalize font-bold bg-muted/50 text-foreground/70 border-border/50 tracking-wider text-[10px]">
                                        {connection.connector_type}
                                    </Badge>
                                } 
                            />
                            {config.host && <ConfigField label="Hostname" value={config.host} copyable />}
                            {config.port && <ConfigField label="Port" value={String(config.port)} />}
                            {config.database && <ConfigField label="Database" value={config.database} copyable />}
                            {config.username && <ConfigField label="Username" value={config.username} copyable />}
                            {config.database_path && <ConfigField label="Path" value={config.database_path} copyable />}
                            {config.account && <ConfigField label="Account" value={config.account} copyable />}
                            {config.warehouse && <ConfigField label="Warehouse" value={config.warehouse} />}
                            {config.schema && <ConfigField label="Schema" value={config.schema} />}
                            {config.bucket && <ConfigField label="Bucket" value={config.bucket} copyable />}
                            {config.region && <ConfigField label="Region" value={config.region} />}
                        </div>

                        {configEntries.length > 0 && (
                            <>
                                <div className="h-px bg-linear-to-r from-transparent via-border/30 to-transparent" />
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {configEntries.map(([key, value]) => (
                                        <ConfigField 
                                            key={key} 
                                            label={key.replace(/_/g, ' ')} 
                                            value={typeof value === 'object' ? JSON.stringify(value) : String(value)} 
                                            copyable 
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="h-px bg-linear-to-r from-transparent via-border/30 to-transparent" />

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-2">
                                <Key className="h-3 w-3 text-primary/70" /> 
                                Security & Authentication
                            </h4>
                            <div className="rounded-xl border border-border/40 bg-muted/5 p-4 flex items-center justify-between shadow-inner">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Storage Status</p>
                                    <div className="font-mono text-xs tracking-[0.4em] text-foreground/20">••••••••••••••••</div>
                                </div>
                                <Badge variant="outline" className="text-[9px] bg-emerald-500/5 text-emerald-600 dark:text-emerald-500 border-emerald-500/20 font-bold px-2 py-0.5 uppercase tracking-widest">
                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                    Encrypted
                                </Badge>
                            </div>
                        </div>

                        {connection.description && (
                            <ConfigField label="Administrative Description" value={connection.description} />
                        )}
                        
                        <div className="h-px bg-linear-to-r from-transparent via-border/30 to-transparent" />

                        <div className="grid gap-4 md:grid-cols-2">
                            <ConfigField label="Created On" value={format(new Date(connection.created_at || ''), 'PPP')} />
                            <ConfigField label="Last Updated" value={format(new Date(connection.updated_at || ''), 'PPP')} />
                        </div>
                    </div>
                </div>

                <EnvironmentInfo connectionId={connection.id} />
            </div>

            {/* Side Panel Info */}
            <div className="space-y-6 h-fit">
                {/* Usage Stats Section */}
                <div className="rounded-2xl border border-border/40 bg-background/40 backdrop-blur-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border/40 bg-muted/10 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">
                            Usage Statistics
                        </h4>
                    </div>
                    <div className="p-4 space-y-4">
                        {loadingUsageStats ? (
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-center">
                                    <div className="text-xl font-black text-primary">
                                        {usageStats?.last_24h_runs || 0}
                                    </div>
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                                        24h Runs
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-center">
                                    <div className="text-xl font-black text-emerald-500">
                                        {usageStats?.sync_success_rate ? `${usageStats.sync_success_rate.toFixed(0)}%` : '100%'}
                                    </div>
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                                        Success Rate
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="pt-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-1">
                                <span>Total (7d)</span>
                                <span>{usageStats?.last_7d_runs || 0} runs</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden border border-border/20">
                                <div 
                                    className="h-full bg-primary rounded-full transition-all duration-500" 
                                    style={{ width: `${usageStats?.sync_success_rate || 100}%` }} 
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold px-1">
                            <span className="text-muted-foreground uppercase tracking-widest">Avg Latency</span>
                            <span className="text-foreground">{usageStats?.average_latency_ms ? `${usageStats.average_latency_ms.toFixed(0)}ms` : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-amber-500/20 bg-amber-500/10 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <h4 className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest">
                            Impact Analysis
                        </h4>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="text-xs text-amber-900/70 dark:text-amber-200/70 leading-relaxed font-semibold">
                            {loadingImpact ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-full bg-amber-500/10" />
                                    <Skeleton className="h-4 w-[85%] bg-amber-500/10" />
                                </div>
                            ) : (
                                <>
                                    Actively utilized by{' '}
                                    <span className="text-amber-700 dark:text-amber-500 font-black">
                                        {impactData?.pipeline_count || 0} pipelines
                                    </span>.
                                    Parameter changes will disrupt scheduled syncs.
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ConnectionConfigStats = ({ connection, connectionId }: { connection: any; connectionId: number }) => {
    const {
        data: impactData,
        isLoading: loadingImpact
    } = useQuery({
        queryKey: ['connectionImpact', connectionId],
        queryFn: () => getConnectionImpact(connectionId),
        enabled: !!connection,
    });

    const {
        data: usageStats,
        isLoading: loadingUsageStats
    } = useQuery({
        queryKey: ['connectionUsageStats', connectionId],
        queryFn: () => getConnectionUsageStats(connectionId),
        enabled: !!connection,
    });

    return (
        <ConfigurationTabContent
            connection={connection}
            impactData={impactData}
            loadingImpact={loadingImpact}
            usageStats={usageStats}
            loadingUsageStats={loadingUsageStats}
        />
    );
};

export const ConnectionDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const connectionId = parseInt(id!);
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('assets');
    const [discoveredAssets, setDiscoveredAssets] = useState<any[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const {
        data: connection,
        isLoading: loadingConnection,
        isError: isConnectionError
    } = useQuery({
        queryKey: ['connection', connectionId],
        queryFn: () => getConnection(connectionId),
        retry: 1
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteConnection(connectionId),
        onSuccess: () => {
            toast.success("Connection deleted");
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            navigate('/connections');
        },
        onError: () => toast.error("Failed to delete connection")
    });

    const {
        data: assets,
        isLoading: loadingAssets 
    } = useQuery({
        queryKey: ['assets', connectionId],
        queryFn: () => getConnectionAssets(connectionId),
        enabled: !!connection
    });

    const testMutation = useMutation({
        mutationFn: () => testConnection(connectionId),
        onSuccess: (data: ConnectionTestResult) => {
            if (data.success) {
                toast.success("Connection Healthy", {
                    description: `${data.message || 'The system can successfully communicate with the data source.'}`,
                    icon: <ShieldCheck className="text-emerald-500 h-4 w-4" />
                });
            } else {
                toast.error("Connection Failed", {
                    description: data.message || "The data source could not be reached. Please check your credentials and host settings.",
                    icon: <AlertTriangle className="text-destructive h-4 w-4" />
                });
            }
        },
        onError: () => toast.error("Test execution failed", {
            description: "An internal error occurred while trying to verify connectivity."
        })
    });

    const discoverMutation = useMutation({
        mutationFn: () => discoverAssets(connectionId),
        onSuccess: (data: any) => {
            const newAssets = data.assets || [];
            toast.success(`Discovery Complete`, { description: `Found ${data.discovered_count || newAssets.length || 0} items` });
            setDiscoveredAssets(newAssets);
        },
                onError: () => toast.error("Discovery failed")
            });
    if (loadingConnection) return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-56" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
            <Skeleton className="h-[600px] w-full rounded-3xl" />
        </div>
    );

    if (isConnectionError || !connection) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-8 animate-in fade-in duration-500">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
            >
                <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full" />
                <div className="relative h-24 w-24 glass-card rounded-3xl flex items-center justify-center shadow-2xl">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
            </motion.div>
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Connection Not Found</h2>
                <p className="max-w-md mx-auto text-sm leading-relaxed">
                    The connection you are looking for does not exist or you do not have permission to view it.
                </p>
            </div>
            <Button 
                variant="outline" 
                onClick={() => navigate('/connections')} 
                className="gap-2 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
                <ArrowLeft className="h-4 w-4" /> Return to Connections
            </Button>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 md:gap-8 animate-in fade-in duration-700 p-4 md:p-0">
            <PageMeta title={connection.name} description={`Manage ${connection.name} connection details.`} />

            {/* --- Page Header --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-6 md:gap-0 px-1">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 hover:bg-muted/50 rounded-2xl border border-border/40 transition-all shadow-sm hover:shadow-md hidden md:flex"
                        onClick={() => navigate('/connections')}
                    >
                        <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                    </Button>

                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-2xl ring-1 ring-border/50 backdrop-blur-md shadow-sm">
                                    <Database className="h-6 w-6 text-primary" />
                                </div>
                                {connection.name}
                            </h2>
                            <Badge variant="outline" className={cn(
                                "uppercase text-[10px] tracking-widest font-bold px-2.5 py-1 rounded-lg shadow-sm mt-1",
                                connection.health_status === 'active'
                                    ? "text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
                                    : "text-muted-foreground border-border bg-muted/50"
                            )}>
                                {connection.health_status || 'UNKNOWN'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium pl-1 overflow-x-auto whitespace-nowrap scrollbar-none">
                            <span className="flex items-center gap-1.5 capitalize">
                                <span className="font-semibold text-foreground/70">{connection.connector_type}</span>
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
                            <span className="flex items-center gap-1.5 font-mono">
                                ID: <span className="font-bold text-foreground/70">{connection.id}</span>
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                Updated {formatDistanceToNow(new Date(connection.updated_at || new Date()), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/explorer?connectionId=${connection.id}`)}
                        className="h-11 px-5 rounded-2xl border-border/40 bg-background/40 backdrop-blur-md hover:shadow-lg transition-all shadow-sm font-semibold gap-2"
                    >
                        <Search className="h-4 w-4 text-primary" />
                        Explore Data
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testMutation.mutate()}
                        disabled={testMutation.isPending}
                        className={cn(
                            "h-11 px-5 rounded-2xl border-border/40 bg-background/40 backdrop-blur-md hover:shadow-lg transition-all shadow-sm font-semibold gap-2 min-w-40",
                            testMutation.isSuccess && "text-emerald-600 dark:text-emerald-500 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                        )}
                    >
                        {testMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : testMutation.isSuccess ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <Activity className="h-4 w-4" />
                        )}
                        {testMutation.isPending ? 'Testing...' : 'Test Connection'}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-11 w-11 rounded-2xl border-border/40 bg-background/40 backdrop-blur-md hover:shadow-lg transition-all shadow-sm"
                            >
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/60 glass-panel shadow-2xl p-2">
                            <DropdownMenuItem 
                                className="rounded-xl cursor-pointer py-2.5 gap-2.5 font-medium"
                                onClick={() => setIsEditDialogOpen(true)}
                            >
                                <Pencil className="h-4 w-4 text-primary" /> Edit Connection
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/40 my-1.5" />
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-xl py-2.5 gap-2.5 font-medium"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-4 w-4" /> Delete Connection
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-3xl glass-panel border-border/60 shadow-2xl overflow-hidden p-0">
                    <div className="p-8 space-y-4">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-bold tracking-tight">Delete Connection?</AlertDialogTitle>
                            <AlertDialogDescription className="text-base leading-relaxed text-muted-foreground">
                                This will permanently delete the connection <span className="font-bold text-foreground">"{connection.name}"</span> and all its metadata.
                                Any pipelines using this connection will <span className="text-destructive font-semibold">stop working immediately</span>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="bg-muted/30 p-6 gap-3">
                        <AlertDialogCancel className="rounded-xl border-border/40 bg-background/50 hover:bg-background font-semibold h-11 px-6">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl shadow-lg shadow-destructive/20 font-semibold h-11 px-6"
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete Connection"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- Content Tabs --- */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                    <TabsList className="h-10 bg-muted/50 border border-border/40 rounded-xl p-1 shadow-inner gap-1">
                        <TabsTrigger
                            value="assets"
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                        >
                            <Layers className="h-3.5 w-3.5" />
                            Assets
                        </TabsTrigger>

                        <TabsTrigger
                            value="configuration"
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                        >
                            <Server className="h-3.5 w-3.5" />
                            Configuration
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 min-h-0">
                    <TabsContent value="assets" className="h-full mt-0 focus-visible:outline-none">
                        <AssetsTabContent
                            connectionId={connectionId}
                            connectorType={connection.connector_type}
                            assets={assets}
                            discoveredAssets={discoveredAssets}
                            isLoading={loadingAssets || discoverMutation.isPending}
                            onDiscover={() => discoverMutation.mutate()}
                            setDiscoveredAssets={setDiscoveredAssets}
                        />
                    </TabsContent>

                    <TabsContent value="configuration" className="h-full mt-0 focus-visible:outline-none">
                        <ConnectionConfigStats
                            connection={connection}
                            connectionId={connectionId}
                        />
                    </TabsContent>
                                </div>
                            </Tabs>
                
                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                <DialogContent className="max-w-5xl h-[700px] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border-border/60 glass-panel shadow-2xl backdrop-blur-3xl">
                                    <CreateConnectionDialog
                                        initialData={connection}
                                        onClose={() => setIsEditDialogOpen(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    );
                };
                