import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Adjust path as needed
import { ModeToggle } from '@/components/ModeToggle'; // Adjust path as needed
import { 
  Workflow, Zap, Shield, Globe, ArrowRight, 
  Database, Cable, BarChart3, 
  TrendingUp, Lock, Clock} from 'lucide-react';

export function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
            {/* --- Header --- */}
            <header className="px-6 h-16 flex items-center justify-between border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Workflow className="h-5 w-5 text-primary" />
                    </div>
                    <span className="bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent dark:to-blue-400">
                        SynqX
                    </span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                    <a href="#features" className="hover:text-primary transition-colors">Features</a>
                    <a href="#integrations" className="hover:text-primary transition-colors">Integrations</a>
                    <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
                    <a 
                        href="http://localhost:3000" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-primary transition-colors"
                    >
                        Docs
                    </a>
                </nav>

                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <Link to="/login" className="hidden sm:block">
                        <Button variant="ghost" size="sm">Sign In</Button>
                    </Link>
                    <Link to="/dashboard">
                        <Button size="sm" className="shadow-lg shadow-primary/20">
                            Go to Console
                            <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1">
                {/* --- Hero Section --- */}
                <section className="relative py-20 lg:py-32 overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[48px_48px]"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>
                    
                    <div className="container px-4 md:px-6 mx-auto text-center space-y-8">
                        {/* Announcement Badge */}
                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 cursor-default">
                            <span className="mr-2 flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            v1.0 is now live — Join 1000+ teams
                        </div>
                        
                        {/* Headline */}
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                                <span className="block text-foreground">Universal ETL Engine</span>
                                <span className="block bg-linear-to-r from-primary via-blue-600 to-cyan-500 bg-clip-text text-transparent pb-2">
                                    for Modern Data Teams
                                </span>
                            </h1>
                            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl leading-relaxed">
                                Build, orchestrate, and monitor your data pipelines with a visual editor, 
                                <span className="text-foreground font-medium"> real-time logging</span>, and 
                                <span className="text-foreground font-medium"> 50+ native connectors</span>.
                            </p>
                        </div>
                        
                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link to="/dashboard">
                                <Button size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                                    Start Building Free 
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="lg" className="h-12 px-8 text-base hover:bg-accent/50">
                                    View Documentation
                                </Button>
                            </a>
                        </div>

                        {/* --- Hero Dashboard Preview (CSS Only - No Images) --- */}
                        <div className="mt-16 relative group max-w-5xl mx-auto">
                            {/* Glow behind dashboard */}
                            <div className="absolute -inset-1 bg-linear-to-r from-primary/30 via-blue-600/30 to-primary/30 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
                            
                            <div className="relative rounded-xl border bg-card/95 backdrop-blur shadow-2xl overflow-hidden">
                                {/* Fake Browser Bar */}
                                <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono">synqx-console.app/pipelines/prod-analytics</div>
                                    <div className="w-16"></div> 
                                </div>

                                {/* Fake Workflow UI */}
                                <div className="bg-grid-small-black/[0.2] dark:bg-grid-small-white/[0.1] h-[300px] md:h-[400px] relative w-full overflow-hidden flex items-center justify-center p-8">
                                    {/* Connection Lines (SVG) */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-muted-foreground/30" strokeWidth="2">
                                        <path d="M 200 200 C 300 200, 300 150, 400 150" fill="none" className="animate-[dash_20s_linear_infinite]" strokeDasharray="10,10" />
                                        <path d="M 200 200 C 300 200, 300 250, 400 250" fill="none" />
                                        <path d="M 550 150 C 600 150, 600 200, 650 200" fill="none" />
                                        <path d="M 550 250 C 600 250, 600 200, 650 200" fill="none" />
                                    </svg>

                                    {/* Nodes */}
                                    <div className="absolute left-[10%] md:left-[15%] top-1/2 -translate-y-1/2">
                                        <MockNode icon={<Database className="text-blue-500"/>} title="Postgres DB" sub="Source" />
                                    </div>

                                    <div className="absolute left-[40%] md:left-[45%] top-[30%]">
                                        <MockNode icon={<Workflow className="text-orange-500"/>} title="Transform" sub="Python Script" active />
                                    </div>

                                    <div className="absolute left-[40%] md:left-[45%] top-[70%] -translate-y-full">
                                        <MockNode icon={<Shield className="text-purple-500"/>} title="PII Scrub" sub="Security" />
                                    </div>

                                    <div className="absolute right-[10%] md:right-[15%] top-1/2 -translate-y-1/2">
                                        <MockNode icon={<Globe className="text-green-500"/>} title="Snowflake" sub="Destination" />
                                    </div>
                                    
                                    {/* Floating Status Badge */}
                                    <div className="absolute bottom-6 right-6 bg-background/80 backdrop-blur border rounded-full px-4 py-2 text-xs font-mono text-green-500 flex items-center gap-2 shadow-lg">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        Pipeline Running: 04m 21s
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Stats Bar --- */}
                <section className="py-12 border-y bg-muted/30">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            <StatItem number="50+" label="Native Connectors" />
                            <StatItem number="1M+" label="Pipelines Run Daily" />
                            <StatItem number="99.9%" label="Uptime SLA" />
                            <StatItem number="<100ms" label="Avg. Latency" />
                        </div>
                    </div>
                </section>

                {/* --- Features Section --- */}
                <section id="features" className="py-24 relative">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to move data</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                                From simple replications to complex DAGs, SynqX handles the heavy lifting so you can focus on insights.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FeatureCard 
                                icon={<Workflow className="h-8 w-8" />}
                                title="Visual Workflow Builder"
                                description="Drag and drop nodes to create complex data flows. Visualize dependencies and execution paths instantly."
                                color="text-blue-500"
                            />
                            <FeatureCard 
                                icon={<Zap className="h-8 w-8" />}
                                title="Real-time Observability"
                                description="Watch logs stream in real-time via WebSockets. Debug issues faster with granular step-level details."
                                color="text-amber-500"
                            />
                             <FeatureCard 
                                icon={<Shield className="h-8 w-8" />}
                                title="Enterprise Security"
                                description="Role-based access control, encrypted credentials, and VPC peering support for secure data transit."
                                color="text-green-500"
                            />
                            <FeatureCard 
                                icon={<TrendingUp className="h-8 w-8" />}
                                title="Smart Scaling"
                                description="Auto-scale workers based on pipeline load. Handle millions of rows without manual intervention."
                                color="text-purple-500"
                            />
                            <FeatureCard 
                                icon={<Lock className="h-8 w-8" />}
                                title="Data Governance"
                                description="Built-in PII detection, data lineage tracking, and compliance-ready audit logs."
                                color="text-red-500"
                            />
                            <FeatureCard 
                                icon={<Clock className="h-8 w-8" />}
                                title="Flexible Scheduling"
                                description="Cron expressions, event triggers, or API-driven runs. Schedule pipelines your way."
                                color="text-cyan-500"
                            />
                        </div>
                    </div>
                </section>

                 {/* --- Integrations Section --- */}
                 <section id="integrations" className="py-24 bg-muted/20 border-t">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium">
                                        Integrations
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Connect to anything</h2>
                                    <p className="text-muted-foreground text-lg">
                                        SynqX supports 50+ native connectors including major databases, data warehouses, and SaaS APIs.
                                        <span className="block mt-2 text-foreground font-medium">Custom SDK available for proprietary sources.</span>
                                    </p>
                                </div>
                                
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <IntegrationItem icon={<Database className="h-5 w-5"/>} text="PostgreSQL, MySQL, Mongo" />
                                    <IntegrationItem icon={<Globe className="h-5 w-5"/>} text="Snowflake, BigQuery" />
                                    <IntegrationItem icon={<Cable className="h-5 w-5"/>} text="Salesforce, HubSpot" />
                                    <IntegrationItem icon={<BarChart3 className="h-5 w-5"/>} text="AWS S3, Azure Blob" />
                                </ul>
                                
                                <Button variant="outline" className="group">
                                    View All 50+ Connectors
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>

                            {/* Floating Cards Animation */}
                            <div className="relative h-[400px] w-full bg-linear-to-br from-primary/5 to-transparent rounded-full opacity-100 flex items-center justify-center">
                                {/* Center Logo */}
                                <div className="z-20 h-24 w-24 bg-background rounded-2xl shadow-xl flex items-center justify-center border border-primary/20">
                                    <Workflow className="h-10 w-10 text-primary" />
                                </div>

                                {/* Orbiting Planets */}
                                <IntegrationCard name="Snowflake" color="text-blue-500" position="absolute top-10 left-10" />
                                <IntegrationCard name="Postgres" color="text-blue-700" position="absolute bottom-20 left-0" />
                                <IntegrationCard name="S3 Bucket" color="text-orange-500" position="absolute top-0 right-20" />
                                <IntegrationCard name="dbt" color="text-orange-600" position="absolute bottom-10 right-10" />
                                <IntegrationCard name="Salesforce" color="text-cyan-500" position="absolute top-1/2 right-0 translate-x-1/2" />
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* --- Bottom CTA --- */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-t from-primary/5 via-transparent to-transparent -z-10"></div>
                    <div className="container px-4 md:px-6 mx-auto text-center space-y-8">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                            Ready to modernize your data stack?
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Join thousands of data teams building reliable, scalable pipelines with SynqX.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link to="/dashboard">
                                <Button size="lg" className="h-14 px-10 text-lg shadow-xl shadow-primary/20">
                                    Start Free Trial
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="h-14 px-10 text-lg">
                                Schedule Demo
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            {/* --- Footer --- */}
            <footer className="py-12 border-t bg-muted/10">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 font-bold text-xl">
                                <Workflow className="h-6 w-6 text-primary" />
                                <span>SynqX</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Universal ETL engine for modern data teams.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Resources</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="http://localhost:3000" target="_blank" className="hover:text-primary transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t text-center text-sm text-muted-foreground">
                        <p>© 2025 SynqX Inc. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* --- Sub Components --- */

