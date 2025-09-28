/**
 * WebSocket Hooks for Real-time Updates
 * Simplified version with minimal UI indicators
 */

import { useEffect, useState, useCallback } from 'react';
import { websocketClient, type ConnectionState, type WebSocketMessage } from '../lib/websocket-client';

// WebSocket Events
export const WEBSOCKET_EVENTS = {
  GUESS_SUBMITTED: 'guess_submitted',
  LEADERBOARD_UPDATED: 'leaderboard_updated',
  MATCH_UPDATED: 'match_updated',
  POT_UPDATED: 'pot_updated',
  SCORE_CALCULATED: 'score_calculated',
  WELCOME: 'welcome'
} as const;

// Main WebSocket hook
export function useWebSocket(options: { autoConnect?: boolean } = {}) {
  const { autoConnect = false } = options;
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  const connect = useCallback(async () => {
    try {
      await websocketClient.connect();
      setConnectionState('connected');
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionState('disconnected');
    }
  }, []);

  const disconnect = useCallback(() => {
    websocketClient.disconnect();
    setConnectionState('disconnected');
  }, []);

  const send = useCallback((type: string, data?: any) => {
    return websocketClient.send(type, data);
  }, []);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect]);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    connect,
    disconnect,
    send
  };
}

// Hook for subscribing to specific events
export function useWebSocketEvent(eventType: string, handler: (message: WebSocketMessage) => void, deps: any[] = []) {
  useEffect(() => {
    websocketClient.on(eventType, handler);
    return () => websocketClient.off(eventType, handler);
  }, [eventType, ...deps]);
}

// Specific hooks for common events
export function useLeaderboardUpdates(callback: (leaderboard: any[]) => void) {
  useWebSocketEvent(WEBSOCKET_EVENTS.LEADERBOARD_UPDATED, (message) => {
    if (message.data?.leaderboard) {
      callback(message.data.leaderboard);
    }
  }, [callback]);
}

export function usePotUpdates(callback: (pot: any) => void) {
  useWebSocketEvent(WEBSOCKET_EVENTS.POT_UPDATED, (message) => {
    if (message.data?.pot) {
      callback(message.data.pot);
    }
  }, [callback]);
}

export function useMatchUpdates(callback: (match: any) => void) {
  useWebSocketEvent(WEBSOCKET_EVENTS.MATCH_UPDATED, (message) => {
    if (message.data?.match) {
      callback(message.data.match);
    }
  }, [callback]);
}

export function useGuessSubmitted(callback: (guess: any) => void) {
  useWebSocketEvent(WEBSOCKET_EVENTS.GUESS_SUBMITTED, (message) => {
    if (message.data?.guess) {
      callback(message.data.guess);
    }
  }, [callback]);
}
