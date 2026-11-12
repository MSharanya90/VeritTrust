import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface WebSocketContextType {
  isConnected: boolean;
  lastEvent: any;
  eventsList: any[];
  sendPing: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = () => {
    try {
      const socket = new WebSocket('ws://localhost:8000/api/ws/monitoring');
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log('[VeriTrust WS] Telemetry socket connected');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);
          setEventsList((prev) => [data, ...prev.slice(0, 49)]);
        } catch {
          // Plaintext ping/pong
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log('[VeriTrust WS] Connection closed. Reconnecting in 5s...');
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };

      socket.onerror = (err) => {
        console.error('[VeriTrust WS] Socket error:', err);
        socket.close();
      };
    } catch (e) {
      console.error('[VeriTrust WS] Connection failed:', e);
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const sendPing = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('ping');
    }
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, lastEvent, eventsList, sendPing }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

