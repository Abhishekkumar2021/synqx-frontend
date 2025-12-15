import { Skeleton } from '@/components/ui/skeleton';
import { Workflow } from 'lucide-react';

export const LoadingSkeleton = () => (
    <div className="space-y-8 p-4 animate-pulse">
        <div className="flex justify-between items-center mb-10">
            <div className="space-y-3">
                <Skeleton className="h-10 w-64 rounded-xl bg-white/5" />
                <Skeleton className="h-5 w-96 rounded-xl bg-white/5" />
            </div>
            <Skeleton className="h-12 w-40 rounded-full bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-3xl bg-white/5" />
            ))}
        </div>
    </div>
);

export const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 py-20">
        <div className="h-32 w-32 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-white/5 rotate-12">
            <Workflow className="h-16 w-16 opacity-20 -rotate-12" />
        </div>
        <p className="text-2xl font-bold text-foreground">No pipelines found</p>
        <p className="text-base max-w-sm text-center mt-3 leading-relaxed text-muted-foreground">
            Create your first workflow to get started with data processing.
        </p>
    </div>
);
