/* eslint-disable @typescript-eslint/no-explicit-any */

export const ConfigField = ({ label, value }: { label: string, value: any }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
        <div className="text-sm text-foreground font-medium p-3 rounded-md border border-white/5 bg-white/5 glass-input">
            {value || <span className="text-muted-foreground/40 italic">Not set</span>}
        </div>
    </div>
);
