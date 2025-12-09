import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { type Node } from '@xyflow/react';

interface NodePropertiesProps {
  node: Node | null;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}

interface FormData {
  label: string;
  type: string;
  config: string; // JSON string
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onClose, onUpdate, onDelete }) => {
  const { register, handleSubmit, setValue } = useForm<FormData>();

  useEffect(() => {
    if (node) {
      setValue('label', node.data.label as string);
      setValue('type', (node.data.type as string) || 'default');
      // Pretty print JSON config if it exists
      setValue('config', JSON.stringify(node.data.config || {}, null, 2));
    }
  }, [node, setValue]);

  if (!node) return null;

  const onSubmit = (data: FormData) => {
    try {
      const config = JSON.parse(data.config);
      onUpdate(node.id, {
        label: data.label,
        type: data.type,
        config: config
      });
      // Optional: Close on save? No, let user keep editing.
    } catch (e) {
      alert("Invalid JSON configuration");
    }
  };

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border shadow-2xl p-4 flex flex-col gap-4 animate-in slide-in-from-right duration-200 z-10">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="font-semibold text-lg">Node Properties</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-4 overflow-y-auto">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input 
            {...register('label', { required: true })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <select 
            {...register('type')}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="source">Source</option>
            <option value="transform">Transform</option>
            <option value="destination">Destination</option>
            <option value="api">API Call</option>
          </select>
        </div>

        <div className="space-y-2 flex-1 flex flex-col">
          <label className="text-sm font-medium">Configuration (JSON)</label>
          <textarea 
            {...register('config')}
            className="flex-1 w-full min-h-[200px] rounded-md border border-input bg-muted/50 px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground">
            Configure connection details or transformation logic here.
          </p>
        </div>

        <div className="flex gap-2 pt-4 border-t border-border">
          <Button type="submit" className="flex-1">
            Update Node
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            size="icon" 
            onClick={() => {
                if(confirm('Delete this node?')) {
                    onDelete(node.id);
                    onClose();
                }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
