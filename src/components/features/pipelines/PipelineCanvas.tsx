import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import '@xyflow/react/dist/style.css'; 

import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  type NodeTypes,
  Position,
  useReactFlow,
  Panel,
} from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Save, Play, ArrowLeft, Loader2, Layout, 
    Database, ArrowRightLeft, HardDriveUpload,
    Rocket, Square, Pencil, MousePointer2, History as HistoryIcon,
    ExternalLink, Trash2, Plus, Search
} from 'lucide-react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import dagre from 'dagre';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuItem, 
} from '@/components/ui/dropdown-menu';

// API Imports
import { 
    getPipeline, 
    updatePipeline,
    createPipeline,
    triggerPipeline, 
    createPipelineVersion, 
    publishPipelineVersion,
    getPipelineVersion,
    deletePipeline,
    getPipelineVersions,
    type PipelineNode as ApiNode, 
    type PipelineEdge as ApiEdge,
    type PipelineCreate
} from '@/lib/api';

// Custom Components
import PipelineNode from '@/components/features/pipelines/PipelineNode'; 
import { NodeProperties } from '@/components/features/pipelines/NodeProperties';
import { PipelineVersionDialog } from '@/components/features/pipelines/PipelineVersionDialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
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

/* --- Layout Engine --- */
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    dagreGraph.setGraph({ rankdir: 'LR', align: 'UL', ranksep: 120, nodesep: 60 });
    nodes.forEach((node) => dagreGraph.setNode(node.id, { width: 280, height: 100 }));
    edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
            position: { x: nodeWithPosition.x - 140, y: nodeWithPosition.y - 50 },
        };
    });
    return { nodes: layoutedNodes, edges };
};

// Helper: Map Backend OperatorType to Frontend Node Type
const mapOperatorToNodeType = (opType: string) => {
    switch (opType) {
        case 'extract': return 'source';
        case 'load': return 'sink';
        case 'transform': return 'transform';
        case 'validate': return 'transform';
        case 'noop': return 'transform';
        case 'merge': return 'transform';
        case 'union': return 'transform';
        case 'join': return 'transform';
        default: return 'default';
    }
};

// Helper: Map Frontend Node Type to Backend OperatorType
const mapNodeTypeToOperator = (nodeType: string, operatorClass?: string) => {
    // Explicit overrides based on operator class
    if (operatorClass === 'merge') return 'merge';
    if (operatorClass === 'union') return 'union';
    if (operatorClass === 'join') return 'join';
    if (operatorClass === 'validate') return 'validate';
    if (operatorClass === 'noop') return 'noop';
    
    // Fallback to node type mapping
    switch (nodeType) {
        case 'source': return 'extract';
        case 'sink': return 'load';
        case 'transform': return 'transform';
        default: return 'transform';
    }
};

// Helper: Detailed Node Definitions for Toolbox
const NODE_DEFINITIONS = [
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
            { label: "Join Datasets", type: "transform", opClass: "join", icon: ArrowRightLeft, desc: "Merge data based on keys" },
            { label: "Union All", type: "transform", opClass: "union", icon: ArrowRightLeft, desc: "Combine datasets vertically" },
            { label: "Merge", type: "transform", opClass: "merge", icon: ArrowRightLeft, desc: "Upsert/Merge data logic" }
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
            { label: "Validate Schema", type: "transform", opClass: "validate", icon: ArrowRightLeft, desc: "Enforce schema & rules" },
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
            { label: "No-Op", type: "transform", opClass: "noop", icon: ArrowRightLeft, desc: "Pass-through (Testing)" }
        ]
    }
];

