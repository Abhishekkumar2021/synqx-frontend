import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Clock } from 'lucide-react';

interface CronBuilderProps {
    value: string;
    onChange: (value: string) => void;
}

// Simple presets for better UX
const PRESETS = [
    { label: "Every Minute", value: "* * * * *" },
    { label: "Hourly", value: "0 * * * *" },
    { label: "Daily (Midnight)", value: "0 0 * * *" },
    { label: "Weekly (Sunday)", value: "0 0 * * 0" },
    { label: "Monthly (1st)", value: "0 0 1 * *" },
];

export const CronBuilder: React.FC<CronBuilderProps> = ({ value, onChange }) => {
    const [mode, setMode] = useState<'preset' | 'custom'>('preset');
    const [customValue, setCustomValue] = useState(value || "* * * * *");

    useEffect(() => {
        if (value) {
            setCustomValue(value);
            const isPreset = PRESETS.some(p => p.value === value);
            setMode(isPreset ? 'preset' : 'custom');
        }
    }, [value]);

    const handlePresetClick = (presetValue: string) => {
        setCustomValue(presetValue);
        onChange(presetValue);
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomValue(e.target.value);
        onChange(e.target.value);
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
                <Button 
                    variant={mode === 'preset' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setMode('preset')}
                    className="text-xs"
                >
                    Presets
                </Button>
                <Button 
                    variant={mode === 'custom' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setMode('custom')}
                    className="text-xs"
                >
                    Custom Expression
                </Button>
            </div>

            {mode === 'preset' ? (
                <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((preset) => (
                        <div 
                            key={preset.label}
                            onClick={() => handlePresetClick(preset.value)}
                            className={`
                                cursor-pointer border rounded-md p-3 hover:border-primary/50 transition-all flex items-center justify-between
                                ${value === preset.value ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card'}
                            `}
                        >
                            <span className="text-sm font-medium">{preset.label}</span>
                            {value === preset.value && <Clock className="h-3 w-3 text-primary" />}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Input 
                            value={customValue}
                            onChange={handleCustomChange}
                            placeholder="* * * * *"
                            className="font-mono"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Format: <span className="font-mono bg-muted px-1 rounded">Min Hour Day Month DayOfWeek</span>
                    </p>
                    <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="font-mono text-[10px]">*/5 * * * * (Every 5m)</Badge>
                        <Badge variant="outline" className="font-mono text-[10px]">0 9-17 * * 1-5 (Business Hours)</Badge>
                    </div>
                </div>
            )}
            
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                <span>Current Schedule:</span>
                <Badge variant="secondary" className="font-mono">{value || "Not scheduled"}</Badge>
            </div>
        </div>
    );
};
