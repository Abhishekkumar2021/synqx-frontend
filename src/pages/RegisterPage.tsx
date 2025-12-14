/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '@/lib/api';
import { 
    Loader2, Mail, Lock, User, Eye, EyeOff, 
    Workflow, ArrowRight, Server, Database, Globe 
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Performance: Use ref for mouse tracking
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            
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
            await registerUser({ email, password, full_name: fullName });
            toast.success('Account created successfully', {
                description: "Welcome to SynqX! Please log in to continue."
            });
            navigate('/login');
        } catch (err: any) {
             const msg = err.response?.data?.detail || 'Registration failed';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div ref={containerRef} className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 overflow-hidden bg-background font-sans selection:bg-primary/20">
            
            {/* --- RIGHT PANEL: Premium Visuals --- */}
            <div className="relative hidden h-full flex-col bg-[#050505] p-12 text-white lg:flex border-r border-white/5 overflow-hidden justify-between">
                
                {/* 1. Background Layers */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-noise opacity-30 mix-blend-soft-light pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px] opacity-20"></div>
                    
                    {/* Dynamic Mouse Spotlight */}
                    <div 
                        className="absolute inset-0 opacity-30 transition-opacity duration-500"
                        style={{
                            background: `radial-gradient(800px circle at var(--cursor-x) var(--cursor-y), rgba(var(--primary-rgb), 0.15), transparent 80%)`
                        }}
                    ></div>

                    {/* Ambient Orbs */}
                    <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] opacity-40 animate-pulse-slow"></div>
                    <div className="absolute top-0 left-0 -ml-20 -mt-20 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] opacity-30 animate-pulse-slow delay-1000"></div>
                </div>

                {/* 2. Top Content */}
                <div className="relative z-20 flex items-center gap-3 animate-in fade-in slide-in-from-top-8 duration-1000">
                    <div className="p-2.5 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl shadow-lg shadow-primary/20 ring-1 ring-white/10 backdrop-blur-md">
                        <Workflow className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">SynqX</span>
                </div>

                {/* 3. Feature Highlights (Middle) */}
                <div className="relative z-20 space-y-12 max-w-lg animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
                     <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                        Scale your stack,<br/> from day one.
                    </h2>
                    
                    <div className="space-y-5">
                        {[
                            { icon: Server, title: "Infrastructure as Code", desc: "Version control for your data pipelines" },
                            { icon: Database, title: "Universal Connectors", desc: "Integrate with 100+ data sources instantly" },
                            { icon: Globe, title: "Global Edge Network", desc: "Deploy workers close to your data source" }
                        ].map((feature, idx) => (
                            <div key={idx} className="group flex items-center gap-5 p-4 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/20">
                                <div className="p-3 bg-white/5 rounded-2xl text-indigo-200 ring-1 ring-white/10 group-hover:bg-primary/20 group-hover:text-white transition-colors">
                                    <feature.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-base">{feature.title}</h3>
                                    <p className="text-sm text-zinc-400 mt-0.5">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Testimonial (Bottom) */}
                <div className="relative z-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                    <div className="p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <blockquote className="space-y-6 relative z-10">
                            <p className="text-lg font-medium leading-relaxed text-zinc-200 italic">
                                &ldquo;We needed a platform that could handle petabytes of data without the operational overhead. SynqX delivered exactly that.&rdquo;
                            </p>
                            <footer className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full p-0.5 bg-gradient-to-br from-purple-400 to-primary">
                                    <div className="h-full w-full rounded-full bg-black flex items-center justify-center text-sm font-bold text-white">
                                        AC
                                    </div>
                                </div>
                                <div>
                                    <div className="text-base font-semibold text-white">Alex Chen</div>
                                    <div className="text-sm text-zinc-400">VP of Engineering</div>
                                </div>
                            </footer>
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* --- LEFT PANEL: Registration Form --- */}
            <div className="lg:p-8 relative h-full flex items-center justify-center bg-background">
                {/* Spotlight effect for the form container */}
                <div 
                    className="absolute inset-0 pointer-events-none lg:hidden"
                    style={{
                        background: `radial-gradient(800px circle at var(--cursor-x) var(--cursor-y), rgba(var(--primary-rgb), 0.05), transparent 80%)`
                    }}
                />

                <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[420px] z-10 px-8 py-12 bg-card/30 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl shadow-black/5 animate-in zoom-in-95 duration-500">
                    
                    {/* Header */}
                    <div className="flex flex-col space-y-3 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Create an account
                        </h1>
                        <p className="text-base text-muted-foreground">
                            Enter your details below to get started
                        </p>
                    </div>

                    {/* Form */}
                    <div className="grid gap-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium ml-1">Full Name</Label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        id="name" 
                                        placeholder="John Doe" 
                                        type="text" 
                                        disabled={isLoading}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="pl-11 h-12 rounded-2xl bg-black/5 dark:bg-white/5 border-transparent focus:bg-background focus:border-primary/30 transition-all"
                                        required 
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium ml-1">Email</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
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
                                        className="pl-11 h-12 rounded-2xl bg-black/5 dark:bg-white/5 border-transparent focus:bg-background focus:border-primary/30 transition-all"
                                        required 
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium ml-1">Password</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        id="password" 
                                        type={showPassword ? "text" : "password"}
                                        disabled={isLoading}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-11 pr-11 h-12 rounded-2xl bg-black/5 dark:bg-white/5 border-transparent focus:bg-background focus:border-primary/30 transition-all"
                                        required 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-xl hover:bg-white/10"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full h-12 rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]" 
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        Get Started 
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/50" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-3 text-muted-foreground font-medium">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 border-transparent hover:border-primary/20 transition-all duration-300 flex gap-2">
                                <svg className="h-5 w-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                                GitHub
                            </Button>
                            <Button variant="outline" className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 border-transparent hover:border-primary/20 transition-all duration-300 flex gap-2">
                                <svg className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Google
                            </Button>
                        </div>
                        
                        <p className="text-center text-xs text-muted-foreground mt-4 px-6">
                            By clicking continue, you agree to our{" "}
                            <Link to="/terms" className="underline underline-offset-4 hover:text-primary transition-colors">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link to="/privacy" className="underline underline-offset-4 hover:text-primary transition-colors">
                                Privacy Policy
                            </Link>
                            .
                        </p>

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">Already have an account? </span>
                            <Link 
                                to="/login" 
                                className="font-bold text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
