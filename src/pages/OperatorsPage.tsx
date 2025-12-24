import { OperatorLibrary } from '@/components/features/operators/OperatorLibrary';
import { Blocks } from 'lucide-react';
import { PageMeta } from '@/components/common/PageMeta';

export const OperatorsPage = () => {
    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 md:gap-8 animate-in fade-in duration-700 p-4 md:p-0">
            <PageMeta title="Operator Library" description="Definitive collection of processing nodes for your data pipelines." />

            {/* --- Page Header --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4 md:gap-0 px-1">
                <div className="space-y-1.5">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-2xl ring-1 ring-border/50 backdrop-blur-md shadow-sm">
                            <Blocks className="h-6 w-6 text-primary" />
                        </div>
                        Operators
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground font-medium pl-1">
                        The definitive collection of processing nodes for your data pipelines.
                    </p>
                </div>
            </div>

            {/* Library Content */}
            <div className="flex-1 min-h-0 flex flex-col rounded-3xl border border-border/40 bg-background/40 backdrop-blur-xl shadow-xl relative overflow-hidden">
                <OperatorLibrary />
            </div>
        </div>
    );
};

export default OperatorsPage;