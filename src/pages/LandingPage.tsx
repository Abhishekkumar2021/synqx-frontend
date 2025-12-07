import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Workflow, Zap, Shield, Globe, ArrowRight, Database, Cable, BarChart3 } from 'lucide-react';
import { ModeToggle } from '../components/ModeToggle';

export const LandingPage: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="px-6 h-16 flex items-center justify-between border-b bg-background/95 backdrop-blur z-50 sticky top-0">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <Workflow className="h-6 w-6 text-primary" />
                    <span>SynqX</span>
                </div>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                    <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                    <a href="#integrations" className="hover:text-foreground transition-colors">Integrations</a>
                    <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
                    <a href="#docs" className="hover:text-foreground transition-colors">Docs</a>
                </nav>
                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <Link to="/dashboard">
                        <Button>Go to Console</Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-24 lg:py-32 overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="container px-4 md:px-6 mx-auto text-center space-y-8">
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                            v1.0 is now live
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent pb-2">
                            Universal ETL Engine <br className="hidden md:block"/> for Modern Data Teams
                        </h1>
                        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                            Build, orchestrate, and monitor your data pipelines with a visual editor, real-time logging, and extensive connector support.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/dashboard">
                                <Button size="lg" className="h-12 px-8 text-base">
                                    Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                                View Documentation
                            </Button>
                        </div>
                        
                        {/* Hero Image / Dashboard Preview */}
                        <div className="mt-12 rounded-xl border bg-card p-2 shadow-2xl mx-auto max-w-5xl">
                            <div className="rounded-lg bg-muted/50 aspect-video w-full flex items-center justify-center border border-dashed border-muted-foreground/25 text-muted-foreground">
                                Dashboard Preview (Insert Image Here)
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-muted/30">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to move data</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                From simple replications to complex DAGs, SynqX handles the heavy lifting so you can focus on insights.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard 
                                icon={<Workflow className="h-10 w-10 text-primary" />}
                                title="Visual Workflow Builder"
                                description="Drag and drop nodes to create complex data flows. visualize dependencies and execution paths instantly."
                            />
                            <FeatureCard 
                                icon={<Zap className="h-10 w-10 text-primary" />}
                                title="Real-time Observability"
                                description="Watch logs stream in real-time via WebSockets. Debug issues faster with granular step-level execution details."
                            />
                             <FeatureCard 
                                icon={<Shield className="h-10 w-10 text-primary" />}
                                title="Enterprise Security"
                                description="Role-based access control, encrypted credentials, and VPC peering support for secure data transit."
                            />
                        </div>
                    </div>
                </section>

                 {/* Integrations Section */}
                 <section id="integrations" className="py-24">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">Connect to anything</h2>
                                <p className="text-muted-foreground text-lg">
                                    SynqX supports 50+ native connectors including major databases, data warehouses, and SaaS APIs.
                                </p>
                                <ul className="space-y-3">
                                    <IntegrationItem icon={<Database className="h-5 w-5"/>} text="PostgreSQL, MySQL, SQL Server" />
                                    <IntegrationItem icon={<Globe className="h-5 w-5"/>} text="Snowflake, BigQuery, Redshift" />
                                    <IntegrationItem icon={<Cable className="h-5 w-5"/>} text="Salesforce, HubSpot, Stripe" />
                                    <IntegrationItem icon={<BarChart3 className="h-5 w-5"/>} text="S3, GCS, Azure Blob Storage" />
                                </ul>
                                <Button variant="link" className="p-0 h-auto">View all connectors &rarr;</Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-xl border bg-card flex items-center justify-center h-32 shadow-sm">
                                    <span className="font-bold text-xl text-blue-600">Snowflake</span>
                                </div>
                                <div className="p-6 rounded-xl border bg-card flex items-center justify-center h-32 shadow-sm translate-y-8">
                                    <span className="font-bold text-xl text-blue-800">Postgres</span>
                                </div>
                                <div className="p-6 rounded-xl border bg-card flex items-center justify-center h-32 shadow-sm -translate-y-8">
                                    <span className="font-bold text-xl text-orange-500">AWS S3</span>
                                </div>
                                <div className="p-6 rounded-xl border bg-card flex items-center justify-center h-32 shadow-sm">
                                    <span className="font-bold text-xl text-green-600">dbt</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-6 border-t bg-muted/20">
                <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">© 2025 SynqX Inc. All rights reserved.</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground">Privacy</a>
                        <a href="#" className="hover:text-foreground">Terms</a>
                        <a href="#" className="hover:text-foreground">Twitter</a>
                        <a href="#" className="hover:text-foreground">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-4 bg-primary/10 w-fit p-3 rounded-lg">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

const IntegrationItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
    <li className="flex items-center gap-3">
        <div className="p-1.5 rounded-full bg-primary/10 text-primary">
            {icon}
        </div>
        <span className="font-medium">{text}</span>
    </li>
);
