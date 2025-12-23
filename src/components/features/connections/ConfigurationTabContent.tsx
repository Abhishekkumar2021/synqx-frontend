import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Settings2, Key, AlertTriangle, Activity } from 'lucide-react';
import { ConfigField } from './ConfigField';
import { cn } from '@/lib/utils'; // Import cn for conditional class names

const ConfigurationTabContent = ({ 
    connection, 
    impactData, 
    loadingImpact, 
    usageStats, 
    loadingUsageStats 
}: { 
    connection: any;
    impactData: any;
    loadingImpact: boolean;
    usageStats: any;
    loadingUsageStats: boolean;
}) => {
    const config = connection.config || {};
    
    const mainFields = ['host', 'port', 'database', 'username', 'database_path', 'url', 'account', 'warehouse', 'schema', 'role', 'bucket', 'region'];
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'api_key', 'access_key'];
    
    const configEntries = Object.entries(config).filter(([key]) => !mainFields.includes(key.toLowerCase()) && !sensitiveKeys.some(sk => key.toLowerCase().includes(sk)));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto p-4 custom-scrollbar z-10">
            {/* Main Config Details Card */}
            <Card className="lg:col-span-2 border border-border/60 bg-card/40 backdrop-blur-xl shadow-lg h-fit transition-all hover:shadow-2xl hover:-translate-y-1">
                <CardHeader className="border-b border-border/40 bg-gradient-to-b from-muted/20 to-transparent pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                             <Settings2 className="h-4 w-4" />
                        </div>
                        Connection Settings
                    </CardTitle>
                    <CardDescription className="text-sm">Technical configuration for this <span className="font-semibold text-foreground">{connection.connector_type}</span> source.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <ConfigField label="Connection Name" value={connection.name} copyable />
                        <ConfigField label="Connector Type" value={<span className="capitalize font-semibold text-foreground">{connection.connector_type}</span>} />
                    </div>
                    
                    <div className="grid gap-6 md:grid-cols-2">
                        {config.host && <ConfigField label="Host" value={config.host} copyable />}
                        {config.port && <ConfigField label="Port" value={String(config.port)} />}
                        {config.database && <ConfigField label="Database" value={config.database} copyable />}
                        {config.username && <ConfigField label="Username" value={config.username} copyable />}
                        {config.database_path && <ConfigField label="Database Path" value={config.database_path} copyable />}
                        {config.account && <ConfigField label="Account" value={config.account} copyable />}
                        {config.warehouse && <ConfigField label="Warehouse" value={config.warehouse} />}
                        {config.schema && <ConfigField label="Schema" value={config.schema} />}
                        {config.bucket && <ConfigField label="Bucket" value={config.bucket} copyable />}
                        {config.region && <ConfigField label="Region" value={config.region} />}
                    </div>

                    {configEntries.length > 0 && (
                        <div className="grid gap-6 md:grid-cols-2">
                            {configEntries.map(([key, value]) => (
                                <ConfigField 
                                    key={key} 
                                    label={key.replace(/_/g, ' ')} 
                                    value={typeof value === 'object' ? JSON.stringify(value) : String(value)} 
                                    copyable 
                                />
                            ))}
                        </div>
                    )}

                    <ConfigField label="Description" value={connection.description || '—'} />
                    
                    <div className="grid gap-6 md:grid-cols-2">
                        <ConfigField label="Created On" value={format(new Date(connection.created_at || ''), 'PPP')} />
                        <ConfigField label="Last Updated" value={format(new Date(connection.updated_at || ''), 'PPP')} />
                    </div>

                    <div className="border-t border-dashed border-border/50 my-2" />

                    <div className="space-y-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Key className="h-3.5 w-3.5" /> Authentication
                        </h4>
                        <div className="bg-muted/30 border border-border/60 rounded-lg p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Security Credentials</p>
                                <div className="font-mono text-sm tracking-widest text-foreground">••••••••••••••••</div>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                                Encrypted at Rest
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Side Panel Info */}
            <div className="space-y-6">
                <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/10 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl hover:-translate-y-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-500 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Impact Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground leading-relaxed">
                        {loadingImpact ? (
                            <Skeleton className="h-4 w-full" />
                        ) : (
                            <>
                                This connection is actively used by <strong className="text-foreground">{impactData?.pipeline_count || 0} pipelines</strong>.
                                Changing credentials or host details may cause immediate failures in scheduled jobs.
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="border border-border/60 bg-card/40 backdrop-blur-xl shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" /> Usage Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loadingUsageStats ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Sync Success Rate (24h)</span>
                                    <span className="font-mono font-bold text-emerald-500">{usageStats?.sync_success_rate}%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Avg. Latency (24h)</span>
                                    <span className="font-mono text-foreground">{usageStats?.average_latency_ms ? `${usageStats.average_latency_ms}ms` : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Total Runs (24h)</span>
                                    <span className="font-mono text-foreground">{usageStats?.last_24h_runs || 0}</span>
                                </div>
                                 <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Total Runs (7d)</span>
                                    <span className="font-mono text-foreground">{usageStats?.last_7d_runs || 0}</span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ConfigurationTabContent;