export const PipelineCanvas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const versionIdParam = searchParams.get('version');
  
  const isNew = id === 'new';
  const queryClient = useQueryClient();
  const { fitView } = useReactFlow();
  const { theme } = useTheme();
  
  // State
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [pipelineName, setPipelineName] = useState("Untitled Pipeline");
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const initializedVersionId = useRef<number | null>(null);

  const flowTheme = useMemo(() => (theme === 'dark' ? 'dark' : 'light'), [theme]);

  // --- Queries ---
  const { data: pipeline, isLoading: isLoadingPipeline } = useQuery({  
      queryKey: ['pipeline', id], 
      queryFn: () => getPipeline(parseInt(id!)), 
      enabled: !isNew 
  });

  const { data: specificVersion, isLoading: isLoadingVersion } = useQuery({
      queryKey: ['pipeline-version', id, versionIdParam],
      queryFn: () => getPipelineVersion(parseInt(id!), parseInt(versionIdParam!)),
      enabled: !isNew && !!versionIdParam
  });

  const isLoading = isLoadingPipeline || (!!versionIdParam && isLoadingVersion);

  const nodeTypes = useMemo<NodeTypes>(() => ({
    source: PipelineNode,
    transform: PipelineNode,
    sink: PipelineNode,
    default: PipelineNode
  }), []);

  // --- Mutations ---
  const deleteMutation = useMutation({
      mutationFn: () => deletePipeline(parseInt(id!)),
      onSuccess: () => {
          toast.success("Pipeline Deleted", {
              description: `"${pipelineName}" has been permanently removed.`
          });
          queryClient.invalidateQueries({ queryKey: ['pipelines'] });
          navigate('/pipelines');
      },
      onError: (err: any) => {
          toast.error("Deletion Failed", {
              description: err.response?.data?.detail?.message || "There was an error deleting the pipeline."
          });
      }
  });

  // --- Initialization ---
  useEffect(() => {
    if (!pipeline) return;
    
    // Determine which version to load:
    // 1. Specifically requested one (?version=X)
    // 2. The latest version (most recent work/draft)
    // 3. The published version (active)
    const versionToLoad = specificVersion || pipeline.latest_version || pipeline.published_version;
    
    if (!versionToLoad) {
        setPipelineName(pipeline.name);
        return;
    }

    if (initializedVersionId.current === versionToLoad.id) return;
    
    initializedVersionId.current = versionToLoad.id;
    setPipelineName(pipeline.name);
    
    const flowNodes: Node[] = versionToLoad.nodes.map((n: ApiNode) => ({
        id: n.node_id, 
        type: mapOperatorToNodeType(n.operator_type), 
        data: { 
            label: n.name, 
            config: n.config,
            type: mapOperatorToNodeType(n.operator_type),
            operator_class: n.operator_class,
            status: 'idle',
            // Populate Asset IDs
            source_asset_id: n.source_asset_id,
            destination_asset_id: n.destination_asset_id,
            // Also map to connection_id if stored in config or inferable
            connection_id: n.config?.connection_id
        },
        position: n.config?.ui?.position || { x: 0, y: 0 },
    }));

    const flowEdges: Edge[] = versionToLoad.edges.map((e: ApiEdge) => ({
        id: `e-${e.from_node_id}-${e.to_node_id}`,
        source: e.from_node_id,
        target: e.to_node_id,
        type: 'smoothstep', 
        animated: false,
        style: { stroke: 'var(--color-border)', strokeWidth: 2 },
    }));

    const needsLayout = flowNodes.length > 0 && flowNodes.every(n => n.position.x === 0 && n.position.y === 0);
    
    if (needsLayout) {
        const layouted = getLayoutedElements(flowNodes, flowEdges);
        setNodes(layouted.nodes);
        setEdges(layouted.edges);
    } else {
        setNodes(flowNodes);
        setEdges(flowEdges);
    }
    setTimeout(() => window.requestAnimationFrame(() => fitView({ padding: 0.2 })), 100);
  }, [pipeline, specificVersion, setNodes, setEdges, fitView]);

  // --- Handlers ---
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
        ...params, 
        type: 'smoothstep', 
        animated: true, 
        style: { stroke: 'var(--color-primary)', strokeWidth: 2, strokeDasharray: '5,5' },
    }, eds)),
    [setEdges],
  );

  const onAddNode = (type: string, operatorClass?: string, label?: string) => {
      const newNodeId = `node_${Date.now()}`;
      // Center the node somewhat in the view or randomize slightly
      const offset = Math.random() * 50; 
      const newNode: Node = {
          id: newNodeId,
          type: type,
          position: { x: 250 + offset, y: 250 + offset },
          data: { 
              label: label || `New ${type}`, 
              type: type, 
              operator_class: operatorClass || 'pandas_transform',
              config: {}, 
              status: 'idle' 
          },
      };
      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNodeId);
      toast.success("Operator Added", { 
          description: `Added ${label} to the canvas.` 
      });
  };

  const onLayout = useCallback(() => {
      const layouted = getLayoutedElements([...nodes], [...edges]);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      setTimeout(() => window.requestAnimationFrame(() => fitView({ duration: 800, padding: 0.2 })), 10);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  // --- Mutations ---
  const runMutation = useMutation({
      mutationFn: () => triggerPipeline(parseInt(id!)),
      onMutate: () => setIsRunning(true),
      onSuccess: (data) => {
          toast.success("Pipeline Started", {
              description: `Execution is now running in the background. Job ID: ${data.job_id}`
          });
          setTimeout(() => setIsRunning(false), 3000); 
      },
      onError: (err: any) => {
          toast.error("Execution Failed", {
              description: err.response?.data?.detail?.message || "There was an error starting the pipeline."
          });
          setIsRunning(false);
      }
  });

  const saveMutation = useMutation({
      mutationFn: async ({ deploy = false }: { deploy?: boolean }) => {
          try {
              setIsSaving(true);
              
              const apiNodes = nodes.map(n => {
                  const nodeData = n.data as any;
                  return {
                      node_id: n.id,
                      name: nodeData.label as string,
                      operator_type: mapNodeTypeToOperator(n.type || 'default', nodeData.operator_class),
                      config: { 
                          ...(nodeData.config as object), 
                          ui: { position: n.position },
                          connection_id: nodeData.connection_id 
                      },
                      order_index: 0, 
                      operator_class: (nodeData.operator_class as string) || 'pandas_transform',
                      source_asset_id: nodeData.source_asset_id,
                      destination_asset_id: nodeData.destination_asset_id
                  };
              });

              const apiEdges = edges.map(e => ({ from_node_id: e.source, to_node_id: e.target }));

              if (isNew) {
                  const payload: PipelineCreate = {
                      name: pipelineName || "New Pipeline",
                      initial_version: {
                          nodes: apiNodes,
                          edges: apiEdges,
                          version_notes: "Initial draft"
                      }
                  };
                  const createdPipeline = await createPipeline(payload);
                  
                  if (deploy && createdPipeline.current_version) {
                      // Initial version number is 1, but we need the ID
                      const versions = await getPipelineVersions(createdPipeline.id);
                      if (versions.length > 0) {
                          await publishPipelineVersion(createdPipeline.id, versions[0].id);
                      }
                  }
                  
                  return { type: 'create', pipeline: createdPipeline };
              } else {
                  const newVersion = await createPipelineVersion(parseInt(id!), {
                      nodes: apiNodes,
                      edges: apiEdges,
                      version_notes: deploy ? `Deployed at ${new Date().toLocaleTimeString()}` : 'Auto-save'
                  });
                  
                  if (deploy) await publishPipelineVersion(parseInt(id!), newVersion.id);
                  if (pipelineName !== pipeline?.name) await updatePipeline(parseInt(id!), { name: pipelineName });
                  return { type: 'update' };
              }
          } catch (error) {
              console.error("Mutation function error:", error);
              throw error;
          }
      },
      onSuccess: (result, vars) => {
          if (result.type === 'create' && result.pipeline) {
              toast.success("Pipeline Created", {
                  description: `"${pipelineName}" has been successfully initialized.`
              });
              window.history.replaceState(null, '', `/pipelines/${result.pipeline.id}`);
              window.location.reload(); 
          } else {
              if (pipeline) initializedVersionId.current = pipeline.published_version_id || null;
              queryClient.invalidateQueries({ queryKey: ['pipeline', id] });
              queryClient.invalidateQueries({ queryKey: ['pipelines'] });
              toast.success(vars.deploy ? "Successfully Deployed" : "Draft Saved", {
                  description: vars.deploy 
                    ? "Your changes are now live and will be used for future runs." 
                    : "Work-in-progress changes have been saved."
              });
          }
      },
      onSettled: () => {
          setIsSaving(false);
      },
      onError: (err: any) => {
          toast.error("Save Failed", { 
              description: err.response?.data?.detail?.message || err.message || "An unexpected error occurred while saving." 
          });
      }
  });

  if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm font-medium tracking-widest uppercase opacity-70">Loading Canvas...</p>
      </div>
  );

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex flex-col h-full w-full p-2 md:p-4 gap-4">

      {/* --- HEADER TOOLBAR (Simplified) --- */}
      <header className="flex-none flex items-center justify-between px-2">
          
          {/* Left: Identity */}
          <div className="flex items-center gap-4">
              <Link to="/pipelines">
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted/50">
                                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>Back to List</TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </Link>
              
              <div className="flex flex-col gap-0.5">
                  <div className="relative group flex items-center">
                    <Input 
                        value={pipelineName}
                        onChange={(e) => setPipelineName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        className="
                            h-9 w-[200px] md:w-[260px] 
                            bg-transparent border-none shadow-none 
                            text-base font-semibold tracking-tight 
                            px-3 rounded-lg
                            transition-all duration-200 
                            text-foreground
                            placeholder:text-muted-foreground/50
                            hover:bg-foreground/5 
                            focus-visible:bg-foreground/5 focus-visible:ring-1 focus-visible:ring-primary/20
                            truncate pr-9 cursor-text
                        "
                    />
                    <div className="absolute right-3 flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </div>
                </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground px-2">
                      <Badge variant="outline" className={cn(
                          "h-4 px-1.5 font-mono border-0 text-[10px]",
                          pipeline?.status === 'active' ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      )}>
                          {isNew ? 'DRAFT' : pipeline?.status?.toUpperCase()}
                      </Badge>
                      <span className="hidden sm:inline">
                          {isNew ? 'v1' : `v${versionIdParam || pipeline?.latest_version?.version || pipeline?.published_version?.version || '?'}`}
                      </span>
                      {!isNew && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 rounded-md hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1.5"
                            onClick={() => setVersionsOpen(true)}
                        >
                            <HistoryIcon className="h-3 w-3" />
                            <span>History</span>
                        </Button>
                      )}
                  </div>
              </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {!isNew && (
                <div className="flex items-center gap-2">
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={deleteMutation.isPending}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-border/40 mx-1" />
                     {isRunning ? (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-9 rounded-full px-4 gap-2 animate-in fade-in"
                            onClick={() => setIsRunning(false)}
                        >
                            <Square className="h-3.5 w-3.5 fill-current" />
                            <span className="hidden sm:inline">Stop</span>
                        </Button>
                     ) : (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 rounded-full border-success/20 text-success hover:text-success hover:bg-success/5 hover:border-success/40 gap-2"
                            onClick={() => runMutation.mutate()}
                            disabled={runMutation.isPending}
                        >
                            {runMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Play className="h-3.5 w-3.5 fill-current" />}
                            <span className="hidden sm:inline">Run</span>
                        </Button>
                     )}
                </div>
            )}
             
            <div className="flex items-center gap-2">
                 <Button 
                    variant="secondary"
                    size="sm" 
                    onClick={() => saveMutation.mutate({ deploy: false })} 
                    disabled={isSaving || !!versionIdParam}
                    className="h-9 rounded-full px-4 font-medium"
                >
                    <Save className="mr-2 h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Draft</span>
                </Button>
                 <Button 
                    size="sm" 
                    onClick={() => saveMutation.mutate({ deploy: true })} 
                    disabled={isSaving || !!versionIdParam}
                    className="h-9 rounded-full px-5 shadow-lg shadow-primary/20 bg-primary text-primary-foreground font-semibold hover:shadow-primary/30 transition-all gap-2"
                >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Rocket className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">Deploy</span>
                </Button>
             </div>
          </div>
      </header>

      {/* --- CANVAS --- */}
      <div className="flex-1 w-full relative glass-panel rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-background/50">
          <div className="absolute inset-0 bg-grid-subtle opacity-20 pointer-events-none" />

          {/* Historical Version Banner - Relocated to Bottom for better UX */}
          {versionIdParam && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] w-fit min-w-[400px] max-w-[90%] bg-background/60 backdrop-blur-2xl border border-primary/30 rounded-2xl px-6 py-4 flex items-center justify-between gap-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500 ring-1 ring-white/5">
                  <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                          <HistoryIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Read-Only Snapshot</span>
                            <Badge className="h-4 px-1.5 bg-primary/20 text-primary border-none text-[9px] font-black">v{versionIdParam}</Badge>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">You are inspecting a historical state. Edits are disabled.</span>
                      </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate(`/pipelines/${id}`)}
                    className="h-10 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 gap-2 text-[10px] font-black uppercase tracking-widest px-4 group"
                  >
                      Exit View <ExternalLink className="h-3.5 w-3.5 group-hover:rotate-45 transition-transform" />
                  </Button>
              </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            colorMode={flowTheme}
            minZoom={0.2}
            maxZoom={2}
            defaultEdgeOptions={{ type: 'smoothstep', style: { strokeWidth: 2, stroke: 'var(--color-border)' } }}
            proOptions={{ hideAttribution: true }}
            className="transition-colors duration-500"
          >
            <Background 
                variant={BackgroundVariant.Dots} 
                gap={24} 
                size={1.5} 
                color="var(--muted-foreground)"
                className="opacity-20"
            />
            
            <Controls className="bg-background/80! backdrop-blur-xl! border-border/40! shadow-lg! rounded-xl! overflow-hidden m-2 md:m-4 border fill-foreground text-foreground" showInteractive={false} />
            
            <MiniMap 
                className="hidden md:block bg-background/80! backdrop-blur-xl! border-border/40! shadow-lg! rounded-xl! overflow-hidden m-4 border" 
                nodeColor={(node) => {
                    if (node.type === 'source') return 'var(--color-chart-1)';
                    if (node.type === 'transform') return 'var(--color-chart-3)';
                    if (node.type === 'sink') return 'var(--color-chart-2)';
                    return 'var(--muted)';
                }}
                maskColor="var(--color-background)"
                style={{ opacity: 0.7 }}
                position="bottom-right"
            />

            {/* FLOATING TOOLBOX PANEL */}
            <Panel position="top-center" className="mt-6 pointer-events-none">
                <div className="flex items-center p-1.5 gap-1.5 glass-panel rounded-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.2)] pointer-events-auto border-border/40 bg-background/60 backdrop-blur-xl ring-1 ring-white/10 transition-all hover:scale-[1.02] hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.3)]">
                    
                    {/* Primary Controls Group */}
                    <div className="flex items-center gap-1 pr-2 border-r border-border/20 mr-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setSelectedNodeId(null)}>
                                        <MousePointer2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Select Mode</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors" onClick={onLayout}>
                                        <Layout className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Auto Layout</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Unified Add Node Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                className="h-9 rounded-xl px-4 gap-2 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                            >
                                <Plus className="h-4 w-4" /> Add Operator
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                            align="center" 
                            sideOffset={10}
                            className="w-64 bg-background/80 backdrop-blur-3xl border-border/20 shadow-2xl rounded-2xl p-2 ring-1 ring-white/5"
                        >
                            <div className="px-2 py-1.5 mb-2 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <input 
                                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/30 border border-border/20 text-xs focus:outline-none focus:bg-muted/50 transition-colors"
                                    placeholder="Filter operators..."
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar px-1">
                                {NODE_DEFINITIONS.map((category, idx) => (
                                    <div key={idx} className="mb-2 last:mb-0">
                                        <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                            {category.category}
                                        </div>
                                        {category.items.map((item, i) => (
                                            <DropdownMenuItem 
                                                key={i}
                                                className="group flex items-center gap-3 p-2 rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors"
                                                onClick={() => onAddNode(item.type, (item as any).opClass, item.label)}
                                            >
                                                <div className={cn(
                                                    "p-1.5 rounded-lg border shadow-sm transition-colors group-hover:border-primary/30",
                                                    item.type === 'source' ? "bg-chart-1/10 border-chart-1/20 text-chart-1" :
                                                    item.type === 'sink' ? "bg-chart-2/10 border-chart-2/20 text-chart-2" :
                                                    "bg-chart-3/10 border-chart-3/20 text-chart-3"
                                                )}>
                                                    <item.icon className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-semibold">{item.label}</span>
                                                    <span className="text-[9px] text-muted-foreground group-hover:text-primary/70">{item.desc}</span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </Panel>
          </ReactFlow>

          {/* Properties Inspector */}
          <div className={cn(
              "absolute top-auto md:top-4 bottom-0 md:bottom-4 left-0 md:left-auto right-0 md:right-4 w-full md:w-[380px] h-[60%] md:h-auto glass-panel border-t md:border border-border/40 shadow-2xl flex flex-col overflow-hidden z-30 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) rounded-b-none md:rounded-2xl",
              selectedNode ? "translate-y-0 md:translate-x-0 opacity-100" : "translate-y-[120%] md:translate-y-0 md:translate-x-[120%] opacity-0 pointer-events-none"
          )}>
              {selectedNode && (
                <NodeProperties 
                    node={selectedNode} 
                    onUpdate={(id, newData) => {
                        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n));
                        setSelectedNodeId(null);
                    }}
                    onDelete={(id) => {
                        setNodes(nds => nds.filter(n => n.id !== id));
                        setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
                        setSelectedNodeId(null);
                    }}
                    onClose={() => setSelectedNodeId(null)}
                />
              )}
          </div>
      </div>

      {!isNew && (
        <>
            <PipelineVersionDialog 
                pipelineId={parseInt(id!)} 
                pipelineName={pipelineName}
                open={versionsOpen} 
                onOpenChange={setVersionsOpen} 
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[2rem] border-border/40 bg-background/95 backdrop-blur-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-base font-medium">
                            This action cannot be undone. This will permanently delete the pipeline 
                            <span className="font-bold text-foreground"> "{pipelineName}" </span>
                            and all its historical versions and run logs.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                        >
                            {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete Forever
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
      )}
    </div>
  );
};
