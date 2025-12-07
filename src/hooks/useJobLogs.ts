import { useEffect, useRef, useState } from 'react';

export interface LogMessage {
  type: 'job_log' | 'step_log';
  id: number;
  level: string;
  message: string;
  timestamp: string;
  source: string;
  job_id?: number;
  step_run_id?: number;
}

export function useJobLogs(jobId: number | null) {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!jobId) return;

    // TODO: Make URL configurable via env vars
    const wsUrl = `ws://localhost:8000/api/v1/ws/jobs/${jobId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to job logs: ${jobId}`);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLogs((prev) => [...prev, data]);
      } catch (err) {
        console.error('Failed to parse log message', err);
      }
    };

    ws.onclose = () => {
      console.log(`Disconnected from job logs: ${jobId}`);
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
    };

    return () => {
      ws.close();
    };
  }, [jobId]);

  return { logs, isConnected };
}
