import React, { useCallback, useEffect } from 'react';
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
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '../../components/ui/button';
import { Plus, Save, Play, ArrowLeft, Loader2, Layout } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getPipeline, triggerPipeline, type PipelineNode, type PipelineEdge as ApiEdge } from '../../lib/api';
import dagre from 'dagre';
import { toast } from 'sonner';

// --- Auto Layout Helper ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    dagreGraph.setGraph({ rankdir: 'LR' });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 180, height: 60 }); // Approx node dimensions
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - 90, // center offset
                y: nodeWithPosition.y - 30,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};


export const PipelineEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  
  // Fetch pipeline data
  const { data: pipeline, isLoading } = useQuery({ 
      queryKey: ['pipeline', id], 
      queryFn: () => getPipeline(parseInt(id!)), 
      enabled: !isNew 
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Transform API data to React Flow
  useEffect(() => {
    if (pipeline?.published_version) {
        const version = pipeline.published_version;
        
        // Map Nodes
        const flowNodes: Node[] = version.nodes.map((n: PipelineNode) => ({
            id: n.node_id, // Use node_id string from backend
            type: n.operator_type === 'source' ? 'input' : n.operator_type === 'destination' ? 'output' : 'default',
            data: { label: n.name },
            position: n.config?.ui?.position || { x: 0, y: 0 }, // Check if position exists in config
            className: 'bg-card border-border text-foreground w-[180px] p-2 rounded-md shadow-sm text-center font-medium border'
        }));

        // Map Edges
        const flowEdges: Edge[] = version.edges.map((e: ApiEdge) => ({
            id: `e-${e.from_node_id}-${e.to_node_id}`,
            source: e.from_node_id,
            target: e.to_node_id,
            animated: true,
            style: { stroke: 'hsl(var(--primary))' }
        }));

        // If no positions stored, apply auto layout
        const hasPositions = version.nodes.some(n => n.config?.ui?.position);
        if (!hasPositions && flowNodes.length > 0) {
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
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'hsl(var(--primary))' } }, eds)),
    [setEdges],
  );

  const onAddNode = () => {
      const newNodeId = `node_${nodes.length + 1}`;
      const newNode: Node = {
          id: newNodeId,
          position: { x: Math.random() * 200, y: Math.random() * 200 },
          data: { label: `New Node` },
          className: 'bg-card border-border text-foreground w-[180px] p-2 rounded-md shadow-sm text-center font-medium border'
      };
      setNodes((nds) => nds.concat(newNode));
  };

  const onLayout = useCallback(() => {
      const layouted = getLayoutedElements(nodes, edges);
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);
  }, [nodes, edges, setNodes, setEdges]);

  // Mutations
  const runMutation = useMutation({
      mutationFn: () => triggerPipeline(parseInt(id!)),
      onSuccess: () => toast.success("Pipeline execution triggered"),
      onError: () => toast.error("Failed to trigger pipeline")
  });

  if (isLoading) return (
      <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 animate-in fade-in">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
              <Link to="/pipelines">
                  <Button variant="ghost" size="icon">
                      <ArrowLeft className="h-4 w-4" />
                  </Button>
              </Link>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{isNew ? 'New Pipeline' : pipeline?.name || 'Edit Pipeline'}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${pipeline?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    {isNew ? 'Draft' : pipeline?.status || 'Unknown'}
                </div>
              </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={onLayout} variant="outline" size="icon" title="Auto Layout">
                <Layout className="h-4 w-4" />
            </Button>
            <Button onClick={onAddNode} variant="secondary">
                <Plus className="mr-2 h-4 w-4" /> Add Node
            </Button>
            {!isNew && (
                <Button 
                    className="bg-green-600 hover:bg-green-700 text-white" 
                    onClick={() => runMutation.mutate()}
                    isLoading={runMutation.isPending}
                >
                    <Play className="mr-2 h-4 w-4" /> Run
                </Button>
            )}
             <Button>
                <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
      </div>

      <div className="flex-1 rounded-xl border border-border overflow-hidden bg-background shadow-inner relative group">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          colorMode="system" 
          fitView
          minZoom={0.1}
          maxZoom={1.5}
        >
          <Controls className="bg-card border-border fill-foreground text-foreground shadow-sm" />
          <MiniMap className="bg-card border-border" nodeColor={() => 'hsl(var(--primary))'} maskColor="rgba(0,0,0,0.1)" />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          
          <Panel position="top-right" className="bg-card/80 p-2 rounded-md border border-border backdrop-blur-sm text-xs text-muted-foreground">
             {nodes.length} nodes, {edges.length} edges
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};