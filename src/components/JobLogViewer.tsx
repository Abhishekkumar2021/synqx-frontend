import React, { useState, useEffect, useRef } from 'react';
import { useJobLogs } from '../hooks/useJobLogs';
import { Terminal } from 'lucide-react';
import { clsx } from 'clsx';

interface JobLogViewerProps {
  initialJobId?: number | null;
  hideControls?: boolean;
}

export const JobLogViewer: React.FC<JobLogViewerProps> = ({ initialJobId = null, hideControls = false }) => {
  const [jobIdInput, setJobIdInput] = useState('1');
  const [activeJobId, setActiveJobId] = useState<number | null>(initialJobId);
  
  const { logs, isConnected } = useJobLogs(activeJobId);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialJobId) {
        setActiveJobId(initialJobId);
        setJobIdInput(initialJobId.toString());
    }
  }, [initialJobId]);

  const handleConnect = () => {
    setActiveJobId(parseInt(jobIdInput, 10));
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className={clsx("w-full h-full flex flex-col", { "p-6 max-w-5xl mx-auto": !hideControls })}>
      {!hideControls && (
        <div className="flex items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="text-blue-500" />
            Job Log Stream
            </h1>
            
            <div className="ml-auto flex items-center gap-3">
                <input 
                type="number" 
                value={jobIdInput} 
                onChange={(e) => setJobIdInput(e.target.value)}
                className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
                placeholder="Enter Job ID"
                />
                <button 
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 font-medium transition-colors"
                >
                Connect
                </button>
            </div>
        </div>
      )}

      <div className={clsx("bg-[#0d1117] flex flex-col h-full", { "rounded-lg border border-gray-800 shadow-2xl h-[600px]": !hideControls })}>
        <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center justify-between shrink-0">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Console Output</span>
            <div className="flex items-center gap-2">
                <div className={clsx("w-2 h-2 rounded-full animate-pulse", isConnected ? "bg-green-500" : "bg-red-500")}></div>
                <span className={clsx("text-xs font-medium", isConnected ? "text-green-500" : "text-red-500")}>
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1">
          {logs.length === 0 ? (
            <div className="text-gray-600 italic text-center mt-20">
                {isConnected ? 'Waiting for logs...' : 'Waiting for connection...'}
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={log.id || idx} className="flex items-start gap-3 hover:bg-white/5 p-1 rounded">
                <span className="text-gray-600 min-w-[85px] select-none">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                </span>
                <span className={clsx("font-bold w-[60px] select-none", {
                  'text-blue-400': log.level === 'INFO',
                  'text-yellow-400': log.level === 'WARNING',
                  'text-red-400': log.level === 'ERROR',
                  'text-gray-400': log.level === 'DEBUG',
                })}>{log.level}</span>
                <span className="text-gray-300 break-all whitespace-pre-wrap">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};
