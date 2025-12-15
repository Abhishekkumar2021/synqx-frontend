/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { useJobLogs } from '@/hooks/useJobLogs'; 
import {
    Terminal, Play, Pause, Download,
    ArrowDown, Wifi, WifiOff, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface JobLogViewerProps {
    initialJobId?: number | null;
    hideControls?: boolean;
}

export const JobLogViewer: React.FC<JobLogViewerProps> = ({ initialJobId = null, hideControls = false }) => {
    const [jobIdInput, setJobIdInput] = useState<string>('1');
    const [activeJobId, setActiveJobId] = useState<number | null>(initialJobId);
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const [filter, setFilter] = useState('');

    const { logs, isConnected } = useJobLogs(activeJobId);
    const scrollViewportRef = useRef<HTMLDivElement>(null);

    // Sync props to state
    useEffect(() => {
        if (initialJobId) {
            setActiveJobId(initialJobId);
            setJobIdInput(initialJobId.toString());
        }
    }, [initialJobId]);

    // Smart Auto-Scroll Logic
    useEffect(() => {
        if (isAutoScroll && scrollViewportRef.current) {
            const viewport = scrollViewportRef.current;
            setTimeout(() => {
                viewport.scrollTop = viewport.scrollHeight;
            }, 10);
        }
    }, [logs, isAutoScroll]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = target;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        if (isAtBottom !== isAutoScroll) {
            setIsAutoScroll(isAtBottom);
        }
    };

    const handleConnect = () => {
        const id = parseInt(jobIdInput, 10);
        if (!isNaN(id)) setActiveJobId(id);
    };

    const handleDownload = () => {
        const content = logs.map(l => `[${l.timestamp}] ${l.level}: ${l.message}`).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `job-${activeJobId}-logs.txt`;
        a.click();
        toast.success("Logs downloaded");
    };

    const filteredLogs = logs.filter(l =>
        l.message.toLowerCase().includes(filter.toLowerCase()) ||
        l.level.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className={cn(
            "w-full h-full flex flex-col font-sans transition-colors duration-300",
            !hideControls && "p-8 max-w-7xl mx-auto gap-8"
        )}>

            {/* --- External Controls --- */}
            {!hideControls && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-card p-5 gap-6 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-2xl text-primary ring-1 ring-primary/20 shadow-[0_0_15px_-5px_var(--color-primary)]">
                            <Terminal className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Live Log Stream</h1>
                            <p className="text-xs font-medium text-muted-foreground/80 mt-0.5">Real-time execution output via WebSocket</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                value={jobIdInput}
                                onChange={(e) => setJobIdInput(e.target.value)}
                                className="w-48 pl-10 h-10 font-mono text-sm glass-input rounded-xl"
                                placeholder="Job ID"
                            />
                        </div>
                        <Button onClick={handleConnect} size="sm" className="h-10 px-6 font-semibold shadow-lg shadow-primary/20 rounded-xl">
                            {isConnected ? 'Reconnect' : 'Connect'}
                        </Button>
                    </div>
                </div>
            )}

            {/* --- The Terminal Window --- */}
            <div className={cn(
                "flex flex-col overflow-hidden relative group transition-all duration-300",
                "bg-black text-gray-300 dark:bg-[#09090b] dark:text-gray-300", // Keep terminal dark, adjust text
                !hideControls ? "rounded-[2.5rem] border border-white/10 shadow-2xl h-[650px]" : "h-full border-none"
            )}>

                {/* Terminal Header */}
                <div className="flex items-center justify-between px-5 py-3 shrink-0 select-none
                        bg-white/5 dark:bg-white/[0.03] 
                        border-b border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-5">
                        {/* Window Controls (Mac Style) */}
                        <div className="flex gap-2 opacity-80 hover:opacity-100 transition-opacity">
                            <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] border border-[#e0443e] shadow-sm" />
                            <div className="w-3.5 h-3.5 rounded-full bg-[#febc2e] border-[#d89e24] shadow-sm" />
                            <div className="w-3.5 h-3.5 rounded-full bg-[#28c840] border-[#1aab29] shadow-sm" />
                        </div>

                        {/* Status Pill */}
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shadow-sm transition-all duration-500",
                            isConnected
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_-4px_var(--color-emerald-500)]"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                            {isConnected ? <Wifi className="h-3 w-3 animate-pulse" /> : <WifiOff className="h-3 w-3" />}
                            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                        </div>
                    </div>

                    {/* In-Terminal Actions */}
                    <div className="flex items-center gap-2">
                        <div className="relative mr-3">
                            <input
                                className="bg-transparent border-b border-white/10 
                                   text-xs text-zinc-300 
                                   focus:border-primary outline-none w-32 py-1
                                   placeholder:text-zinc-600 font-mono
                                   transition-all focus:w-56"
                                placeholder="grep logs..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                        <ActionIcon
                            onClick={() => setIsAutoScroll(!isAutoScroll)}
                            title={isAutoScroll ? "Pause Scroll" : "Resume Scroll"}
                            active={!isAutoScroll}
                        >
                            {isAutoScroll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </ActionIcon>
                        <ActionIcon onClick={handleDownload} title="Download Output">
                            <Download className="h-4 w-4" />
                        </ActionIcon>
                    </div>
                </div>

                {/* Log Content Area */}
                <div
                    className="flex-1 overflow-y-auto p-5 font-mono text-xs md:text-sm custom-scrollbar scroll-smooth"
                    ref={scrollViewportRef}
                    onScroll={handleScroll}
                >
                    {filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50">
                            {isConnected ? (
                                <>
                                    <div className="h-10 w-10 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
                                    <span className="animate-pulse font-medium">Waiting for log stream...</span>
                                </>
                            ) : (
                                <>
                                    <Terminal className="h-12 w-12 opacity-30" />
                                    <span className="font-medium">No logs to display.</span>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {filteredLogs.map((log, idx) => (
                                <div key={log.id || idx} className="flex gap-4 hover:bg-white/[0.04] p-1 rounded-lg px-3 transition-colors group/line items-start">

                                    {/* Timestamp */}
                                    <span className="text-muted-foreground/50 dark:text-zinc-500 shrink-0 select-none min-w-[85px] pt-[1px]">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>

                                    {/* Level */}
                                    <span className={cn(
                                        "font-bold shrink-0 w-[60px] select-none text-[10px] pt-0.5 uppercase tracking-wider text-center rounded-md h-5 flex items-center justify-center",
                                        {
                                            'bg-blue-500/10 text-blue-600 dark:text-blue-400': log.level === 'INFO',
                                            'bg-amber-500/10 text-amber-600 dark:text-amber-400': log.level === 'WARNING' || log.level === 'WARN',
                                            'bg-rose-500/10 text-rose-600 dark:text-rose-400': log.level === 'ERROR',
                                            'bg-zinc-200/50 text-zinc-600 dark:bg-zinc-500/10 dark:text-zinc-400': log.level === 'DEBUG',
                                        }
                                    )}>
                                        {log.level}
                                    </span>

                                    {/* Message */}
                                    <span className={cn(
                                        "break-all whitespace-pre-wrap flex-1 leading-relaxed",
                                        log.level === 'ERROR'
                                            ? "text-rose-600 dark:text-rose-200"
                                            : "text-foreground dark:text-zinc-300"
                                    )}>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Floating "Resume Scroll" Button */}
                {!isAutoScroll && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-in slide-in-from-bottom-4 fade-in">
                        <Button
                            size="sm"
                            onClick={() => setIsAutoScroll(true)}
                            className="h-9 rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_-5px_var(--color-primary)] gap-2 text-xs font-bold hover:scale-105 transition-transform px-5"
                        >
                            <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
                            Resume Auto-Scroll
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper component for cleaner code
const ActionIcon = ({ onClick, title, children, active }: { onClick: () => void, title: string, children: React.ReactNode, active?: boolean }) => (
    <button
        onClick={onClick}
        className={cn(
            "p-2 rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground hover:bg-white/10",
            active && "bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary-foreground"
        )}
        title={title}
    >
        {children}
    </button>
);