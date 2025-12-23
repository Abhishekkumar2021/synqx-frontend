import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Lock, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ConfigFieldProps {
    label: string;
    value: React.ReactNode;
    sensitive?: boolean;
    copyable?: boolean;
}

export const ConfigField: React.FC<ConfigFieldProps> = ({ label, value, sensitive = false, copyable = false }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (typeof value === 'string') {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("Copied to clipboard");
        }
    };

    return (
        <div className="space-y-1.5 group">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-primary">{label}</label>
            <div className={cn(
                "text-sm font-medium p-3 rounded-lg border border-border/50 bg-muted/30 flex items-center justify-between transition-all duration-300",
                "group-hover:border-primary/30 group-hover:bg-muted/50",
                sensitive && "font-mono tracking-widest"
            )}>
                <span className="truncate">{value}</span>
                <div className="flex items-center gap-2">
                    {sensitive && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    {copyable && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleCopy}
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
