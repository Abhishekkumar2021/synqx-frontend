import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConnections, createConnection, deleteConnection, type ConnectionCreate } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Trash2, Database, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const connectionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.string(),
  connection_url: z.string().min(5, "URL is too short"),
  description: z.string().optional()
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

export const ConnectionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = React.useState(false);

  const { data: connections, isLoading, error } = useQuery({
    queryKey: ['connections'],
    queryFn: getConnections,
  });

  const createMutation = useMutation({
    mutationFn: (data: ConnectionFormValues) => createConnection(data as ConnectionCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      setIsCreating(false);
      toast.success('Connection created successfully');
    },
    onError: () => {
        toast.error('Failed to create connection');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast.success('Connection deleted');
    },
  });

  if (isLoading) return <div className="text-white animate-pulse">Loading connections...</div>;
  if (error) return <div className="text-red-500">Error loading connections</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Connections</h2>
            <p className="text-gray-400">Manage your data sources and destinations.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
            <Plus className="mr-2 h-4 w-4" /> New Connection
        </Button>
      </div>

      {isCreating && (
        <CreateConnectionForm 
            onSubmit={(data) => createMutation.mutate(data)} 
            onCancel={() => setIsCreating(false)}
            isLoading={createMutation.isPending}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {connections?.map((conn) => (
          <Card key={conn.id} className="group hover:border-blue-500/50 transition-colors border-white/5 bg-[#121212]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium group-hover:text-blue-400 transition-colors">
                {conn.name}
              </CardTitle>
              <Database className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-blue-300/80 uppercase font-semibold tracking-wider mb-4 bg-blue-900/20 w-fit px-2 py-1 rounded">
                {conn.type}
              </div>
              <p className="text-sm text-gray-400 mb-6 line-clamp-2 h-10">
                {conn.description || "No description provided."}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <Button variant="ghost" size="sm" className="text-xs h-8">
                    <ExternalLink className="mr-2 h-3 w-3" /> Test
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-500 hover:text-red-400 hover:bg-red-900/20 h-8 w-8"
                    onClick={() => {
                        toast('Are you sure?', {
                            action: {
                                label: 'Delete',
                                onClick: () => deleteMutation.mutate(conn.id)
                            },
                        })
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const CreateConnectionForm: React.FC<{ 
    onSubmit: (data: ConnectionFormValues) => void; 
    onCancel: () => void;
    isLoading: boolean;
}> = ({ onSubmit, onCancel, isLoading }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<ConnectionFormValues>({
        resolver: zodResolver(connectionSchema)
    });

    return (
        <Card className="mb-6 border-blue-900/30 bg-blue-950/5 animate-in slide-in-from-top-4 duration-300">
            <CardHeader>
                <CardTitle>Add New Connection</CardTitle>
                <CardDescription>Configure a new data source or destination.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Name</label>
                            <Input {...register("name")} placeholder="My Postgres DB" className={errors.name ? 'border-red-500' : ''} />
                            {errors.name && <span className="text-red-400 text-xs">{errors.name.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Type</label>
                            <select {...register("type")} className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-600 focus:outline-none">
                                <option value="postgres">PostgreSQL</option>
                                <option value="mysql">MySQL</option>
                                <option value="snowflake">Snowflake</option>
                                <option value="bigquery">BigQuery</option>
                                <option value="s3">Amazon S3</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Connection URL / Config</label>
                        <Input {...register("connection_url")} type="password" placeholder="postgresql://user:pass@localhost:5432/db" className={errors.connection_url ? 'border-red-500' : ''} />
                        {errors.connection_url && <span className="text-red-400 text-xs">{errors.connection_url.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Description</label>
                        <Input {...register("description")} placeholder="Production database..." />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Create Connection</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}