const StatItem = ({ number, label }: { number: string, label: string }) => (
    <div className="space-y-2">
        <div className="text-3xl md:text-4xl font-bold text-foreground">
            {number}
        </div>
        <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
    </div>
);

const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) => (
    <div className="group relative p-6 rounded-2xl border bg-card hover:bg-muted/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className={`mb-4 w-fit p-3 rounded-xl bg-muted group-hover:bg-background border border-transparent group-hover:border-border transition-colors ${color}`}>
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
);

const IntegrationItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
    <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
            {icon}
        </div>
        <span className="font-medium text-sm">{text}</span>
    </li>
);

const IntegrationCard = ({ name, color, position }: { name: string, color: string, position: string }) => (
    <div className={`${position} px-4 py-3 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
        <span className={`font-bold ${color}`}>{name}</span>
    </div>
);

// CSS-Only Mock Node for Dashboard Preview
const MockNode = ({ icon, title, sub, active = false }: { icon: React.ReactNode, title: string, sub: string, active?: boolean }) => (
    <div className={`
        w-40 p-3 rounded-lg border bg-card flex items-center gap-3 shadow-sm relative z-10
        ${active ? 'ring-2 ring-primary border-primary' : 'border-border'}
    `}>
        <div className="p-2 bg-muted rounded-md">{icon}</div>
        <div className="flex flex-col">
            <span className="text-xs font-bold">{title}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{sub}</span>
        </div>
        {/* Input/Output Dots */}
        <div className="absolute top-1/2 -left-1 w-2 h-2 rounded-full bg-muted-foreground/50 -translate-y-1/2"></div>
        <div className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-muted-foreground/50 -translate-y-1/2"></div>
    </div>
);