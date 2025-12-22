import { OperatorLibrary } from '@/components/features/transforms/OperatorLibrary';
import { Sparkles } from 'lucide-react';

export const OperatorsPage = () => {
    return (
        <div className="container max-w-7xl mx-auto py-10 px-6 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Page Header */}
            <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/40">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-foreground leading-tight">
                            Operator Library
                        </h1>
                    </div>

                    <p className="text-muted-foreground text-lg max-w-xl font-medium leading-relaxed">
                        The definitive collection of processing nodes for your data pipelines.
                        Search, discover, and implement pre-built transformations.
                    </p>
                </div>
            </div>

            {/* Library Content */}
            <main className="relative">
                <OperatorLibrary />
            </main>
        </div>
    );
};

export default OperatorsPage;