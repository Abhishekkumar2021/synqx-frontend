import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function useJobsListTelemetry() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsBase = API_BASE_URL.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/jobs_list`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'job_list_update') {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        }
      } catch (err) {
        console.error('Failed to parse jobs list update', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket jobs list error', err);
    };

    return () => {
      ws.close();
    };
  }, [queryClient]);

  return { isConnected };
}
