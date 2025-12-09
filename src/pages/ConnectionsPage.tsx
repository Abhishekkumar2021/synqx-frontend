import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConnections, createConnection, deleteConnection, type ConnectionCreate, testConnection } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { 
    Plus, 
    Trash2, 
    Database, 
    ExternalLink, 
    Server,
    Globe,
    FileText,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const connectionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.string(),
  connection_url: z.string().min(5, "URL is too short"),
  description: z.string().optional()
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

const CONNECTOR_ICONS: Record<string, React.ReactNode> = {
    postgres: <Database className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
    mysql: <Database className="h-5 w-5 text-orange-500 dark:text-orange-400" />,
    snowflake: <Globe className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />,
    s3: <FileText className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />,
    rest_api: <Globe className="h-5 w-5 text-purple-500 dark:text-purple-400" />,
    default: <Server className="h-5 w-5 text-muted-foreground" />
};

export const ConnectionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = React.useState(false);
  const [testingId, setTestingId] = React.useState<number | null>(null);

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

  const handleTestConnection = async (id: number) => {
      setTestingId(id);
      try {
          const result = await testConnection(id, {});
          if (result.success) {
              toast.success("Connection Successful", { description: result.message, icon: <CheckCircle2 className="text-green-500"/> });
          } else {
              toast.error("Connection Failed", { description: result.message, icon: <XCircle className="text-destructive"/> });
          }
      } catch (e: any) {
          toast.error("Test Error", { description: e.message || "Unknown error" });
      } finally {
          setTestingId(null);
      }
  };

  if (error) return <div className="text-destructive p-8">Error loading connections</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Connections</h2>
            <p className="text-muted-foreground mt-1">Manage your data sources and destinations.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="shadow-lg hover:shadow-primary/20">
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
        {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[200px] rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-16 w-full" />
                    <div className="flex justify-between pt-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            ))
        ) : (
            connections?.map((conn) => (
            <Card key={conn.id} className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border bg-card hover:bg-accent/5">
                <div className={`absolute top-0 left-0 w-1 h-full ${conn.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground'} opacity-50 group-hover:opacity-100 transition-opacity`} />
                
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-medium group-hover:text-primary transition-colors">
                                <Link to={`/connections/${conn.id}`} className="hover:underline decoration-primary/50 underline-offset-4">
                                    {conn.name}
                                </Link>
                            </CardTitle>
                            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider flex items-center gap-2">
                                {CONNECTOR_ICONS[conn.type] || CONNECTOR_ICONS.default}
                                {conn.type}
                            </div>
                        </div>
                        {/* Status Indicator Dot */}
                        <div className={`w-2 h-2 rounded-full ${conn.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-muted-foreground'}`} />
                    </div>
                </CardHeader>
                
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2 h-10 leading-relaxed">
                        {conn.description || "No description provided."}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-8 bg-transparent border-input hover:bg-accent hover:text-accent-foreground"
                            onClick={() => handleTestConnection(conn.id)}
                            isLoading={testingId === conn.id}
                        >
                            {testingId !== conn.id && <ExternalLink className="mr-2 h-3 w-3" />}
                            Test
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 transition-colors"
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
            ))
        )}
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
        <Card className="mb-8 border-primary/20 bg-muted/30 animate-in slide-in-from-top-4 duration-300">
            <CardHeader>
                <CardTitle>Add New Connection</CardTitle>
                <CardDescription>Configure a new data source or destination.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Name</label>
                            <Input {...register("name")} placeholder="My Postgres DB" className={errors.name ? 'border-destructive' : ''} />
                            {errors.name && <span className="text-destructive text-xs">{errors.name.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Type</label>
                            <select {...register("type")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                <option value="postgres">PostgreSQL</option>
                                <option value="mysql">MySQL</option>
                                <option value="snowflake">Snowflake</option>
                                <option value="bigquery">BigQuery</option>
                                <option value="s3">Amazon S3</option>
                                <option value="rest_api">REST API</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Connection URL / Config</label>
                        <Input {...register("connection_url")} type="password" placeholder="postgresql://user:pass@localhost:5432/db" className={errors.connection_url ? 'border-destructive' : ''} />
                        {errors.connection_url && <span className="text-destructive text-xs">{errors.connection_url.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <Input {...register("description")} placeholder="Production database..." />
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Create Connection</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}