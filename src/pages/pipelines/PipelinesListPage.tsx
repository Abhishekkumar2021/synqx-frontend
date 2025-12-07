import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPipelines, type Pipeline } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, Workflow, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PipelinesListPage: React.FC = () => {
    const { data: pipelines, isLoading } = useQuery({ queryKey: ['pipelines'], queryFn: getPipelines });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Pipelines</h2>
                    <p className="text-muted-foreground">Manage your ETL workflows.</p>
                </div>
                <Link to="/pipelines/new">
                     <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Pipeline
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div>Loading pipelines...</div>
            ) : pipelines && pipelines.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pipelines.map((pipeline: Pipeline) => (
                        <Card key={pipeline.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Workflow className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    {pipeline.name}
                                </CardTitle>
                                <CardDescription>{pipeline.description || "No description"}</CardDescription>
                             </CardHeader>
                             <CardContent>
                                <div className="flex justify-between items-center mt-4">
                                    <span className={`text-xs px-2 py-1 rounded-full ${pipeline.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                        {pipeline.status}
                                    </span>
                                    <Link to={`/pipelines/${pipeline.id}`}>
                                        <Button variant="ghost" size="sm" className="gap-2">
                                            Edit <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                             </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[400px] border border-dashed rounded-lg bg-muted/10">
                    <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No pipelines found</h3>
                    <p className="text-muted-foreground mb-4">Get started by creating your first workflow.</p>
                    <Link to="/pipelines/new">
                        <Button>Create Pipeline</Button>
                    </Link>
                </div>
            )}
        </div>
    );
};
