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
    CheckCircle2,
    XCircle,
    HardDrive, // Local File Icon
    Cloud, // S3
    Server as ApiServer // REST API
} from 'lucide-react';
import { FormProvider, useForm, type FieldPath } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';

// --- Frontend representation of Backend Connector Configs ---
interface ConnectorField {
    name: string;
    label: string;
    type: 'text' | 'password' | 'number' | 'select' | 'textarea';
    required: boolean;
    placeholder?: string;
    defaultValue?: string | number;
    options?: { label: string; value: string }[];
    dependency?: { field: string; value: string | boolean; }; // e.g. show if auth_type is basic
}

interface ConnectorSchema {
    description: string;
    fields: ConnectorField[];
}

const CONNECTOR_CONFIG_SCHEMAS: Record<string, ConnectorSchema> = {
    postgresql: {
        description: "Configuration for PostgreSQL database connections.",
        fields: [
            { name: "host", label: "Host", type: "text", required: true, placeholder: "localhost" },
            { name: "port", label: "Port", type: "number", required: true, defaultValue: 5432 },
            { name: "database", label: "Database", type: "text", required: true, placeholder: "mydb" },
            { name: "username", label: "Username", type: "text", required: true, placeholder: "user" },
            { name: "password", label: "Password", type: "password", required: true, placeholder: "password" },
            { name: "db_schema", label: "Schema", type: "text", required: false, defaultValue: "public" },
        ]
    },
    mysql: { // Assuming similar to postgres
        description: "Configuration for MySQL database connections.",
        fields: [
            { name: "host", label: "Host", type: "text", required: true, placeholder: "localhost" },
            { name: "port", label: "Port", type: "number", required: true, defaultValue: 3306 },
            { name: "database", label: "Database", type: "text", required: true, placeholder: "mydb" },
            { name: "username", label: "Username", type: "text", required: true, placeholder: "user" },
            { name: "password", label: "Password", type: "password", required: true, placeholder: "password" },
        ]
    },
    snowflake: {
        description: "Configuration for Snowflake data warehouse connections.",
        fields: [
            { name: "account", label: "Account", type: "text", required: true, placeholder: "xy12345.us-east-1" },
            { name: "user", label: "User", type: "text", required: true, placeholder: "SNOWFLAKE_USER" },
            { name: "password", label: "Password", type: "password", required: true, placeholder: "password" },
            { name: "warehouse", label: "Warehouse", type: "text", required: true, placeholder: "COMPUTE_WH" },
            { name: "database", label: "Database", type: "text", required: true, placeholder: "SNOWFLAKE_DB" },
            { name: "schema", label: "Schema", type: "text", required: false, defaultValue: "PUBLIC" },
        ]
    },
    mongodb: {
        description: "Configuration for MongoDB database connections.",
        fields: [
            { name: "host", label: "Host", type: "text", required: false, placeholder: "localhost" },
            { name: "port", label: "Port", type: "number", required: false, defaultValue: 27017 },
            { name: "database", label: "Database", type: "text", required: true, placeholder: "mydb" },
            { name: "username", label: "Username", type: "text", required: false, placeholder: "mongo_user" },
            { name: "password", label: "Password", type: "password", required: false, placeholder: "mongo_password" },
            { name: "connection_string", label: "Connection String", type: "text", required: false, placeholder: "mongodb://user:pass@host:port/db" },
        ]
    },
    local_file: {
        description: "Configuration for local file system access.",
        fields: [
            { name: "base_path", label: "Base Path", type: "text", required: true, placeholder: "/var/data/files" },
        ]
    },
    s3: { // Placeholder, assuming similar to local file but with AWS creds
        description: "Configuration for Amazon S3 object storage.",
        fields: [
            { name: "bucket_name", label: "Bucket Name", type: "text", required: true, placeholder: "my-s3-bucket" },
            { name: "aws_access_key_id", label: "AWS Access Key ID", type: "password", required: true },
            { name: "aws_secret_access_key", label: "AWS Secret Access Key", type: "password", required: true },
            { name: "region_name", label: "Region", type: "text", required: false, placeholder: "us-east-1" },
        ]
    },
    rest_api: {
        description: "Configuration for generic REST API connections.",
        fields: [
            { name: "base_url", label: "Base URL", type: "text", required: true, placeholder: "https://api.example.com" },
            { name: "auth_type", label: "Auth Type", type: "select", required: true, defaultValue: "none",
                options: [
                    { label: "None", value: "none" },
                    { label: "Basic Auth", value: "basic" },
                    { label: "Bearer Token", value: "bearer" },
                    { label: "API Key", value: "api_key" },
                ]
            },
            { name: "username", label: "Username", type: "text", required: true, dependency: { field: "auth_type", value: "basic" } },
            { name: "password", label: "Password", type: "password", required: true, dependency: { field: "auth_type", value: "basic" } },
            { name: "token", label: "Bearer Token", type: "password", required: true, dependency: { field: "auth_type", value: "bearer" } },
            { name: "api_key_name", label: "API Key Name", type: "text", required: true, dependency: { field: "auth_type", value: "api_key" }, placeholder: "X-API-Key" },
            { name: "api_key_value", label: "API Key Value", type: "password", required: true, dependency: { field: "auth_type", value: "api_key" } },
            { name: "api_key_in", label: "API Key In", type: "select", required: true, defaultValue: "header", dependency: { field: "auth_type", value: "api_key" },
                options: [
                    { label: "Header", value: "header" },
                    { label: "Query", value: "query" },
                ]
            },
        ]
    }
};

