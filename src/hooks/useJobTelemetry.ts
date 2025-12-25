import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function useJobTelemetry(jobId: number | undefined) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const wsBase = API_BASE_URL.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/job_telemetry/${jobId}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'step_update' || data.type === 'run_update') {
            // Use a slight debounce to prevent spamming the server if telemetry is high-frequency
            // but ensure we get the latest data immediately for crucial status changes
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            
            debounceTimerRef.current = setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['job-run', jobId] });
                
                if (data.type === 'run_update') {
                    queryClient.invalidateQueries({ queryKey: ['jobs'] });
                }
            }, data.type === 'run_update' ? 0 : 500);
        }
      } catch (err) {
        console.error('Failed to parse telemetry update', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket telemetry error', err);
    };

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      ws.close();
    };
  }, [jobId, queryClient]);

  return { isConnected };
}