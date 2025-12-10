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
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '../../components/ui/button';
import { Plus, Save, Play, ArrowLeft, Loader2, Layout } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getPipeline, 
    triggerPipeline, 
    createPipelineVersion, 
    publishPipelineVersion,
    type PipelineNode as ApiNode, 
    type PipelineEdge as ApiEdge 
} from '../../lib/api';
import dagre from 'dagre';
import { toast } from 'sonner';

import PipelineNode from '../../components/PipelineNode';
import { NodeProperties } from '../../components/NodeProperties';

// --- Auto Layout Helper ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    dagreGraph.setGraph({ rankdir: 'LR' });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 250, height: 140 }); // Adjusted for custom node size (Beast Mode)
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
                x: nodeWithPosition.x - 110,
                y: nodeWithPosition.y - 50,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

export const PipelineEditorPage: React.FC = () => {
    return (
        <ReactFlowProvider>
            <PipelineEditorContent />
        </ReactFlowProvider>
    );
}

const PipelineEditorContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const queryClient = useQueryClient();
  
  // Fetch pipeline data
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
    default: PipelineNode
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Transform API data to React Flow
  useEffect(() => {
    if (pipeline?.published_version) {
        const version = pipeline.published_version;
        
        // Map Nodes
        const flowNodes: Node[] = version.nodes.map((n: ApiNode) => ({
            id: n.node_id, 
            type: n.operator_type || 'default', // map operator_type to node type
            data: { 
                label: n.name, 
                config: n.config,
                type: n.operator_type,
                operator_class: n.operator_class
            },
            position: n.config?.ui?.position || { x: 0, y: 0 },
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
      const newNodeId = `node_${nodes.length + 1}_${Date.now()}`;
      const newNode: Node = {
          id: newNodeId,
          type: 'default',
          position: { x: Math.random() * 400, y: Math.random() * 400 },
          data: { label: `New Node`, type: 'default', config: {} },
      };
      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNodeId);
  };

  const onLayout = useCallback(() => {
      const layouted = getLayoutedElements(nodes, edges);
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);
  }, [nodes, edges, setNodes, setEdges]);

  // Handle Node Selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
      setSelectedNodeId(null);
  }, []);

  // Update Node Data from Properties Panel
  const updateNodeData = (id: string, newData: any) => {
      setNodes((nds) => nds.map((node) => {
          if (node.id === id) {
              return {
                  ...node,
                  type: newData.type, // Update React Flow type
                  data: {
                      ...node.data,
                      ...newData
                  }
              };
          }
          return node;
      }));
  };

  const deleteNode = (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedNodeId(null);
  };

  // Mutations
  const runMutation = useMutation({
      mutationFn: () => triggerPipeline(parseInt(id!)),
      onSuccess: () => toast.success("Pipeline execution triggered"),
      onError: () => toast.error("Failed to trigger pipeline")
  });

  const saveMutation = useMutation({
      mutationFn: async () => {
          if (isNew) return; 
          
          // Transform back to API format
          const apiNodes = nodes.map(n => ({
              node_id: n.id,
              name: n.data.label,
              operator_type: n.data.type,
              config: {
                  ...(n.data.config as object),
                  ui: { position: n.position }
              },
              order_index: 0, // Default
              operator_class: n.data.operator_class || 'pandas_transform' 
          }));

          const apiEdges = edges.map(e => ({
              from_node_id: e.source,
              to_node_id: e.target
          }));

          const versionPayload = {
              nodes: apiNodes,
              edges: apiEdges,
              version_notes: "Updated via UI"
          };

          // 1. Create Version
          const newVersion = await createPipelineVersion(parseInt(id!), versionPayload);
          
          // 2. Publish Version
          await publishPipelineVersion(parseInt(id!), newVersion.id);
      },
      onSuccess: () => {
          toast.success("Pipeline saved and published");
          queryClient.invalidateQueries({ queryKey: ['pipeline', id] });
      },
      onError: (e) => {
          console.error(e);
          toast.error("Failed to save pipeline");
      }
  });

  if (isLoading) return (
      <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
  );

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 animate-in fade-in relative">
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
             <Button onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
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
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          colorMode="dark" 
          fitView
          minZoom={0.1}
          maxZoom={1.5}
          defaultEdgeOptions={{
            type: 'smoothstep', 
            animated: true, 
            style: { 
                stroke: 'var(--primary)', 
                strokeWidth: 2,
                filter: 'drop-shadow(0 0 3px var(--primary))' // Glow effect on edges
            }
          }}
          connectionLineStyle={{
            stroke: 'var(--primary)',
            strokeWidth: 2,
            strokeDasharray: '5,5'
          }}
        >
          <Controls className="bg-card/50 border-border fill-foreground text-foreground shadow-sm backdrop-blur-md" />
          <MiniMap 
            className="bg-card/50 border-border backdrop-blur-md rounded-lg overflow-hidden" 
            nodeColor={() => 'var(--primary)'} 
            maskColor="rgba(0,0,0,0.3)" 
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={30} 
            size={2} 
            color="var(--muted-foreground)" 
            className="opacity-20"
          />
          
          <Panel position="top-right" className="bg-card/80 p-2 rounded-md border border-border backdrop-blur-sm text-xs text-muted-foreground">
             {nodes.length} nodes, {edges.length} edges
          </Panel>
        </ReactFlow>

        {/* Properties Panel */}
        {selectedNode && (
            <NodeProperties 
                node={selectedNode} 
                onClose={() => setSelectedNodeId(null)} 
                onUpdate={updateNodeData}
                onDelete={deleteNode}
            />
        )}
      </div>
    </div>
  );
};
