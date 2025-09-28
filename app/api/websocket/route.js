import { NextRequest } from 'next/server';

// Store active WebSocket connections (in-memory simulation)
const connections = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'anonymous';
  
  console.log(`🔌 WebSocket connection request for: ${userId}`);
  
  // For development, return a mock response
  return new Response(JSON.stringify({
    message: 'WebSocket endpoint ready (development mode)',
    userId: userId,
    status: 'mock',
    note: 'WebSocket functionality is simulated in development mode'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Handle WebSocket messages
function handleWebSocketMessage(userId, message) {
  console.log(`📨 WebSocket message from ${userId}:`, message);
  
  switch (message.type) {
    case 'ping':
      // Respond to ping with pong
      const connection = connections.get(userId);
      if (connection && connection.ws.readyState === connection.ws.OPEN) {
        connection.ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        connection.lastPing = Date.now();
      }
      break;
      
    case 'subscribe':
      // Handle subscription to specific events
      console.log(`👤 ${userId} subscribed to:`, message.events);
      break;
      
    default:
      console.log(`❓ Unknown message type: ${message.type}`);
  }
}

// Broadcast message to all connected clients
export function broadcastMessage(type, data) {
  const message = {
    type,
    data,
    timestamp: new Date().toISOString()
  };
  
  console.log(`📢 Broadcasting message: ${type}`);
  
  connections.forEach((connection, userId) => {
    try {
      if (connection.ws.readyState === connection.ws.OPEN) {
        connection.ws.send(JSON.stringify(message));
      } else {
        // Clean up dead connections
        connections.delete(userId);
      }
    } catch (error) {
      console.error(`Error sending message to ${userId}:`, error);
      connections.delete(userId);
    }
  });
}

// Broadcast to specific user
export function sendToUser(userId, type, data) {
  const connection = connections.get(userId);
  if (connection && connection.ws.readyState === connection.ws.OPEN) {
    const message = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    try {
      connection.ws.send(JSON.stringify(message));
      console.log(`📤 Sent message to ${userId}: ${type}`);
    } catch (error) {
      console.error(`Error sending message to ${userId}:`, error);
      connections.delete(userId);
    }
  }
}

// Get connection statistics
export function getConnectionStats() {
  return {
    totalConnections: connections.size,
    connections: Array.from(connections.values()).map(conn => ({
      userId: conn.userId,
      connectedAt: conn.connectedAt,
      lastPing: conn.lastPing,
      isAlive: conn.ws.readyState === conn.ws.OPEN
    }))
  };
}

// WebSocket event types
export const WEBSOCKET_EVENTS = {
  // User events
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  
  // Guess events
  GUESS_SUBMITTED: 'guess_submitted',
  GUESS_UPDATED: 'guess_updated',
  GUESS_DELETED: 'guess_deleted',
  
  // Match events
  MATCH_ADDED: 'match_added',
  MATCH_UPDATED: 'match_updated',
  MATCH_DELETED: 'match_deleted',
  
  // Leaderboard events
  LEADERBOARD_UPDATED: 'leaderboard_updated',
  SCORE_CALCULATED: 'score_calculated',
  
  // Pot events
  POT_UPDATED: 'pot_updated',
  
  // Admin events
  SETTINGS_UPDATED: 'settings_updated',
  BACKUP_CREATED: 'backup_created',
  BACKUP_RESTORED: 'backup_restored',
  
  // System events
  SYSTEM_NOTIFICATION: 'system_notification',
  MAINTENANCE_MODE: 'maintenance_mode'
};
