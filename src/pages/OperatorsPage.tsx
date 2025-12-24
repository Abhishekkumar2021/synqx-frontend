import { OperatorLibrary } from '@/components/features/operators/OperatorLibrary';
import { Sparkles, Layers } from 'lucide-react';
import { PageMeta } from '@/components/common/PageMeta';
import { motion } from 'framer-motion';

export const OperatorsPage = () => {
    return (
        <div className="relative min-h-[calc(100vh-4rem)] flex flex-col overflow-hidden px-4 md:px-0">
            <PageMeta title="Operator Library" description="Definitive collection of processing nodes for your data pipelines." />

            {/* Visual Background Decor */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full opacity-50 dark:opacity-30" />
                <div className="absolute top-[20%] -left-[10%] w-[35%] h-[35%] bg-blue-500/5 blur-[100px] rounded-full opacity-40 dark:opacity-20" />
            </div>

            <div className="container max-w-7xl mx-auto py-12 space-y-16 relative z-10 animate-in fade-in duration-1000">
                {/* Page Header */}
                <header className="relative space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <motion.div 
                                    initial={{ scale: 0.8, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="p-3.5 rounded-[1.25rem] bg-primary/10 text-primary border border-primary/20 shadow-2xl shadow-primary/10 ring-1 ring-white/10"
                                >
                                    <Sparkles className="h-7 w-7" />
                                </motion.div>
                                <div className="space-y-1">
                                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-none">
                                        Operator <span className="text-primary/80 italic">Library</span>
                                    </h1>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pl-1">
                                        <Layers className="h-3 w-3" /> Node Registry v1.0
                                    </div>
                                </div>
                            </div>

                            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl font-medium leading-relaxed tracking-tight">
                                Access the definitive collection of hardware-optimized processing nodes. 
                                <span className="text-foreground font-bold"> Discover</span>, <span className="text-foreground font-bold">Configure</span>, and <span className="text-foreground font-bold">Deploy</span> advanced logic to your sequence.
                            </p>
                        </div>

                        {/* Optional Quick Stats */}
                        <div className="hidden lg:flex items-center gap-4">
                            <div className="px-6 py-4 rounded-3xl bg-muted/20 border border-border/40 backdrop-blur-md flex flex-col items-center justify-center text-center shadow-inner group hover:border-primary/30 transition-all duration-500">
                                <span className="text-3xl font-black tracking-tighter text-primary group-hover:scale-110 transition-transform">15+</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Core Units</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-linear-to-r from-border/60 via-border/20 to-transparent" />
                </header>

                {/* Library Content */}
                <main className="relative min-h-[600px]">
                    <OperatorLibrary />
                </main>
            </div>
        </div>
    );
};

export default OperatorsPage;