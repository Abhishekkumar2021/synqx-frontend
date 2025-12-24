/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo } from 'react';
import cronstrue from 'cronstrue';
import { Input } from '@/components/ui/input';
import {
    AlertCircle, CheckCircle2,
    Info, CalendarClock, Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
        <div className="flex flex-col gap-6 p-1 relative">
            
            {/* --- Navigation Toggle --- */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20">
                        <CalendarClock className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-sm tracking-tight leading-none uppercase tracking-widest">Schedule</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 mt-1">Recurrence Logic</span>
                    </div>
                </div>
                
                <div className="flex p-1 bg-white/[0.03] backdrop-blur-sm rounded-xl border border-border/40 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setModeOverride('preset')}
                        className={cn(
                            "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                            mode === 'preset' 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        Presets
                    </button>
                    <button
                        type="button"
                        onClick={() => setModeOverride('custom')}
                        className={cn(
                            "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                            mode === 'custom' 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        Advanced
                    </button>
                </div>
            </div>

            <div className="px-1">
                {/* --- PRESET VIEW --- */}
                {mode === 'preset' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                        {PRESETS.map((preset) => (
                            <button
                                type="button"
                                key={preset.label}
                                onClick={() => handlePresetClick(preset.value)}
                                className={cn(
                                    "relative flex flex-col items-start p-5 rounded-[1.5rem] border text-left transition-all duration-300 outline-none group overflow-hidden",
                                    value === preset.value
                                        ? "bg-primary/[0.08] border-primary/40 ring-1 ring-primary/20 shadow-xl"
                                        : "bg-white/[0.02] border-white/5 hover:border-primary/30 hover:bg-white/[0.05]"
                                )}
                            >
                                {value === preset.value && (
                                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 blur-3xl rounded-full" />
                                )}

                                <div className="flex justify-between w-full mb-1.5 relative z-10">
                                    <span className={cn("text-xs font-black uppercase tracking-widest", value === preset.value ? "text-primary" : "text-foreground/80")}>
                                        {preset.label}
                                    </span>
                                    {value === preset.value && (
                                        <CheckCircle2 className="h-4 w-4 text-primary animate-in zoom-in duration-500" />
                                    )}
                                </div>
                                <span className="text-[10px] text-muted-foreground/60 font-bold tracking-tight mb-4 line-clamp-1 relative z-10">{preset.desc}</span>
                                <code className={cn(
                                    "text-[10px] px-2.5 py-1 rounded-lg font-mono font-bold transition-all relative z-10",
                                    value === preset.value ? "bg-primary/20 text-primary ring-1 ring-primary/30" : "bg-black/40 text-muted-foreground/40 border border-white/5"
                                )}>
                                    {preset.value}
                                </code>
                            </button>
                        ))}
                        
                        <button 
                            type="button"
                            onClick={() => setModeOverride('custom')}
                            className="flex flex-col items-center justify-center p-5 rounded-[1.5rem] border border-dashed border-white/10 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/[0.02] transition-all gap-3 group"
                        >
                            <div className="p-2 rounded-xl bg-white/[0.02] group-hover:bg-primary/10 transition-colors">
                                <Settings2 className="h-5 w-5 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">Custom Definition</span>
                        </button>
                    </div>
                )}

                {/* --- CUSTOM VIEW --- */}
                {mode === 'custom' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Cron Expression</Label>
                            <div className="relative group">
                                <Input
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    className={cn(
                                        "font-mono text-center tracking-[0.3em] text-xl h-16 rounded-2xl bg-white/2 border border-border/40 shadow-inner placeholder:opacity-30 focus:ring-1 focus:ring-white/10 transition-all pr-10",
                                        isValid && "border-emerald-500/40 focus:border-emerald-500/60 focus:ring-emerald-500/5 text-emerald-500",
                                        !isValid && value && "border-destructive/40 focus:border-destructive/60 focus:ring-destructive/5 text-destructive"
                                    )}
                                    placeholder="* * * * *"
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                    {isValid ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 opacity-60" />
                                    ) : value ? (
                                        <AlertCircle className="h-5 w-5 text-destructive animate-pulse" />
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                            <CronSlot label="Min" value={parts.min} />
                            <CronSlot label="Hour" value={parts.hour} />
                            <CronSlot label="Day" value={parts.day} />
                            <CronSlot label="Mon" value={parts.month} />
                            <CronSlot label="Wk" value={parts.week} />
                        </div>

                        <div className="rounded-[1.5rem] bg-white/[0.02] border border-border/40 p-6 shadow-inner relative overflow-hidden">
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
                            <div className="flex items-center gap-2 mb-4 text-muted-foreground relative z-10">
                                <div className="p-1 rounded-md bg-primary/10">
                                    <Info className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/80">Reference Syntax</span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-10 text-[10px] font-bold text-muted-foreground/60 relative z-10">
                                <div className="flex justify-between items-center border-b border-white/[0.03] pb-1.5">
                                    <code className="text-primary/60 font-black">*</code> 
                                    <span className="opacity-80">Wildcard</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/[0.03] pb-1.5">
                                    <code className="text-primary/60 font-black">,</code> 
                                    <span className="opacity-80">List</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/[0.03] pb-1.5">
                                    <code className="text-primary/60 font-black">-</code> 
                                    <span className="opacity-80">Range</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/[0.03] pb-1.5">
                                    <code className="text-primary/60 font-black">/</code> 
                                    <span className="opacity-80">Steps</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={cn(
                "px-6 py-4 border border-border/40 bg-black/20 backdrop-blur-md flex items-center justify-between rounded-2xl shadow-xl transition-all duration-500 ring-1 ring-white/5",
                isValid ? "bg-emerald-500/[0.03] border-emerald-500/10" : value ? "bg-destructive/[0.03] border-destructive/10" : ""
            )}>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Translation</span>
                    <div className="h-3 w-px bg-white/10" />
                    <span className={cn(
                        "text-[11px] font-black tracking-tight",
                        isValid ? "text-foreground opacity-90" : "text-destructive/80 italic"
                    )}>
                        {humanReadable}
                    </span>
                </div>
                {isValid && (
                    <Badge variant="outline" className="text-[8px] font-black border-emerald-500/20 text-emerald-500 bg-emerald-500/5">SYNCED</Badge>
                )}
            </div>
        </div>
    );
};

const CronSlot = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col items-center gap-2 group">
        <div className="w-full aspect-[4/5] flex items-center justify-center rounded-xl bg-background/40 border border-border/40 shadow-inner font-mono text-sm sm:text-base font-black text-foreground transition-all group-hover:border-primary/30 group-hover:shadow-[0_0_15px_-5px_rgba(var(--primary),0.3)] ring-1 ring-white/5 backdrop-blur-sm">
            {value}
        </div>
        <span className="text-[8px] uppercase font-black text-muted-foreground/40 tracking-[0.1em]">{label}</span>
    </div>
);