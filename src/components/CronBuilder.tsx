import React, { useState, useMemo } from 'react';
import cronstrue from 'cronstrue';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Clock, AlertCircle, CheckCircle2,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CronBuilderProps {
    value: string;
    onChange: (value: string) => void;
}

const PRESETS = [
    { label: "Every Minute", value: "* * * * *", desc: "Runs every 60 seconds" },
    { label: "Hourly", value: "0 * * * *", desc: "At minute 0 past every hour" },
    { label: "Daily", value: "0 0 * * *", desc: "At 00:00 every day" },
    { label: "Weekly", value: "0 0 * * 0", desc: "At 00:00 on Sunday" },
    { label: "Business Hours", value: "0 9-17 * * 1-5", desc: "Hourly, 9-5, Mon-Fri" },
];

export const CronBuilder: React.FC<CronBuilderProps> = ({ value, onChange }) => {
    // --- 1. DERIVE MODE ---
    // Instead of state + effect, we can just check if the current value matches a preset.
    // If the user explicitly clicks "Advanced", we can store that preference in a local state override.
    const [userModeOverride, setUserModeOverride] = useState<'preset' | 'custom' | null>(null);

    const isMatchingPreset = PRESETS.some(p => p.value === value);

    // Logic: If user clicked a mode button, respect it. 
    // Otherwise, if value matches a preset, show Presets. If not, show Custom.
    const mode = userModeOverride || (isMatchingPreset || !value ? 'preset' : 'custom');

    // --- 2. DERIVED DATA (No useEffect) ---
    const { humanReadable, isValid } = useMemo(() => {
        let hr = '';
        let valid = true;
        try {
            hr = cronstrue.toString(value, { use24HourTimeFormat: true });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            valid = false;
            hr = '';
        }
        return { humanReadable: hr, isValid: valid };
    }, [value]);

    const handlePresetClick = (val: string) => {
        onChange(val);
        setUserModeOverride('preset'); // User explicitly chose a preset
    };

    const handleCustomChange = (val: string) => {
        onChange(val);
        // If they type something that happens to match a preset, we usually still stay in custom mode
        // unless they explicitly switch back.
    };

    return (
        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
            {/* Header / Mode Switcher */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Schedule</span>
                </div>
                <div className="flex p-1 bg-muted rounded-lg h-8">
                    <button
                        onClick={() => setUserModeOverride('preset')}
                        className={cn(
                            "px-3 text-xs font-medium rounded-md transition-all",
                            mode === 'preset' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Presets
                    </button>
                    <button
                        onClick={() => setUserModeOverride('custom')}
                        className={cn(
                            "px-3 text-xs font-medium rounded-md transition-all",
                            mode === 'custom' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Advanced
                    </button>
                </div>
            </div>

            {/* --- PRESET MODE --- */}
            {mode === 'preset' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200">
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => handlePresetClick(preset.value)}
                            className={cn(
                                "relative flex flex-col items-start p-3 rounded-lg border text-left transition-all hover:border-primary/50 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                value === preset.value
                                    ? "bg-primary/5 border-primary shadow-sm"
                                    : "bg-background border-border"
                            )}
                        >
                            <div className="flex justify-between w-full mb-1">
                                <span className={cn("text-sm font-medium", value === preset.value ? "text-primary" : "text-foreground")}>
                                    {preset.label}
                                </span>
                                {value === preset.value && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                            <span className="text-xs text-muted-foreground">{preset.desc}</span>
                            <code className="mt-2 text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                {preset.value}
                            </code>
                        </button>
                    ))}
                </div>
            )}

            {/* --- CUSTOM MODE --- */}
            {mode === 'custom' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                        <Input
                            value={value}
                            onChange={(e) => handleCustomChange(e.target.value)}
                            className={cn(
                                "font-mono text-center tracking-widest text-lg h-12",
                                !isValid ? "border-destructive focus-visible:ring-destructive" : ""
                            )}
                            placeholder="* * * * *"
                        />
                        {/* Validation Icon */}
                        <div className="absolute right-3 top-3.5">
                            {isValid ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 opacity-50" />
                            ) : (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertCircle className="h-5 w-5 text-destructive cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left">
                                            <p>Invalid Cron Expression format</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>

                    {/* Syntax Helper */}
                    <div className="grid grid-cols-5 gap-1 text-center">
                        <CronPart label="Min" value={value?.split(' ')[0] || '-'} />
                        <CronPart label="Hour" value={value?.split(' ')[1] || '-'} />
                        <CronPart label="Day" value={value?.split(' ')[2] || '-'} />
                        <CronPart label="Month" value={value?.split(' ')[3] || '-'} />
                        <CronPart label="Week" value={value?.split(' ')[4] || '-'} />
                    </div>

                    <div className="rounded-md bg-muted/50 p-3 flex items-start gap-3 text-sm">
                        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <p className="font-medium text-foreground">Cheat Sheet</p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground">
                                <span><code className="text-foreground">*</code> Any value</span>
                                <span><code className="text-foreground">,</code> Value list separator</span>
                                <span><code className="text-foreground">-</code> Range of values</span>
                                <span><code className="text-foreground">/</code> Step values</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- FOOTER: Human Readable --- */}
            <div className="pt-2 border-t mt-2">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Runs:</span>
                    <Badge variant={isValid ? "secondary" : "destructive"} className="font-normal px-2.5 py-0.5">
                        {isValid ? humanReadable : "Invalid Expression"}
                    </Badge>
                </div>
            </div>
        </div>
    );
};

// Helper component for the visual breakdown
const CronPart = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col items-center gap-1">
        <div className="h-8 w-full flex items-center justify-center rounded bg-muted/30 font-mono text-sm border border-border/50">
            {value}
        </div>
        <span className="text-[10px] uppercase font-bold text-muted-foreground">{label}</span>
    </div>
);