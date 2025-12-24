import { OperatorLibrary } from '@/components/features/operators/OperatorLibrary';
import { Sparkles } from 'lucide-react';
import { PageMeta } from '@/components/common/PageMeta';

export const OperatorsPage = () => {
    return (
        <div className="relative flex flex-col gap-10 pb-8 animate-in fade-in duration-700 px-4 md:px-0">
            <PageMeta title="Operator Library" description="Definitive collection of processing nodes for your data pipelines." />

            <div className="flex flex-col space-y-10 relative z-10 p-1">
                {/* --- Page Header --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4 md:gap-0 px-1">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-2xl ring-1 ring-border/50 backdrop-blur-md shadow-sm">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground flex items-center gap-3">
                                Operators
                            </h2>
                        </div>
                        <p className="text-sm md:text-base text-muted-foreground font-medium pl-1">
                            The definitive collection of processing nodes for your data pipelines.
                        </p>
                    </div>
                </div>

                {/* Library Content */}
                <main className="relative">
                    <OperatorLibrary />
                </main>
            </div>
        </div>
    );
};

export default OperatorsPage;