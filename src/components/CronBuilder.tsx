/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo } from 'react';
import cronstrue from 'cronstrue';
import { Input } from '@/components/ui/input';
import {
    AlertCircle, CheckCircle2,
    Info, CalendarClock, Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from '@/components/ui/label';

interface CronBuilderProps {
    value: string;
    onChange: (value: string) => void;
}

const PRESETS = [
    { label: "Every Minute", value: "* * * * *", desc: "Runs every 60 seconds" },
    { label: "Hourly", value: "0 * * * *", desc: "At the start of every hour" },
    { label: "Daily", value: "0 0 * * *", desc: "Every day at midnight" },
    { label: "Weekly", value: "0 0 * * 0", desc: "Every Sunday at midnight" },
    { label: "Work Hours", value: "0 9-17 * * 1-5", desc: "Hourly, 9 AM - 5 PM, Mon-Fri" },
    { label: "Monthly", value: "0 0 1 * *", desc: "First day of every month" },
];

export const CronBuilder: React.FC<CronBuilderProps> = ({ value, onChange }) => {
    // Determine mode based on whether current value matches a preset
    // We use a local override so user can force "Custom" view even if value matches a preset
    const [modeOverride, setModeOverride] = useState<'preset' | 'custom' | null>(null);

    const isMatchingPreset = useMemo(() => PRESETS.some(p => p.value === value), [value]);
    const mode = modeOverride || (isMatchingPreset || !value ? 'preset' : 'custom');

    const { humanReadable, isValid, parts } = useMemo(() => {
        let hr = 'Invalid Cron Expression';
        let valid = false;
        const p = value ? value.split(' ') : [];
        
        try {
            if (value) {
                hr = cronstrue.toString(value, { use24HourTimeFormat: true });
                valid = true;
            }
        } catch (e) {
            valid = false;
        }

        return { 
            humanReadable: hr, 
            isValid: valid,
            parts: {
                min: p[0] || '*',
                hour: p[1] || '*',
                day: p[2] || '*',
                month: p[3] || '*',
                week: p[4] || '*'
            }
        };
    }, [value]);

    const handlePresetClick = (val: string) => {
        onChange(val);
        setModeOverride('preset');
    };

    return (
        <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card/50 p-1 shadow-sm">
            
            {/* --- Header / Tabs --- */}
            <div className="flex items-center justify-between p-3 pb-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                        <CalendarClock className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm">Schedule</span>
                </div>
                
                <div className="flex p-1 bg-muted/50 rounded-lg border border-border/50">
                    <button
                        onClick={() => setModeOverride('preset')}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all duration-200",
                            mode === 'preset' 
                                ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Presets
                    </button>
                    <button
                        onClick={() => setModeOverride('custom')}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all duration-200",
                            mode === 'custom' 
                                ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Advanced
                    </button>
                </div>
            </div>

            <div className="p-4 pt-2">
                {/* --- PRESET VIEW --- */}
                {mode === 'preset' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => handlePresetClick(preset.value)}
                                className={cn(
                                    "relative flex flex-col items-start p-3 rounded-lg border text-left transition-all duration-200 outline-none group",
                                    value === preset.value
                                        ? "bg-primary/5 border-primary/50 shadow-[0_0_15px_-5px_var(--color-primary)]"
                                        : "bg-background/50 border-border/50 hover:border-primary/30 hover:bg-muted/30"
                                )}
                            >
                                <div className="flex justify-between w-full mb-1">
                                    <span className={cn("text-sm font-medium", value === preset.value ? "text-primary" : "text-foreground")}>
                                        {preset.label}
                                    </span>
                                    {value === preset.value && (
                                        <CheckCircle2 className="h-4 w-4 text-primary animate-in zoom-in duration-300" />
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground mb-2">{preset.desc}</span>
                                <code className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors",
                                    value === preset.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    {preset.value}
                                </code>
                            </button>
                        ))}
                        
                        {/* "Go Custom" hint if they want more control */}
                        <button 
                            onClick={() => setModeOverride('custom')}
                            className="flex flex-col items-center justify-center p-3 rounded-lg border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all gap-2"
                        >
                            <Settings2 className="h-5 w-5" />
                            <span className="text-xs font-medium">Create Custom Schedule</span>
                        </button>
                    </div>
                )}

                {/* --- CUSTOM VIEW --- */}
                {mode === 'custom' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                        
                        {/* Input Area */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cron Expression</Label>
                            <div className="relative group">
                                <Input
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    className={cn(
                                        "font-mono text-center tracking-widest text-lg h-14 bg-background/50 border-border/50 transition-all",
                                        isValid 
                                            ? "focus-visible:ring-primary/30 focus-visible:border-primary/50" 
                                            : "border-destructive/50 focus-visible:ring-destructive/30 text-destructive"
                                    )}
                                    placeholder="* * * * *"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {isValid ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 opacity-80" />
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-emerald-500 text-white border-0">Valid Format</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <AlertCircle className="h-5 w-5 text-destructive animate-pulse" />
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-destructive text-white border-0">Invalid Cron Format</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Visual Breakdown Slots */}
                        <div className="grid grid-cols-5 gap-2">
                            <CronSlot label="Minute" value={parts.min} />
                            <CronSlot label="Hour" value={parts.hour} />
                            <CronSlot label="Day (Mo)" value={parts.day} />
                            <CronSlot label="Month" value={parts.month} />
                            <CronSlot label="Day (Wk)" value={parts.week} />
                        </div>

                        {/* Cheat Sheet */}
                        <div className="rounded-lg bg-muted/30 border border-border/50 p-4">
                            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                                <Info className="h-4 w-4 text-primary" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Quick Reference</span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-xs text-muted-foreground">
                                <div className="flex justify-between"><span><code>*</code></span> <span>Any value</span></div>
                                <div className="flex justify-between"><span><code>,</code></span> <span>Value separator</span></div>
                                <div className="flex justify-between"><span><code>-</code></span> <span>Range (e.g. 1-5)</span></div>
                                <div className="flex justify-between"><span><code>/</code></span> <span>Step (e.g. */5)</span></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Footer Status --- */}
            <div className={cn(
                "px-4 py-3 border-t border-border/50 bg-muted/10 flex items-center justify-between rounded-b-xl transition-colors",
                isValid ? "bg-emerald-500/5" : "bg-destructive/5"
            )}>
                <span className="text-xs font-medium text-muted-foreground">Summary:</span>
                <span className={cn(
                    "text-xs font-semibold",
                    isValid ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                )}>
                    {humanReadable}
                </span>
            </div>
        </div>
    );
};

// Helper for the digital-clock style slots
const CronSlot = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col items-center gap-1.5">
        <div className="w-full aspect-square flex items-center justify-center rounded-lg bg-background border border-border/60 shadow-inner font-mono text-sm sm:text-base font-medium text-foreground transition-all hover:border-primary/40 hover:shadow-primary/5">
            {value}
        </div>
        <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-tight">{label}</span>
    </div>
);