const CONNECTOR_ICONS: Record<string, React.ReactNode> = {
    postgresql: <Database className="h-5 w-5 text-chart-1" />,
    mysql: <Database className="h-5 w-5 text-chart-2" />,
    snowflake: <Cloud className="h-5 w-5 text-chart-3" />,
    mongodb: <Database className="h-5 w-5 text-chart-4" />, // Use another DB icon
    local_file: <HardDrive className="h-5 w-5 text-chart-5" />,
    s3: <Cloud className="h-5 w-5 text-chart-1" />,
    rest_api: <ApiServer className="h-5 w-5 text-chart-2" />,
    default: <Server className="h-5 w-5 text-muted-foreground" />
};

// --- Form Validation Schema ---
const connectionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.string().min(1, "Connection type is required"),
  description: z.string().optional(),
  config: z.record(z.string(), z.any()), // config will be dynamically validated on backend
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

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
    onError: (e: any) => {
        toast.error('Failed to create connection', { description: e.response?.data?.detail?.message || e.message });
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
            onSubmit={createMutation.mutate} 
            onCancel={() => setIsCreating(false)}
            isLoading={createMutation.isPending}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {!isLoading && connections?.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
                <div className="rounded-full bg-muted p-4 mb-4">
                    <Server className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No connections yet</h3>
                <p className="max-w-sm mt-2 mb-6 text-sm">Create your first connection to start building ETL pipelines.</p>
                <Button onClick={() => setIsCreating(true)} variant="outline">
                    Create Connection
                </Button>
            </div>
        )}
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
                            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-semibold tracking-wider">
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
    const form = useForm<ConnectionFormValues>({
        resolver: zodResolver(connectionSchema),
        defaultValues: {
            name: "",
            type: "postgresql", // Default to postgres
            description: "",
            config: {},
        },
    });

    const selectedConnectorType = form.watch("type");
    const connectorSchema = CONNECTOR_CONFIG_SCHEMAS[selectedConnectorType];

    // Dynamically set default values for config fields when connector type changes
    React.useEffect(() => {
        if (connectorSchema) {
            const newConfigDefaults: Record<string, any> = {};
            connectorSchema.fields.forEach(field => {
                if (field.defaultValue !== undefined) {
                    newConfigDefaults[field.name] = field.defaultValue;
                }
            });
            form.setValue("config", newConfigDefaults);
        }
    }, [selectedConnectorType]);


    const renderField = (field: ConnectorField) => {
        // Handle dependencies
        if (field.dependency) {
            const dependentFieldValue = form.watch(`config.${field.dependency.field}`);
            if (dependentFieldValue !== field.dependency.value) {
                return null; // Don't render if dependency not met
            }
        }

        const fieldName = `config.${field.name}`;
        
        switch (field.type) {
            case "select":
                return (
                    <FormField
                        control={form.control}
                        name={fieldName as FieldPath<ConnectionFormValues>} // Cast to specific field name if necessary for Zod
                        key={fieldName}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>{field.label}</FormLabel>
                                <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Select a ${field.label.toLowerCase()}`} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {field.options?.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case "textarea":
                 return (
                    <FormField
                        control={form.control}
                        name={fieldName as FieldPath<ConnectionFormValues>}
                        key={fieldName}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>{field.label}</FormLabel>
                                <FormControl>
                                    <textarea
                                        {...formField}
                                        placeholder={field.placeholder}
                                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 );
            default: // text, password, number
                return (
                    <FormField
                        control={form.control}
                        name={fieldName as FieldPath<ConnectionFormValues>} // Temporary cast. Zod's .deepPartial() might help here.
                        key={fieldName}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>{field.label}</FormLabel>
                                <FormControl>
                                    <Input
                                        type={field.type === 'number' ? 'text' : field.type} // HTML type number can cause issues with empty string; handle manually or coerce
                                        inputMode={field.type === 'number' ? 'numeric' : undefined}
                                        {...formField}
                                        value={formField.value ?? ""} // Ensure controlled component
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            formField.onChange(field.type === 'number' ? (val === "" ? undefined : Number(val)) : val);
                                        }}
                                        placeholder={field.placeholder}
                                        required={field.required}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
        }
    };

    return (
        <Card className="mb-8 border-primary/20 bg-muted/30 animate-in slide-in-from-top-4 duration-300">
            <CardHeader>
                <CardTitle>Add New Connection</CardTitle>
                <CardDescription>{connectorSchema?.description || "Configure a new data source or destination."}</CardDescription>
            </CardHeader>
            <CardContent>
            <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Connection Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="My New Data Source" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Connection Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a connector type" />
                                            </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.entries(CONNECTOR_CONFIG_SCHEMAS).map(([key]) => (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex items-center gap-2">
                                                    {CONNECTOR_ICONS[key] || CONNECTOR_ICONS.default}
                                                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                        {/* Dynamically rendered config fields */}
                        {selectedConnectorType && connectorSchema && (
                            <div className="space-y-4 pt-2">
                                <h3 className="text-md font-semibold text-foreground mt-4">Configuration Details</h3>
                                {connectorSchema.fields.map(field => renderField(field))}
                            </div>
                        )}
                        
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <textarea
                                            {...field}
                                            placeholder="A brief description of this connection"
                                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                            <Button type="button" variant="ghost" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isLoading}>
                                Create Connection
                            </Button>
                        </div>
                    </form>
                </FormProvider>
            </CardContent>
        </Card>
    );
};