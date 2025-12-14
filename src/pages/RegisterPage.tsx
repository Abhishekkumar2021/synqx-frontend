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
                            <Button variant="outline" className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 border-transparent hover:border-primary/20 transition-all duration-300">
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.0003 20.4144L20.4145 12.0002L12.0003 3.58594L3.58609 12.0002L12.0003 20.4144ZM12.0003 23.2428L0.757812 12.0002L12.0003 0.757629L23.2428 12.0002L12.0003 23.2428Z" />
                                </svg>
                                GitHub
                            </Button>
                            <Button variant="outline" className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 border-transparent hover:border-primary/20 transition-all duration-300">
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
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