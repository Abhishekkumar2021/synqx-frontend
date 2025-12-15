import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/layout/ModeToggle';
import {
    Workflow, Zap, Shield, Globe, ArrowRight,
    Database, Cable, BarChart3,
    Lock, Clock, CheckCircle2,
    Code2, Sparkles, Server, Cpu
} from 'lucide-react';
import { FeatureCard } from '@/components/features/landing/FeatureCard';
import { StatItem } from '@/components/features/landing/StatItem';
import { IntegrationItem, IntegrationCard } from '@/components/features/landing/IntegrationComponents';
import { MockNode } from '@/components/features/landing/MockNode';
import { PageMeta } from '@/components/common/PageMeta';

export function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen font-sans selection:bg-primary/20 selection:text-primary bg-background text-foreground overflow-x-hidden">
            <PageMeta title="Home" description="The Universal ETL Engine for modern data stacks." />
            
            {/* --- Header --- */}
            <header className="fixed top-0 w-full z-50 px-6 h-16 flex items-center justify-between border-b border-white/5 bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
                <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
                    <Zap className="w-5 h-5 text-blue-500" />
                    <span>SynqX</span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                    <a href="#features" className="hover:text-primary transition-colors">Features</a>
                    <a href="#integrations" className="hover:text-primary transition-colors">Integrations</a>
                    <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
                    <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Docs</a>
                </nav>

                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <Link to="/login" className="hidden sm:block">
                        <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary rounded-full">Sign In</Button>
                    </Link>
                    <Link to="/dashboard">
                        <Button size="sm" className="font-semibold shadow-[0_0_15px_-5px_var(--color-primary)] hover:shadow-[0_0_25px_-5px_var(--color-primary)] transition-all rounded-full px-5">
                            Console
                            <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1 pt-16">
                
                {/* --- Hero Section --- */}
                <section className="relative py-24 lg:py-32 overflow-hidden flex flex-col items-center justify-center">
                    {/* Premium Background Effects */}
                    <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
                    <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
                    
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] -z-10 rounded-full mix-blend-screen opacity-40 pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[100px] -z-10 rounded-full opacity-30 pointer-events-none" />

                    <div className="container px-4 md:px-6 mx-auto text-center space-y-10 relative z-10">
                        {/* Pill Badge */}
                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary shadow-[0_0_15px_-5px_var(--color-primary)] backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-700">
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            <span>v2.0 is live — The Universal ETL Engine</span>
                        </div>

                        {/* Headlines */}
                        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                                <span className="block text-foreground">Orchestrate Data</span>
                                <span className="bg-clip-text text-transparent bg-linear-to-r from-primary via-blue-400 to-indigo-500 animate-gradient-x">
                                    At Light Speed
                                </span>
                            </h1>
                            <p className="mx-auto max-w-2xl text-muted-foreground md:text-xl leading-relaxed">
                                Build, debug, and scale your data pipelines with a visual canvas.
                                <span className="text-foreground font-medium"> Zero config overhead.</span>
                                <span className="text-foreground font-medium"> Instant observability.</span>
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                            <Link to="/dashboard">
                                <Button size="lg" className="h-14 px-8 text-base shadow-[0_0_30px_-10px_var(--color-primary)] hover:shadow-[0_0_40px_-10px_var(--color-primary)] hover:-translate-y-0.5 transition-all duration-300 rounded-full">
                                    Start Building Now
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-base border-primary/20 bg-background/50 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all backdrop-blur-sm rounded-full">
                                    <Code2 className="mr-2 h-4 w-4" />
                                    Read Documentation
                                </Button>
                            </a>
                        </div>

                        {/* Interactive Hero Graphic */}
                        <div className="mt-24 relative group max-w-6xl mx-auto perspective-[2000px] animate-in fade-in zoom-in-95 duration-1000 delay-500">
                            <div className="absolute -inset-1 bg-linear-to-r from-primary/30 via-indigo-500/30 to-blue-600/30 rounded-[2rem] blur-3xl opacity-30 group-hover:opacity-50 transition-duration-500"></div>

                            <div className="relative rounded-[2rem] border border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl overflow-hidden transform transition-transform duration-700 hover:scale-[1.005]">
                                {/* Browser Toolbar */}
                                <div className="border-b border-white/5 bg-black/20 px-4 py-3 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-destructive/80 border border-destructive/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-500/50"></div>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-background/50 border border-white/5 text-[10px] text-muted-foreground font-mono flex items-center gap-2 shadow-inner">
                                        <Lock className="h-2.5 w-2.5" />
                                        synqx.app/pipelines/production-v1
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-2 w-12 rounded-full bg-white/5" />
                                    </div>
                                </div>

                                {/* Canvas Area */}
                                <div className="h-[450px] md:h-[550px] relative w-full overflow-hidden flex items-center justify-center bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/5 via-background to-background">
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]"></div>

                                    {/* Animated Connection Lines (SVG) */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm">
                                        <defs>
                                            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="rgba(var(--primary-rgb), 0.2)" />
                                                <stop offset="100%" stopColor="rgba(var(--primary-rgb), 0.8)" />
                                            </linearGradient>
                                        </defs>
                                        
                                        {/* Paths connecting nodes - Adjust coordinates based on node positions */}
                                        <path d="M 250 275 C 350 275, 350 205, 450 205" fill="none" stroke="url(#line-gradient)" strokeWidth="2" className="opacity-40" />
                                        <path d="M 250 275 C 350 275, 350 345, 450 345" fill="none" stroke="url(#line-gradient)" strokeWidth="2" className="opacity-40" />
                                        <path d="M 610 205 C 660 205, 660 275, 710 275" fill="none" stroke="url(#line-gradient)" strokeWidth="2" className="opacity-40" />
                                        <path d="M 610 345 C 660 345, 660 275, 710 275" fill="none" stroke="url(#line-gradient)" strokeWidth="2" className="opacity-40" />

                                        {/* Animated dots traveling along paths */}
                                        <circle r="3" className="fill-primary animate-ping">
                                            <animateMotion dur="3s" repeatCount="indefinite" path="M 250 275 C 350 275, 350 205, 450 205" />
                                        </circle>
                                        <circle r="3" className="fill-primary animate-ping" style={{ animationDelay: '1.5s' }}>
                                            <animateMotion dur="3s" repeatCount="indefinite" path="M 250 275 C 350 345, 350 345, 450 345" />
                                        </circle>
                                    </svg>

                                    {/* Mock Nodes - Absolute positioning for the demo layout */}
                                    <div className="absolute left-[8%] md:left-[12%] top-1/2 -translate-y-1/2 animate-float-slow">
                                        <MockNode
                                            icon={<Database className="text-blue-400" />}
                                            title="Postgres Production"
                                            sub="Read Replica"
                                            type="source"
                                        />
                                    </div>

                                    <div className="absolute left-[38%] md:left-[40%] top-[30%] -translate-y-1/2 animate-float-medium">
                                        <MockNode
                                            icon={<Code2 className="text-orange-400" />}
                                            title="Transform Py"
                                            sub="Python 3.9"
                                            type="transform"
                                            status="running"
                                            active
                                        />
                                    </div>

                                    <div className="absolute left-[38%] md:left-[40%] top-[70%] -translate-y-1/2 animate-float-fast">
                                        <MockNode
                                            icon={<Shield className="text-red-400" />}
                                            title="PII Obfuscation"
                                            sub="Security Policy"
                                            type="transform"
                                        />
                                    </div>

                                    <div className="absolute right-[8%] md:right-[12%] top-1/2 -translate-y-1/2 animate-float-slow">
                                        <MockNode
                                            icon={<Globe className="text-emerald-400" />}
                                            title="Snowflake DW"
                                            sub="Analytics Schema"
                                            type="sink"
                                        />
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute bottom-6 right-6 bg-background/80 backdrop-blur-md border border-border/50 rounded-full px-4 py-2 text-xs font-mono text-emerald-500 flex items-center gap-2 shadow-lg ring-1 ring-emerald-500/20">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        Engine Status: Operational
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Stats Section --- */}
                <section className="py-20 border-y border-white/5 bg-white/5 backdrop-blur-sm relative">
                    <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none"></div>
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                            <StatItem number="50+" label="Native Connectors" />
                            <StatItem number="1.2B" label="Rows Processed / Day" />
                            <StatItem number="99.99%" label="Uptime SLA" />
                            <StatItem number="<50ms" label="Engine Latency" />
                        </div>
                    </div>
                </section>

                {/* --- Features Grid --- */}
                <section id="features" className="py-32 relative">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-20 space-y-4">
                            <div className="text-primary font-semibold tracking-wider text-sm uppercase">Power & Flexibility</div>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need to move data</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                                From simple replications to complex DAGs, SynqX handles the heavy lifting so you can focus on insights.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<Workflow className="h-6 w-6" />}
                                title="Visual Workflow Builder"
                                description="Drag and drop nodes to create complex data flows. Visualize dependencies and execution paths instantly."
                            />
                            <FeatureCard
                                icon={<Zap className="h-6 w-6" />}
                                title="Real-time Observability"
                                description="Watch logs stream in real-time via WebSockets. Debug issues faster with granular step-level details."
                            />
                            <FeatureCard
                                icon={<Shield className="h-6 w-6" />}
                                title="Enterprise Security"
                                description="Role-based access control, encrypted credentials, and VPC peering support for secure data transit."
                            />
                            <FeatureCard
                                icon={<Cpu className="h-6 w-6" />}
                                title="Smart Scaling"
                                description="Auto-scale workers based on pipeline load. Handle millions of rows without manual intervention."
                            />
                            <FeatureCard
                                icon={<Lock className="h-6 w-6" />}
                                title="Data Governance"
                                description="Built-in PII detection, data lineage tracking, and compliance-ready audit logs."
                            />
                            <FeatureCard
                                icon={<Clock className="h-6 w-6" />}
                                title="Flexible Scheduling"
                                description="Cron expressions, event triggers, or API-driven runs. Schedule pipelines your way."
                            />
                        </div>
                    </div>
                </section>

                {/* --- Integrations Showcase --- */}
                <section id="integrations" className="py-32 bg-secondary/5 border-t border-border/40 overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div className="space-y-8 relative z-10">
                                <div className="space-y-4">
                                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                                        Integrations
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Connect to anything</h2>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        SynqX supports 50+ native connectors including major databases, data warehouses, and SaaS APIs. Custom SDK available for proprietary sources.
                                    </p>
                                </div>

                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <IntegrationItem icon={<Database className="h-4 w-4 text-blue-400" />} text="PostgreSQL, MySQL" />
                                    <IntegrationItem icon={<Globe className="h-4 w-4 text-emerald-400" />} text="Snowflake, BigQuery" />
                                    <IntegrationItem icon={<Cable className="h-4 w-4 text-orange-400" />} text="Salesforce, HubSpot" />
                                    <IntegrationItem icon={<BarChart3 className="h-4 w-4 text-purple-400" />} text="AWS S3, Azure Blob" />
                                </ul>

                                <Button variant="outline" className="group h-12 px-6 border-primary/20 hover:border-primary hover:bg-primary/5 text-foreground transition-all rounded-full">
                                    View All Connectors
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform text-primary" />
                                </Button>
                            </div>

                            <div className="relative h-[500px] w-full flex items-center justify-center perspective-[1000px]">
                                <div className="absolute inset-0 bg-linear-to-tr from-primary/10 to-transparent rounded-full blur-3xl opacity-50" />

                                {/* Central Hub */}
                                <div className="z-20 h-32 w-32 bg-background/80 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_-10px_var(--color-primary)] flex items-center justify-center border border-primary/30 relative">
                                    <div className="absolute inset-0 rounded-3xl bg-primary/10 animate-pulse" />
                                    <Workflow className="h-14 w-14 text-primary relative z-10" />
                                </div>

                                {/* Orbiting Cards */}
                                <IntegrationCard name="Snowflake" icon={<Globe />} color="text-emerald-400" position="absolute top-10 left-10 animate-float-slow" />
                                <IntegrationCard name="Postgres" icon={<Database />} color="text-blue-400" position="absolute bottom-20 left-0 animate-float-medium" />
                                <IntegrationCard name="S3 Bucket" icon={<Server />} color="text-orange-400" position="absolute top-0 right-20 animate-float-fast" />
                                <IntegrationCard name="dbt Core" icon={<Code2 />} color="text-purple-400" position="absolute bottom-10 right-10 animate-float-slow" />
                                <IntegrationCard name="Salesforce" icon={<Cable />} color="text-sky-400" position="absolute top-1/2 right-0 translate-x-1/2 animate-float-medium" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Final CTA --- */}
                <section className="py-32 border-t border-border/40 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)] opacity-5 pointer-events-none" />
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-size-[32px_32px] pointer-events-none" />
                    
                    <div className="container px-4 md:px-6 mx-auto text-center space-y-10 relative z-10">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                            Ready to modernize your stack?
                        </h2>
                        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
                            Join thousands of data teams building reliable, scalable pipelines with SynqX.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link to="/dashboard">
                                <Button size="lg" className="h-14 px-10 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1 rounded-full">
                                    Start Free Trial
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="h-14 px-10 text-lg border-muted-foreground/20 hover:bg-muted/50 backdrop-blur-sm rounded-full">
                                Schedule Demo
                            </Button>
                        </div>
                        <div className="flex items-center justify-center gap-8 pt-8 text-muted-foreground text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No credit card required
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 14-day free trial
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* --- Footer --- */}
            <footer className="py-16 border-t border-white/5 bg-white/5 relative">
                <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none"></div>
                <div className="container px-4 md:px-6 mx-auto relative z-10">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 font-bold text-xl">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                                    <Workflow className="h-5 w-5 text-primary" />
                                </div>
                                <span>SynqX</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                The universal ETL engine designed for the modern data stack. Built for speed, reliability, and scale.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-6 text-foreground">Product</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-6 text-foreground">Resources</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><a href="http://localhost:3000" target="_blank" className="hover:text-primary transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-6 text-foreground">Legal</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-white/5 text-center text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
                        <p>© 2025 SynqX Inc. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
                            <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
                            <a href="#" className="hover:text-foreground transition-colors">Discord</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}