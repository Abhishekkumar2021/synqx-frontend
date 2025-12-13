/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { useJobLogs } from '../hooks/useJobLogs';
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
            !hideControls && "p-6 max-w-6xl mx-auto gap-6"
        )}>

            {/* --- External Controls --- */}
            {!hideControls && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card border border-border/60 p-4 rounded-xl shadow-sm gap-4 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Terminal className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-card-foreground">Live Log Stream</h1>
                            <p className="text-xs text-muted-foreground">Real-time execution output via WebSocket</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={jobIdInput}
                                onChange={(e) => setJobIdInput(e.target.value)}
                                className="w-40 pl-9 h-9 font-mono text-sm bg-background/50"
                                placeholder="Job ID"
                            />
                        </div>
                        <Button onClick={handleConnect} size="sm" className="h-9 font-medium shadow-md">
                            {isConnected ? 'Reconnect' : 'Connect'}
                        </Button>
                    </div>
                </div>
            )}

            {/* --- The Terminal Window --- */}
            <div className={cn(
                "flex flex-col overflow-hidden relative group transition-all duration-300",
                // Light Mode: White background, subtle border, soft shadow
                // Dark Mode: Zinc-950 background (Terminal black), dark border
                "bg-white dark:bg-zinc-950 text-slate-700 dark:text-slate-300",
                !hideControls ? "rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xl h-[600px]" : "h-full border-none"
            )}>

                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-2 shrink-0 select-none
                        bg-slate-50/80 dark:bg-zinc-900/80 
                        border-b border-slate-200 dark:border-zinc-800 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        {/* Window Controls (Mac Style) */}
                        <div className="flex gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                            <div className="w-3 h-3 rounded-full bg-red-400/80 border border-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-amber-400/80 border border-amber-500/50" />
                            <div className="w-3 h-3 rounded-full bg-emerald-400/80 border border-emerald-500/50" />
                        </div>

                        {/* Status Pill */}
                        <div className={cn(
                            "flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border shadow-sm",
                            isConnected
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                        )}>
                            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                            <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
                        </div>
                    </div>

                    {/* In-Terminal Actions */}
                    <div className="flex items-center gap-1">
                        <div className="relative mr-2">
                            <input
                                className="bg-transparent border-b border-slate-300 dark:border-zinc-700 
                                   text-xs text-slate-700 dark:text-zinc-300 
                                   focus:border-primary outline-none w-32 py-0.5 
                                   placeholder:text-slate-400 dark:placeholder:text-zinc-600 
                                   transition-all focus:w-48"
                                placeholder="Grep logs..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                        <ActionIcon
                            onClick={() => setIsAutoScroll(!isAutoScroll)}
                            title={isAutoScroll ? "Pause Scroll" : "Resume Scroll"}
                        >
                            {isAutoScroll ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </ActionIcon>
                        <ActionIcon onClick={handleDownload} title="Download Output">
                            <Download className="h-3.5 w-3.5" />
                        </ActionIcon>
                    </div>
                </div>

                {/* Log Content Area */}
                <div
                    className="flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm custom-scrollbar scroll-smooth"
                    ref={scrollViewportRef}
                    onScroll={handleScroll}
                >
                    {filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3">
                            {isConnected ? (
                                <>
                                    <div className="h-8 w-8 border-2 border-slate-200 dark:border-zinc-800 border-t-primary rounded-full animate-spin" />
                                    <span className="animate-pulse">Waiting for output...</span>
                                </>
                            ) : (
                                <>
                                    <Terminal className="h-10 w-10 opacity-20" />
                                    <span>No logs to display.</span>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            {filteredLogs.map((log, idx) => (
                                <div key={log.id || idx} className="flex gap-3 hover:bg-slate-100 dark:hover:bg-white/5 p-0.5 rounded px-2 transition-colors group/line">

                                    {/* Timestamp */}
                                    <span className="text-slate-400 dark:text-zinc-500 shrink-0 select-none min-w-20">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>

                                    {/* Level */}
                                    <span className={cn(
                                        "font-bold shrink-0 w-[50px] select-none text-[10px] pt-0.5 uppercase tracking-wider",
                                        // Adjusted colors for readability on both Light (White) and Dark (Black) backgrounds
                                        {
                                            'text-blue-600 dark:text-cyan-400': log.level === 'INFO',
                                            'text-amber-600 dark:text-amber-400': log.level === 'WARNING' || log.level === 'WARN',
                                            'text-red-600 dark:text-rose-500': log.level === 'ERROR',
                                            'text-slate-500 dark:text-zinc-500': log.level === 'DEBUG',
                                        }
                                    )}>
                                        {log.level}
                                    </span>

                                    {/* Message */}
                                    <span className={cn(
                                        "break-all whitespace-pre-wrap flex-1",
                                        // Light mode: Dark slate text. Dark mode: Light zinc text.
                                        log.level === 'ERROR'
                                            ? "text-red-700 dark:text-rose-200"
                                            : "text-slate-700 dark:text-zinc-300"
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
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-in slide-in-from-bottom-2 fade-in">
                        <Button
                            size="sm"
                            onClick={() => setIsAutoScroll(true)}
                            className="h-8 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 gap-2 text-xs font-semibold hover:scale-105 transition-transform"
                        >
                            <ArrowDown className="h-3 w-3 animate-bounce" />
                            Resume
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper component for cleaner code
const ActionIcon = ({ onClick, title, children }: { onClick: () => void, title: string, children: React.ReactNode }) => (
    <button
        onClick={onClick}
        className="p-1.5 rounded-md transition-colors
                   text-slate-500 hover:text-slate-900 hover:bg-slate-200 
                   dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/10"
        title={title}
    >
        {children}
    </button>
);