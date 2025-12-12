/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { useJobLogs } from '../hooks/useJobLogs';
import { 
    Terminal, Play, Pause, Download, 
    ArrowDown, Wifi, WifiOff, Search} from 'lucide-react';
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
        // Small timeout to ensure DOM is updated
        setTimeout(() => {
            viewport.scrollTop = viewport.scrollHeight;
        }, 10);
    }
  }, [logs, isAutoScroll]);

  // Detect user scroll to pause auto-scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;
      
      // If user is near bottom (within 50px), enable auto-scroll. Otherwise disable.
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
        "w-full h-full flex flex-col font-sans",
        !hideControls && "p-6 max-w-6xl mx-auto gap-6"
    )}>
      
      {/* --- External Controls (Only if not hidden) --- */}
      {!hideControls && (
        <div className="flex items-center justify-between bg-card border border-border/50 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Terminal className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight">Live Log Stream</h1>
                    <p className="text-xs text-muted-foreground">Real-time execution output via WebSocket</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        value={jobIdInput} 
                        onChange={(e) => setJobIdInput(e.target.value)}
                        className="w-40 pl-9 h-9 font-mono text-sm"
                        placeholder="Job ID"
                    />
                </div>
                <Button onClick={handleConnect} size="sm" className="h-9 shadow-primary/20 shadow-lg">
                    {isConnected ? 'Reconnect' : 'Connect'}
                </Button>
            </div>
        </div>
      )}

      {/* --- The Terminal Window --- */}
      <div className={cn(
          "flex flex-col overflow-hidden bg-[#09090b] text-gray-300 relative group transition-all",
          !hideControls ? "rounded-xl border border-border/50 shadow-2xl h-[600px]" : "h-full border-none"
      )}>
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#18181b] border-b border-[#27272a] shrink-0 select-none">
            <div className="flex items-center gap-4">
                {/* Mac-style Window Controls */}
                <div className="flex gap-1.5 group/traffic">
                    <div className="w-3 h-3 rounded-full bg-[#ef4444] border border-[#b91c1c]" />
                    <div className="w-3 h-3 rounded-full bg-[#eab308] border border-[#a16207]" />
                    <div className="w-3 h-3 rounded-full bg-[#22c55e] border border-[#15803d]" />
                </div>
                
                {/* Status Pill */}
                <div className={cn(
                    "flex items-center gap-2 px-2 py-0.5 rounded-full text-[10px] font-mono border",
                    isConnected 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                    {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    <span>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                </div>
            </div>

            {/* In-Terminal Actions */}
            <div className="flex items-center gap-1">
                <div className="relative mr-2">
                    <input 
                        className="bg-transparent border-b border-gray-700 text-xs text-gray-300 focus:border-primary outline-none w-32 py-0.5 placeholder:text-gray-600 transition-all focus:w-48"
                        placeholder="Grep logs..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setIsAutoScroll(!isAutoScroll)}
                    className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title={isAutoScroll ? "Pause Scroll" : "Resume Scroll"}
                >
                    {isAutoScroll ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button 
                    onClick={handleDownload}
                    className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Download Output"
                >
                    <Download className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
        
        {/* Log Content Area */}
        <div 
            className="flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm custom-scrollbar scroll-smooth"
            ref={scrollViewportRef}
            onScroll={handleScroll}
        >
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-3">
                {isConnected ? (
                    <>
                        <div className="h-8 w-8 border-2 border-gray-700 border-t-primary rounded-full animate-spin" />
                        <span className="animate-pulse">Listening for runner events...</span>
                    </>
                ) : (
                    <>
                        <Terminal className="h-10 w-10 opacity-20" />
                        <span>Not connected to a job runner.</span>
                    </>
                )}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
                {filteredLogs.map((log, idx) => (
                  <div key={log.id || idx} className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-2 transition-colors group/line">
                    
                    {/* Timestamp */}
                    <span className="text-gray-600 shrink-0 select-none min-w-[80px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </span>
                    
                    {/* Level */}
                    <span className={cn(
                        "font-bold shrink-0 w-[50px] select-none text-[10px] pt-0.5 uppercase tracking-wider", 
                        {
                          'text-cyan-400': log.level === 'INFO',
                          'text-amber-400': log.level === 'WARNING' || log.level === 'WARN',
                          'text-rose-500': log.level === 'ERROR',
                          'text-gray-500': log.level === 'DEBUG',
                        }
                    )}>
                        {log.level}
                    </span>
                    
                    {/* Message */}
                    <span className={cn(
                        "break-all whitespace-pre-wrap flex-1",
                        log.level === 'ERROR' ? "text-rose-200" : "text-gray-300"
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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-in slide-in-from-bottom-2 fade-in">
                <Button 
                    size="sm" 
                    onClick={() => setIsAutoScroll(true)}
                    className="h-8 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 gap-2 text-xs font-semibold hover:scale-105 transition-transform"
                >
                    <ArrowDown className="h-3 w-3 animate-bounce" />
                    Resume Auto-scroll
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};