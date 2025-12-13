import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { loginUser } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { 
    Loader2, Mail, Lock, Eye, EyeOff, 
    Workflow, ArrowRight, Sparkles, Shield, Zap
} from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Performance: Use ref for mouse tracking instead of state to prevent re-renders
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            
            // Calculate percentages for CSS variables
            const x = (clientX / innerWidth) * 100;
            const y = (clientY / innerHeight) * 100;
            
            containerRef.current.style.setProperty('--mouse-x', `${x}%`);
            containerRef.current.style.setProperty('--mouse-y', `${y}%`);
            containerRef.current.style.setProperty('--cursor-x', `${clientX}px`);
            containerRef.current.style.setProperty('--cursor-y', `${clientY}px`);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await loginUser({ username: email, password });
            login(data.access_token);
            toast.success('Welcome back, Commander.');
        } catch (err) {
            console.error(err);
            toast.error('Invalid credentials', {
                description: "Please check your email and password."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div ref={containerRef} className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 overflow-hidden bg-background">
            
            {/* --- RIGHT PANEL: Premium Visuals --- */}
            <div className="relative hidden h-full flex-col bg-zinc-900 p-10 text-white lg:flex dark:border-r border-white/10 overflow-hidden">
                
                {/* 1. Background Layers */}
                <div className="absolute inset-0 bg-zinc-950">
                    {/* Noise Texture Overlay */}
                    <div className="absolute inset-0 bg-noise opacity-20 mix-blend-soft-light pointer-events-none"></div>
                    
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 bg-grid-white/[0.05] bg-size-[32px_32px]"></div>
                    
                    {/* Dynamic Mouse Spotlight via CSS Variables */}
                    <div 
                        className="absolute inset-0 opacity-40 transition-opacity duration-500"
                        style={{
                            background: `radial-gradient(600px circle at var(--cursor-x) var(--cursor-y), rgba(var(--primary-rgb, 59, 130, 246), 0.15), transparent 80%)`
                        }}
                    ></div>

                    {/* Ambient Orbs */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] opacity-20 animate-pulse delay-1000"></div>
                    
                    {/* Floating Particles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute bg-white/10 backdrop-blur-sm rounded-full animate-float border border-white/5"
                                style={{
                                    width: Math.random() * 40 + 10 + 'px',
                                    height: Math.random() * 40 + 10 + 'px',
                                    left: Math.random() * 100 + '%',
                                    top: Math.random() * 100 + '%',
                                    animationDelay: `${Math.random() * 5}s`,
                                    animationDuration: `${10 + Math.random() * 10}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* 2. Content Layer */}
                <div className="relative z-20 flex items-center text-lg font-medium gap-2 animate-in fade-in slide-in-from-top-8 duration-700">
                    <div className="p-2 bg-linear-to-br from-primary to-primary/50 rounded-xl shadow-lg shadow-primary/20 backdrop-blur-md border border-white/10">
                        <Workflow className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold tracking-tight text-white drop-shadow-md">SynqX Platform</span>
                </div>

                {/* 3. Feature Highlights (Middle) */}
                <div className="relative z-20 mt-24 space-y-8 max-w-md animate-in fade-in slide-in-from-left-8 duration-1000 delay-150">
                     <h2 className="text-3xl font-bold leading-tight bg-linear-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Orchestrate your data,<br/> control the future.
                    </h2>
                    
                    <div className="space-y-6">
                        {[
                            { icon: Shield, title: "Enterprise Grade", desc: "SOC2 Compliant security architecture" },
                            { icon: Zap, title: "Zero Latency", desc: "Real-time stream processing engine" },
                            { icon: Sparkles, title: "AI Optimized", desc: "Self-healing pipeline capabilities" }
                        ].map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:translate-x-1">
                                <div className="p-2.5 bg-primary/20 rounded-lg text-primary-foreground">
                                    <feature.icon className="h-5 w-5 text-blue-200" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Testimonial (Bottom) */}
                <div className="relative z-20 mt-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <div className="p-6 bg-linear-to-b from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
                        <blockquote className="space-y-4">
                            <p className="text-base font-medium leading-relaxed text-zinc-200 italic">
                                &ldquo;The real-time forensic logging capabilities alone have saved us hundreds of engineering hours. It's not just a tool; it's our central nervous system.&rdquo;
                            </p>
                            <footer className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-400 to-primary p-px">
                                    <div className="h-full w-full rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-white">
                                        SD
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">Sofia Davis</div>
                                    <div className="text-xs text-zinc-400">Lead Data Architect</div>
                                </div>
                            </footer>
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* --- LEFT PANEL: Login Form --- */}
            <div className="lg:p-8 relative h-full flex items-center justify-center bg-background">
                {/* Spotlight effect for the form container */}
                <div 
                    className="absolute inset-0 pointer-events-none lg:hidden"
                    style={{
                        background: `radial-gradient(800px circle at var(--cursor-x) var(--cursor-y), rgba(var(--primary-rgb), 0.05), transparent 80%)`
                    }}
                />

                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] z-10 px-6">
                    
                    {/* Header */}
                    <div className="flex flex-col space-y-2 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="mx-auto mb-4 p-3 bg-linear-to-br from-primary/20 to-primary/5 rounded-2xl ring-1 ring-primary/20 w-fit">
                            <Workflow className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Sign in to access your command center
                        </p>
                    </div>

                    {/* Form */}
                    <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        id="email" 
                                        placeholder="name@example.com" 
                                        type="email" 
                                        autoCapitalize="none" 
                                        autoComplete="email" 
                                        autoCorrect="off"
                                        disabled={isLoading}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-11 bg-muted/30 border-border hover:border-primary/50 focus:border-primary focus:bg-background transition-all duration-300"
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link 
                                        to="/forgot-password" 
                                        className="text-xs font-medium text-primary hover:text-primary/80 hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        id="password" 
                                        type={showPassword ? "text" : "password"}
                                        disabled={isLoading}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 h-11 bg-muted/30 border-border hover:border-primary/50 focus:border-primary focus:bg-background transition-all duration-300"
                                        required 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full h-11 font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5" 
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Sign In 
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-3 text-muted-foreground font-medium">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="h-11 bg-background hover:bg-muted border-border hover:border-primary/30 transition-all duration-300">
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.0003 20.4144L20.4145 12.0002L12.0003 3.58594L3.58609 12.0002L12.0003 20.4144ZM12.0003 23.2428L0.757812 12.0002L12.0003 0.757629L23.2428 12.0002L12.0003 23.2428Z" />
                                </svg>
                                GitHub
                            </Button>
                            <Button variant="outline" className="h-11 bg-background hover:bg-muted border-border hover:border-primary/30 transition-all duration-300">
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                                </svg>
                                Google
                            </Button>
                        </div>
                        
                        <p className="text-center text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <Link 
                                to="/register" 
                                className="font-medium text-primary hover:underline underline-offset-4"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};