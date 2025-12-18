'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (!accessToken || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(`${SOCKET_URL}/notifications`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('new_inquiry', (data) => {
      toast.success('New Inquiry', {
        description: data.notification?.message || 'You have a new inquiry',
      });
    });

    socket.on('inquiry_reply', (data) => {
      toast.info('Reply Received', {
        description: data.notification?.message || 'You received a reply to your inquiry',
      });
    });

    socket.on('notification', (data) => {
      toast(data.title, {
        description: data.message,
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user]);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    emit,
    isConnected: socketRef.current?.connected || false,
  };
}

