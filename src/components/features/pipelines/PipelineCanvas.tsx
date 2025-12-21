/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
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
    Rocket, Square, Pencil, MousePointer2
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import dagre from 'dagre';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

// API Imports
import { 
    getPipeline, 
    updatePipeline,
    createPipeline,
    triggerPipeline, 
    createPipelineVersion, 
    publishPipelineVersion,
    type PipelineNode as ApiNode, 
    type PipelineEdge as ApiEdge,
    type PipelineCreate
} from '@/lib/api';

// Custom Components
import PipelineNode from '@/components/features/pipelines/PipelineNode'; 
import { NodeProperties } from '@/components/features/pipelines/NodeProperties';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

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
        default: return 'default';
    }
};

// Helper: Map Frontend Node Type to Backend OperatorType
const mapNodeTypeToOperator = (nodeType: string) => {
    switch (nodeType) {
        case 'source': return 'extract';
        case 'sink': return 'load';
        case 'transform': return 'transform';
        default: return 'transform'; // Default to transform if unknown
    }
};

export const PipelineCanvas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
  const initializedId = useRef<number | string | null>(null);

  const flowTheme = useMemo(() => (theme === 'dark' ? 'dark' : 'light'), [theme]);

  // --- Queries ---
  const { data: pipeline, isLoading } = useQuery({  
      queryKey: ['pipeline', id], 
      queryFn: () => getPipeline(parseInt(id!)), 
      enabled: !isNew 
  });

  const nodeTypes = useMemo<NodeTypes>(() => ({
    source: PipelineNode,
    transform: PipelineNode,
    sink: PipelineNode,
    default: PipelineNode
  }), []);

  // --- Initialization ---
  useEffect(() => {
    if (!pipeline) return;
    if (initializedId.current === pipeline.id) return;
    
    initializedId.current = pipeline.id;
    setPipelineName(pipeline.name);
    
    if (pipeline.published_version) {
        const version = pipeline.published_version;
        const flowNodes: Node[] = version.nodes.map((n: ApiNode) => ({
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
                // Also map to connection_id if stored in config or inferable (not always easy, 
                // but usually stored in data by NodeProperties if we saved it there)
                connection_id: n.config?.connection_id
            },
            position: n.config?.ui?.position || { x: 0, y: 0 },
        }));

        const flowEdges: Edge[] = version.edges.map((e: ApiEdge) => ({
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
    }
  }, [pipeline, setNodes, setEdges, fitView]);

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

  const onAddNode = (type: string = 'default') => {
      const newNodeId = `node_${Date.now()}`;
      const offset = Math.random() * 50; 
      const newNode: Node = {
          id: newNodeId,
          type: type,
          position: { x: 250 + offset, y: 250 + offset },
          data: { label: `New ${type}`, type: type, config: {}, status: 'idle' },
      };
      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNodeId);
      toast.info("Node Added", { 
          description: `A new ${type} operator has been placed on the canvas. Configure it in the inspector.` 
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
              description: `Execution is now running in the background. Job ID: ${data.id}`
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
          setIsSaving(true);
          
          const apiNodes = nodes.map(n => {
              const nodeData = n.data as any;
              return {
                  node_id: n.id,
                  name: nodeData.label as string,
                  operator_type: mapNodeTypeToOperator(n.type || 'default'),
                  config: { 
                      ...(nodeData.config as object), 
                      ui: { position: n.position },
                      // Persist connection_id in config if available for UI restoration
                      connection_id: nodeData.connection_id 
                  },
                  order_index: 0, 
                  operator_class: (nodeData.operator_class as string) || 'python_operator',
                  // Map Asset IDs
                  source_asset_id: nodeData.source_asset_id,
                  destination_asset_id: nodeData.destination_asset_id
              };
          });

          const apiEdges = edges.map(e => ({ from_node_id: e.source, to_node_id: e.target }));

          if (isNew) {
              // Create New Pipeline
              const payload: PipelineCreate = {
                  name: pipelineName || "New Pipeline",
                  initial_version: {
                      nodes: apiNodes,
                      edges: apiEdges,
                      version_notes: "Initial draft"
                  }
              };
              const createdPipeline = await createPipeline(payload);
              // Navigate to the new pipeline ID (replacing 'new' in URL)
              // We can't easily use router navigation inside mutationFn, so we'll do it in onSuccess or return the ID
              return { type: 'create', pipeline: createdPipeline };
          } else {
              // Update Existing Version
              const newVersion = await createPipelineVersion(parseInt(id!), {
                  nodes: apiNodes,
                  edges: apiEdges,
                  version_notes: deploy ? `Deployed at ${new Date().toLocaleTimeString()}` : 'Auto-save'
              });
              
              if (deploy) await publishPipelineVersion(parseInt(id!), newVersion.id);
              if (pipelineName !== pipeline?.name) await updatePipeline(parseInt(id!), { name: pipelineName });
              return { type: 'update' };
          }
      },
      onSuccess: (result, vars) => {
          if (result.type === 'create' && result.pipeline) {
              toast.success("Pipeline Created", {
                  description: `"${pipelineName}" has been successfully initialized.`
              });
              // Redirect to the new pipeline URL
              window.history.replaceState(null, '', `/pipelines/${result.pipeline.id}`);
              // Force reload to pick up new ID (simpler than refactoring everything to handle ID change dynamically)
              window.location.reload(); 
          } else {
              if (pipeline) initializedId.current = pipeline.id;
              queryClient.invalidateQueries({ queryKey: ['pipeline', id] });
              queryClient.invalidateQueries({ queryKey: ['pipelines'] });
              toast.success(vars.deploy ? "Successfully Deployed" : "Draft Saved", {
                  description: vars.deploy 
                    ? "Your changes are now live and will be used for future runs." 
                    : "Work-in-progress changes have been saved."
              });
          }
          setIsSaving(false);
      },
      onError: (err: any) => {
          toast.error("Save Failed", { 
              description: err.response?.data?.detail?.message || err.message || "An unexpected error occurred while saving." 
          });
          setIsSaving(false);
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
                          {isNew ? 'v1' : `v${pipeline?.published_version?.version || pipeline?.current_version || '?'}`}
                      </span>
                  </div>
              </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {!isNew && (
                <div className="flex items-center gap-2">
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
                    disabled={isSaving}
                    className="h-9 rounded-full px-4 font-medium"
                >
                    <Save className="mr-2 h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Draft</span>
                </Button>
                 <Button 
                    size="sm" 
                    onClick={() => saveMutation.mutate({ deploy: true })} 
                    disabled={isSaving}
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
            <Panel position="top-center" className="mt-4 pointer-events-none">
                <div className="flex items-center gap-2 p-1.5 glass-panel rounded-full shadow-2xl pointer-events-auto border-border/50 bg-background/80 backdrop-blur-2xl">
                    <div className="flex items-center gap-1 pr-2 border-r border-border/20 mr-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={() => setSelectedNodeId(null)}>
                                        <MousePointer2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Select</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={onLayout}>
                                        <Layout className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Auto Layout</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 rounded-full px-3 gap-2 bg-chart-1/10 text-chart-1 hover:bg-chart-1/20 border border-chart-1/20 transition-all font-medium text-xs" 
                            onClick={() => onAddNode('source')}
                        >
                            <Database className="h-3 w-3" /> Source
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 rounded-full px-3 gap-2 bg-chart-3/10 text-chart-3 hover:bg-chart-3/20 border border-chart-3/20 transition-all font-medium text-xs" 
                            onClick={() => onAddNode('transform')}
                        >
                            <ArrowRightLeft className="h-3 w-3" /> Transform
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 rounded-full px-3 gap-2 bg-chart-2/10 text-chart-2 hover:bg-chart-2/20 border border-chart-2/20 transition-all font-medium text-xs" 
                            onClick={() => onAddNode('sink')}
                        >
                            <HardDriveUpload className="h-3 w-3" /> Sink
                        </Button>
                    </div>
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
                    onUpdate={(id, newData) => setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n))}
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
    </div>
  );
};