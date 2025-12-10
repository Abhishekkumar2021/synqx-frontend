import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { 
    Plus, Save, Play, ArrowLeft, Loader2, Layout, 
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getPipeline, 
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

// Import your custom components
import PipelineNode from '@/components/PipelineNode'; 
import { NodeProperties } from '@/components/NodeProperties';

// --- Layout Engine ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    // Left-to-Right layout is standard for ETL
    dagreGraph.setGraph({ rankdir: 'LR', align: 'UL', ranksep: 100, nodesep: 60 });

    nodes.forEach((node) => {
        // Dimensions roughly match a standard card node
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
                x: nodeWithPosition.x - 140, // Center offset
                y: nodeWithPosition.y - 50,
            },
        };
    }) as Node[];

    return { nodes: layoutedNodes, edges };
};

export const PipelineEditorPage: React.FC = () => {
    return (
        // Added padding and adjusted height to prevent touching the bottom
        <div className="h-[calc(100vh-7rem)] w-full flex flex-col bg-background p-4 gap-4">
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
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: pipeline, isLoading } = useQuery({  
      queryKey: ['pipeline', id], 
      queryFn: () => getPipeline(parseInt(id!)), 
      enabled: !isNew 
  });

  const nodeTypes = useMemo<NodeTypes>(() => ({
    source: PipelineNode,
    transform: PipelineNode,
    destination: PipelineNode,
    api: PipelineNode,
    default: PipelineNode || undefined 
  }), []);

  useEffect(() => {
    if (pipeline?.published_version) {
        const version = pipeline.published_version;
        
        const flowNodes: Node[] = version.nodes.map((n: ApiNode) => ({
            id: n.node_id, 
            type: n.operator_type || 'default', 
            data: { 
                label: n.name, 
                config: n.config,
                type: n.operator_type,
                operator_class: n.operator_class,
                isValid: true 
            },
            position: n.config?.ui?.position || { x: 0, y: 0 },
        }));

        const flowEdges: Edge[] = version.edges.map((e: ApiEdge) => ({
            id: `e-${e.from_node_id}-${e.to_node_id}`,
            source: e.from_node_id,
            target: e.to_node_id,
            type: 'smoothstep', 
            animated: false,
            markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' },
            style: { stroke: 'var(--primary)', strokeWidth: 2 }
        }));

        const needsLayout = flowNodes.every(n => n.position.x === 0 && n.position.y === 0);
        if (needsLayout && flowNodes.length > 0) {
            const layouted = getLayoutedElements(flowNodes, flowEdges);
            setNodes(layouted.nodes);
            setEdges(layouted.edges);
        } else {
            setNodes(flowNodes);
            setEdges(flowEdges);
        }
    }
  }, [pipeline, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
        ...params, 
        type: 'smoothstep', 
        animated: true, 
        style: { stroke: 'var(--primary)', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' }
    }, eds)),
    [setEdges],
  );

  const onAddNode = (type: string = 'default') => {
      const newNodeId = `node_${Date.now()}`;
      // Define distinct colors for different node types
      let nodeColor = 'var(--primary)';
      switch (type) {
          case 'source': nodeColor = '#3b82f6'; break; // Blue
          case 'transform': nodeColor = '#a855f7'; break; // Purple
          case 'destination': nodeColor = '#22c55e'; break; // Green
          default: nodeColor = 'var(--primary)';
      }

      const newNode: Node = {
          id: newNodeId,
          type: type,
          position: { 
              x: 100 + Math.random() * 50, 
              y: 100 + Math.random() * 50 
          },
          data: { label: `New ${type}`, type: type, config: {}, color: nodeColor },
      };
      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNodeId);
      toast("Node added", { description: "Configure it in the properties panel." });
  };

  const onLayout = useCallback(() => {
      const layouted = getLayoutedElements(nodes, edges);
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);
      toast.success("Layout re-calculated");
  }, [nodes, edges, setNodes, setEdges]);

  const runMutation = useMutation({
      mutationFn: () => triggerPipeline(parseInt(id!)),
      onSuccess: () => toast.success("Execution Started", { icon: <Play className="text-emerald-500 w-4 h-4"/> }),
      onError: () => toast.error("Failed to start pipeline")
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
      },
      onSuccess: () => {
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
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p>Loading Pipeline Graph...</p>
      </div>
  );

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden rounded-xl border border-border/50 shadow-xl">
      {/* Header - More defined and contained */}
      <header className="absolute top-0 left-0 right-0 h-16 z-10 flex items-center justify-between px-4 pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto bg-background/95 backdrop-blur-md p-2 rounded-full border border-border/50 shadow-sm">
              <Link to="/pipelines">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                      <ArrowLeft className="h-4 w-4" />
                  </Button>
              </Link>
              <div className="pr-4 border-r border-border/50 h-6 flex items-center">
                <span className="font-semibold text-sm">{isNew ? 'New Draft' : pipeline?.name}</span>
              </div>
              <Badge variant="outline" className={cn(
                  "h-5 text-[10px] uppercase border-0",
                  pipeline?.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
              )}>
                  {isNew ? 'Unsaved' : pipeline?.status}
              </Badge>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto p-1 rounded-full bg-background/50 backdrop-blur-md">
            {!isNew && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-emerald-500/30 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => runMutation.mutate()}
                    disabled={runMutation.isPending}
                >
                    {runMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4" />}
                    Run
                </Button>
            )}
             <Button 
                size="sm" 
                onClick={() => saveMutation.mutate()} 
                disabled={isSaving || saveMutation.isPending}
                className="shadow-sm"
            >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                Save
            </Button>
          </div>
      </header>

      {/* Graph - Darker, richer background */}
      <div className="flex-1 w-full h-full bg-zinc-950/50 dark:bg-zinc-900/50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          colorMode="dark"
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep', 
            animated: true,
            style: { 
                stroke: 'var(--primary)', 
                strokeWidth: 2,
                filter: 'drop-shadow(0 0 4px var(--primary))' // Enhanced glow
            }
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            variant={BackgroundVariant.Lines} 
            gap={30} 
            size={1} 
            color="#3f3f46" // Zinc-700 for subtle lines
            className="opacity-20"
          />
          
          <Controls 
            className="bg-card/80 border-border/50 fill-muted-foreground text-muted-foreground rounded-lg overflow-hidden shadow-lg backdrop-blur-sm m-4" 
            position="bottom-left"
          />
          
          <MiniMap 
            className="bg-card/80 border border-border/50 rounded-lg shadow-lg overflow-hidden backdrop-blur-sm m-4" 
            nodeColor={(node) => {
                // Use node color data if available, else fallback
                return (node.data?.color as string) || 'var(--primary)';
            }}
            maskColor="rgba(0,0,0,0.6)" 
            style={{ height: 100, width: 150 }}
            position="bottom-right"
          />

          {/* Floating Toolbar - Sleeker and better positioned */}
          <Panel position="top-center" className="mt-20 pointer-events-none">
             <div className="flex items-center gap-1 p-1.5 bg-card/90 backdrop-blur-xl border border-border/50 rounded-full shadow-xl pointer-events-auto">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={onLayout} title="Auto Layout">
                    <Layout className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border/50 mx-1" />
                <Button variant="ghost" size="sm" className="rounded-full text-xs hover:bg-blue-500/10 hover:text-blue-500" onClick={() => onAddNode('source')}>
                    <Plus className="mr-1 h-3 w-3" /> Source
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full text-xs hover:bg-purple-500/10 hover:text-purple-500" onClick={() => onAddNode('transform')}>
                    <Plus className="mr-1 h-3 w-3" /> Transform
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full text-xs hover:bg-green-500/10 hover:text-green-500" onClick={() => onAddNode('destination')}>
                    <Plus className="mr-1 h-3 w-3" /> Target
                </Button>
             </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Properties Panel - Improved shadow and border */}
      <div className={cn(
          "absolute top-20 bottom-6 right-6 w-[320px] bg-card/95 backdrop-blur-2xl border border-border/50 rounded-xl shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col overflow-hidden z-20",
          selectedNode ? "translate-x-0" : "translate-x-[350px]"
      )}>
          {selectedNode ? (
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
          ) : null}
      </div>
    </div>
  );
};