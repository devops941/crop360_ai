'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export interface RealTimeNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  module?: string;
  actionUrl?: string;
  read: boolean;
}

interface RealTimeContextType {
  connected: boolean;
  notifications: RealTimeNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const RealTimeContext = createContext<RealTimeContextType>({
  connected: true,
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  clearAll: () => {},
});

export function RealTimeProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(true);
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([
    {
      id: 'demo-1',
      type: 'success',
      title: 'Crop360 Live Engine Ready',
      message: 'MongoDB Atlas connection active. Ready for farmer and soil data processing.',
      timestamp: new Date().toLocaleTimeString(),
      module: 'system',
      read: false,
    },
  ]);

  useEffect(() => {
    // Simulated connection heartbeat
    const interval = setInterval(() => {
      setConnected(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <RealTimeContext.Provider
      value={{
        connected,
        notifications,
        unreadCount,
        markAsRead,
        clearAll,
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  return useContext(RealTimeContext);
}
