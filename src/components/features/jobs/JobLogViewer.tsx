/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useJobLogs } from '@/hooks/useJobLogs';
import {
    Terminal, Play, Pause, Download,
    ArrowDown, Wifi, WifiOff, Search, WrapText, CalendarCheck,
    ListFilter, ChevronUp, ChevronDown, Copy, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface JobLogViewerProps {
    jobId: number | null;
}

const ActionIcon = ({ onClick, title, children, active, className }: { onClick: () => void, title: string, children: React.ReactNode, active?: boolean, className?: string }) => (
    <button
        onClick={onClick}
        className={cn(
            "p-2 rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground hover:bg-muted/30",
            active && "bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary-foreground",
            className
        )}
        title={title}
    >
        {children}
    </button>
);

export const JobLogViewer: React.FC<JobLogViewerProps> = ({ jobId }) => {
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const [wordWrap, setWordWrap] = useState(false);
    const [showTimestamps, setShowTimestamps] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState<string[]>(['INFO', 'ERROR', 'WARNING', 'DEBUG', 'SUCCESS']);
    const [copied, setCopied] = useState(false);

    const { logs, isConnected } = useJobLogs(jobId);
    const scrollViewportRef = useRef<HTMLDivElement>(null);

    // Filtered logs based on search and level
    const filteredLogs = useMemo(() => {
        return logs.filter((log: any) => {
            const levelMatch = levelFilter.includes(log.level || 'INFO');
            const searchMatch = !searchQuery || 
                (log.message && log.message.toLowerCase().includes(searchQuery.toLowerCase()));
            return levelMatch && searchMatch;
        });
    }, [logs, levelFilter, searchQuery]);

    useEffect(() => {
        if (isAutoScroll && scrollViewportRef.current) {
            const viewport = scrollViewportRef.current;
            viewport.scrollTop = viewport.scrollHeight;
        }
    }, [filteredLogs, isAutoScroll]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = target;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

        if (isAtBottom !== isAutoScroll) {
            setIsAutoScroll(isAtBottom);
        }
    };

    const handleDownload = () => {
        const content = filteredLogs.map((log: any) => {
            const timestamp = log.timestamp ? format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS') : '';
            return `${showTimestamps ? `${timestamp} ` : ''}[${log.level || 'INFO'}] ${log.message}`;
        }).join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `job-${jobId || 'latest'}-logs.txt`;
        a.click();
        toast.success("Logs downloaded");
    };

    const handleCopy = () => {
        const content = filteredLogs.map((log: any) => log.message).join('\n');
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Logs copied to clipboard");
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'ERROR': return "text-destructive font-bold";
            case 'WARNING': return "text-warning font-bold";
            case 'SUCCESS': return "text-success font-bold";
            case 'DEBUG': return "text-muted-foreground opacity-70";
            default: return "text-primary font-medium";
        }
    };

    const highlightText = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <>
                {parts.map((part, i) => 
                    part.toLowerCase() === query.toLowerCase() ? 
                    <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5 border-b border-primary/50">{part}</mark> : 
                    part
                )}
            </>
        );
    };

    return (
        <div className="flex flex-col h-full bg-transparent text-foreground font-mono text-sm overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/10 border-b border-border/20 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1.5 opacity-60">
                        <div className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-success/80" />
                    </div>
                    <div className={cn(
                        "flex items-center gap-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                        isConnected 
                            ? "bg-success/10 text-success border-success/20" 
                            : "bg-destructive/10 text-destructive border-destructive/20"
                    )}>
                        {isConnected ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <div className="relative group mr-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                        <Input
                            type="text"
                            placeholder="Search logs..."
                            className="bg-background/30 border border-border/30 rounded-lg pl-7 pr-3 h-7 text-[11px] w-32 focus:w-48 transition-all duration-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/30 hover:text-foreground">
                                <ListFilter className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 glass-card border-border/40">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50">Filter Levels</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'DEBUG'].map((level) => (
                                <DropdownMenuCheckboxItem
                                    key={level}
                                    checked={levelFilter.includes(level)}
                                    onCheckedChange={(checked) => {
                                        setLevelFilter(prev => checked ? [...prev, level] : prev.filter(l => l !== level));
                                    }}
                                    className="text-xs"
                                >
                                    {level}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="w-px h-3 bg-border/20 mx-1" />

                    <ActionIcon onClick={handleCopy} title="Copy Logs" className="h-7 w-7">
                        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </ActionIcon>
                    <ActionIcon onClick={handleDownload} title="Download Logs" className="h-7 w-7">
                        <Download className="h-3.5 w-3.5" />
                    </ActionIcon>
                    <ActionIcon 
                        onClick={() => setWordWrap(!wordWrap)} 
                        title="Toggle Word Wrap"
                        active={wordWrap}
                        className="h-7 w-7"
                    >
                        <WrapText className="h-3.5 w-3.5" />
                    </ActionIcon>
                    <ActionIcon 
                        onClick={() => setShowTimestamps(!showTimestamps)} 
                        title="Toggle Timestamps"
                        active={showTimestamps}
                        className="h-7 w-7"
                    >
                        <CalendarCheck className="h-3.5 w-3.5" />
                    </ActionIcon>
                    <ActionIcon 
                        onClick={() => setIsAutoScroll(!isAutoScroll)} 
                        title={isAutoScroll ? "Disable Auto-scroll" : "Enable Auto-scroll"}
                        active={!isAutoScroll}
                        className="h-7 w-7"
                    >
                        {isAutoScroll ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </ActionIcon>
                </div>
            </div>

            {/* Log Content */}
            <div 
                ref={scrollViewportRef}
                onScroll={handleScroll}
                className={cn(
                    "flex-1 overflow-auto p-4 custom-scrollbar",
                    wordWrap ? "whitespace-pre-wrap" : "whitespace-pre"
                )}
            >
                {filteredLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-4">
                        <Terminal className="h-12 w-12 opacity-20" />
                        <p className="text-sm font-medium">No logs matching filters.</p>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <tbody>
                            {filteredLogs.map((log: any, idx: number) => (
                                <tr key={log.id || idx} className="hover:bg-primary/5 group transition-all duration-200 border-l-2 border-transparent hover:border-primary/40 relative">
                                    <td className="w-12 pr-4 text-right text-muted-foreground/60 select-none border-r border-border/20 text-[10px] align-top py-1.5 font-bold font-mono bg-muted/5 group-hover:text-foreground group-hover:bg-muted/10 transition-colors">
                                        {idx + 1}
                                    </td>
                                    <td className="pl-4 py-1.5 align-top">
                                        <div className="flex gap-3 items-start group-hover:translate-x-0.5 transition-transform duration-200">
                                            {showTimestamps && (
                                                <span className="text-muted-foreground/50 shrink-0 select-none text-[10px] font-mono mt-0.5 group-hover:text-muted-foreground transition-colors">
                                                    {log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss.SSS') : '--:--:--.---'}
                                                </span>
                                            )}
                                            <span className={cn("shrink-0 uppercase text-[9px] w-12 select-none font-bold mt-0.5 group-hover:brightness-110 transition-all", getLevelColor(log.level))}>
                                                [{log.level || 'INFO'}]
                                            </span>
                                            <span className="text-foreground/80 break-all leading-relaxed tracking-tight font-medium group-hover:text-foreground transition-colors">
                                                {highlightText(log.message || '', searchQuery)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer / Status */}
            <div className="px-4 py-1 bg-muted/5 border-t border-border/10 flex items-center justify-between text-[9px] text-muted-foreground/60">
                <div className="flex items-center gap-4">
                    <span>Showing {filteredLogs.length} of {logs.length} lines</span>
                    {searchQuery && (
                        <span className="text-primary font-bold px-1.5 bg-primary/5 rounded border border-primary/10">
                            Search: "{searchQuery}"
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => scrollViewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="hover:text-foreground transition-colors flex items-center gap-1 font-bold uppercase tracking-tighter"
                    >
                        <ChevronUp className="h-3 w-3" /> Top
                    </button>
                    <button 
                        onClick={() => setIsAutoScroll(true)}
                        className="hover:text-foreground transition-colors flex items-center gap-1 font-bold uppercase tracking-tighter"
                    >
                        <ChevronDown className="h-3 w-3" /> Bottom
                    </button>
                </div>
            </div>

            {/* Resume Auto-Scroll Button */}
            {!isAutoScroll && filteredLogs.length > 0 && (
                <button
                    onClick={() => setIsAutoScroll(true)}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2 hover:scale-105 transition-transform"
                >
                    <ArrowDown className="h-3.5 w-3.5" />
                    Resume Auto-scroll
                </button>
            )}
        </div>
    );
};