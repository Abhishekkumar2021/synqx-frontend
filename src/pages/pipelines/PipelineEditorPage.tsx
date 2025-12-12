/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
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
  Panel,
  type NodeTypes,
  ReactFlowProvider,
  MarkerType,
  Position,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Save, Play, ArrowLeft, Loader2, Layout, 
    Database, ArrowRightLeft, HardDriveUpload, MousePointer2,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getPipeline, 
    updatePipeline,
    triggerPipeline, 
    createPipelineVersion, 
    publishPipelineVersion,
    type PipelineNode as ApiNode, 
    type PipelineEdge as ApiEdge 
} from '@/lib/api';
import dagre from 'dagre';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Import Custom Node Components
import PipelineNode from '@/components/PipelineNode'; 
import { NodeProperties } from '@/components/NodeProperties';

// --- Layout Engine Configuration ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    dagreGraph.setGraph({ rankdir: 'LR', align: 'UL', ranksep: 120, nodesep: 50 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 280, height: 100 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
            position: {
                x: nodeWithPosition.x - 140, 
                y: nodeWithPosition.y - 50,
            },
        };
    }) as Node[];

    return { nodes: layoutedNodes, edges };
};

export const PipelineEditorPage: React.FC = () => {
    return (
        <div className="h-[calc(100vh-9rem)] w-full bg-background relative border border-border/50 rounded-xl overflow-hidden shadow-sm ring-1 ring-border/50">
            <ReactFlowProvider>
                <PipelineEditorContent />
            </ReactFlowProvider>
        </div>
    );
}

const PipelineEditorContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const queryClient = useQueryClient();
  const { fitView } = useReactFlow();
  
  // State
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pipelineName, setPipelineName] = useState("Untitled Pipeline");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Refs for tracking initialization
  const initializedId = useRef<number | string | null>(null);

  // Check dark mode for ReactFlow styling
  useEffect(() => {
      const checkTheme = () => document.documentElement.classList.contains('dark');
      setIsDarkMode(checkTheme());
      const observer = new MutationObserver(() => setIsDarkMode(checkTheme()));
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
  }, []);

  // Fetch Data
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

  // --- Initial Data Load (FIXED) ---
  useEffect(() => {
    if (!pipeline) return;
    
    // GUARD: Only initialize if we switched to a new pipeline ID.
    // This prevents re-rendering or overwriting local changes when background refetch happens.
    if (initializedId.current === pipeline.id) return;
    
    initializedId.current = pipeline.id; // Mark as initialized
    
    setPipelineName(pipeline.name);
    
    if (pipeline.published_version) {
        const version = pipeline.published_version;
        
        const flowNodes: Node[] = version.nodes.map((n: ApiNode) => ({
            id: n.node_id, 
            type: n.operator_type || 'default', 
            data: { 
                label: n.name, 
                config: n.config,
                type: n.operator_type,
                operator_class: n.operator_class,
                status: 'idle'
            },
            position: n.config?.ui?.position || { x: 0, y: 0 },
        }));

        const flowEdges: Edge[] = version.edges.map((e: ApiEdge) => ({
            id: `e-${e.from_node_id}-${e.to_node_id}`,
            source: e.from_node_id,
            target: e.to_node_id,
            type: 'smoothstep', 
            animated: false,
            style: { stroke: 'var(--primary)', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' }
        }));

        // Layout check
        const needsLayout = flowNodes.every(n => n.position.x === 0 && n.position.y === 0);
        
        if (needsLayout && flowNodes.length > 0) {
            const layouted = getLayoutedElements(flowNodes, flowEdges);
            setNodes(layouted.nodes);
            setEdges(layouted.edges);
            // Use setTimeout to ensure nodes are rendered before fitting
            setTimeout(() => fitView({ padding: 0.2 }), 50);
        } else {
            setNodes(flowNodes);
            setEdges(flowEdges);
            setTimeout(() => fitView({ padding: 0.2 }), 50);
        }
    }
  }, [pipeline, setNodes, setEdges, fitView]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
        ...params, 
        type: 'smoothstep', 
        animated: true, 
        style: { stroke: 'var(--primary)', strokeWidth: 2, strokeDasharray: '5,5' },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' }
    }, eds)),
    [setEdges],
  );

  const onAddNode = (type: string = 'default') => {
      const newNodeId = `node_${Date.now()}`;
      // Center new nodes in view
      const centerX = window.innerWidth / 3;
      const centerY = window.innerHeight / 3;

      const newNode: Node = {
          id: newNodeId,
          type: type,
          position: { 
              x: centerX + (Math.random() * 50), 
              y: centerY + (Math.random() * 50) 
          },
          data: { 
              label: `New ${type}`, 
              type: type, 
              config: {}, 
              status: 'idle' 
          },
      };
      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNodeId);
      toast("Node added", { description: "Configure it in the properties panel." });
  };

  const onLayout = useCallback(() => {
      const layouted = getLayoutedElements(nodes, edges);
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);
      setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 10);
      toast.success("Auto-layout applied");
  }, [nodes, edges, setNodes, setEdges, fitView]);

  // --- Mutations ---

  const runMutation = useMutation({
      mutationFn: () => triggerPipeline(parseInt(id!)),
      onSuccess: () => toast.success("Pipeline Triggered", { icon: <Play className="text-emerald-500 w-4 h-4"/> }),
      onError: () => toast.error("Failed to start pipeline")
  });

  const renameMutation = useMutation({
      mutationFn: async (newName: string) => {
          if (isNew) return;
          await updatePipeline(parseInt(id!), { name: newName });
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['pipeline', id] });
          toast.success("Pipeline Renamed");
      },
      onError: () => toast.error("Failed to rename")
  });

  const saveMutation = useMutation({
      mutationFn: async () => {
          if (isNew) {
              toast.error("Please create the pipeline shell first");
              return;
          }
          setIsSaving(true);
          
          const apiNodes = nodes.map(n => ({
              node_id: n.id,
              name: n.data.label as string,
              operator_type: n.type || 'default',
              config: {
                  ...(n.data.config as object),
                  ui: { position: n.position }
              },
              order_index: 0, 
              operator_class: (n.data.operator_class as string) || 'python_operator'
          }));

          const apiEdges = edges.map(e => ({
              from_node_id: e.source,
              to_node_id: e.target
          }));

          const payload = {
              nodes: apiNodes,
              edges: apiEdges,
              version_notes: `Saved at ${new Date().toLocaleTimeString()}`
          };

          const newVersion = await createPipelineVersion(parseInt(id!), payload);
          await publishPipelineVersion(parseInt(id!), newVersion.id);

          // Sync name if changed
          if (pipelineName !== pipeline?.name) {
              await updatePipeline(parseInt(id!), { name: pipelineName });
          }
      },
      onSuccess: () => {
          // Update ref so the new data doesn't trigger a reset
          if (pipeline) initializedId.current = pipeline.id;
          
          queryClient.invalidateQueries({ queryKey: ['pipeline', id] });
          toast.success("Pipeline Saved & Published");
          setIsSaving(false);
      },
      onError: () => {
          toast.error("Save failed");
          setIsSaving(false);
      }
  });

  if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground animate-pulse">
          <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm font-medium tracking-wider uppercase">Loading Canvas...</p>
      </div>
  );

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="w-full h-full relative overflow-hidden bg-background">
      
      {/* --- HUD Header --- */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          {/* Breadcrumb & Title */}
          <div className="flex items-center gap-2 pointer-events-auto bg-background/80 backdrop-blur-xl border border-border/40 p-1.5 pl-2 pr-4 rounded-full shadow-lg ring-1 ring-foreground/5">
              <Link to="/pipelines">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/50">
                      <ArrowLeft className="h-4 w-4" />
                  </Button>
              </Link>
              <div className="h-4 w-px bg-border/50" />
              
              {/* Editable Title */}
              <div className="flex items-center group relative">
                  <Input 
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                    onBlur={() => {
                        if (pipelineName !== pipeline?.name) {
                            renameMutation.mutate(pipelineName);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur();
                        }
                    }}
                    className="h-7 w-[200px] border-transparent bg-transparent px-2 text-sm font-semibold shadow-none focus-visible:ring-1 focus-visible:ring-primary/50 hover:bg-muted/30 transition-colors"
                  />
              </div>

              <Badge variant="secondary" className={cn(
                  "ml-2 text-[10px] h-5 px-1.5 font-mono border-0",
                  pipeline?.status === 'active' ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"
              )}>
                  {isNew ? 'DRAFT' : pipeline?.status}
              </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pointer-events-auto bg-background/80 backdrop-blur-xl border border-border/40 p-1.5 rounded-full shadow-lg ring-1 ring-foreground/5">
            {!isNew && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-full text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-500/10 px-4 font-semibold"
                    onClick={() => runMutation.mutate()}
                    disabled={runMutation.isPending}
                >
                    {runMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin"/> : <Play className="mr-2 h-3.5 w-3.5 fill-current" />}
                    Run
                </Button>
            )}
             <Button 
                size="sm" 
                onClick={() => saveMutation.mutate()} 
                disabled={isSaving || saveMutation.isPending}
                className="h-8 rounded-full px-5 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
                {isSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin"/> : <Save className="mr-2 h-3.5 w-3.5" />}
                Save Changes
            </Button>
          </div>
      </div>

      {/* --- React Flow Canvas --- */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        colorMode={isDarkMode ? 'dark' : 'light'}
        minZoom={0.2}
        maxZoom={3}
        defaultEdgeOptions={{
            type: 'smoothstep', 
            animated: false,
            style: { 
                strokeWidth: 2,
                stroke: 'var(--primary)',
            },
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-muted/5 transition-colors duration-300"
      >
        <Background 
            variant={BackgroundVariant.Dots} 
            gap={24} 
            size={1.5} 
            color={isDarkMode ? "rgba(120, 120, 120, 0.15)" : "rgba(0, 0, 0, 0.15)"}
        />
        
        <Controls 
            className="bg-background border border-border/50 fill-foreground text-foreground rounded-xl overflow-hidden shadow-xl backdrop-blur-md m-4" 
            showInteractive={false}
        />
        
        <MiniMap 
            className="bg-background border border-border/50 rounded-xl shadow-xl overflow-hidden backdrop-blur-md m-4" 
            nodeColor={(node) => {
                const type = node.type;
                if (type === 'source') return 'var(--chart-1)';
                if (type === 'transform') return 'var(--chart-3)';
                if (type === 'sink') return 'var(--chart-2)';
                return 'var(--muted-foreground)';
            }}
            maskColor={isDarkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(240, 240, 240, 0.8)"}
            style={{ height: 120, width: 180 }}
            position="bottom-right"
        />

        {/* --- Floating Toolbox --- */}
        <Panel position="top-center" className="mt-20 pointer-events-none">
            <div className="flex items-center gap-1.5 p-2 bg-background/80 backdrop-blur-xl border border-border/40 rounded-full shadow-2xl pointer-events-auto ring-1 ring-foreground/5">
                
                <div className="flex items-center gap-1 pr-2 border-r border-border/40 mr-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted" onClick={() => setSelectedNodeId(null)}>
                        <MousePointer2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted" onClick={onLayout} title="Auto Layout">
                        <Layout className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" className="h-9 rounded-full px-4 gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-500 hover:bg-blue-500/20 border border-blue-500/20" onClick={() => onAddNode('source')}>
                        <Database className="h-3.5 w-3.5" /> Source
                    </Button>
                    <Button variant="secondary" size="sm" className="h-9 rounded-full px-4 gap-2 bg-purple-500/10 text-purple-600 dark:text-purple-500 hover:bg-purple-500/20 border border-purple-500/20" onClick={() => onAddNode('transform')}>
                        <ArrowRightLeft className="h-3.5 w-3.5" /> Transform
                    </Button>
                    <Button variant="secondary" size="sm" className="h-9 rounded-full px-4 gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20" onClick={() => onAddNode('sink')}>
                        <HardDriveUpload className="h-3.5 w-3.5" /> Sink
                    </Button>
                </div>
            </div>
        </Panel>
      </ReactFlow>

      {/* --- Properties Slide-over --- */}
      <div className={cn(
          "absolute top-4 bottom-4 right-4 w-[360px] bg-background/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col overflow-hidden z-20",
          selectedNode ? "translate-x-0 opacity-100" : "translate-x-[420px] opacity-0 pointer-events-none"
      )}>
          {selectedNode && (
            <NodeProperties 
                node={selectedNode} 
                onUpdate={(id, newData) => {
                    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n));
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
  );
};