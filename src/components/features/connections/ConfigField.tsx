import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Copy, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ConfigFieldProps {
    label: string;
    value: string | number | null | undefined | React.ReactNode;
    copyable?: boolean;
    sensitive?: boolean;
    className?: string;
}

export const ConfigField = ({
    label,
    value,
    copyable = false,
    sensitive = false,
    className
}: ConfigFieldProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(String(value));
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn("space-y-1.5 group", className)}>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-0.5">
                {label}
            </label>
            <div className={cn(
                "relative flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 p-3 text-sm font-medium transition-all duration-200",
                "hover:border-primary/20 hover:bg-muted/30",
                sensitive && "font-mono tracking-widest"
            )}>
                <span className="truncate text-foreground/90 pr-8">
                    {value ?? <span className="italic text-muted-foreground/50">Not set</span>}
                </span>

                <div className="flex items-center gap-2 absolute right-2">
                    {sensitive && <Lock className="h-3.5 w-3.5 text-muted-foreground/70" />}

                    {copyable && value && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                            className={cn(
                                "h-7 w-7 transition-all duration-200",
                                copied ? "opacity-100 bg-emerald-500/10" : "opacity-0 group-hover:opacity-100 hover:bg-background"
                            )}
                        >
                            {copied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};