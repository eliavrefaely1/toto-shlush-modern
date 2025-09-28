/**
 * WebSocket Client for Real-time Updates
 * Simplified version with minimal UI indicators
 */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  message?: string;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private userId: string;
  private autoReconnect: boolean = true;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers = new Map<string, Function[]>();
  private connectionState: ConnectionState = 'disconnected';
  private isConnecting: boolean = false;

  constructor(userId: string = 'anonymous') {
    this.userId = userId;
    this.buildUrl();
  }

  private buildUrl(): void {
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3001';
    this.url = `${protocol}//${host}/api/websocket?userId=${encodeURIComponent(this.userId)}`;
  }

  // Connect to WebSocket server
  async connect(): Promise<void> {
    if (this.isConnecting || this.connectionState === 'connected') {
      return;
    }

    this.isConnecting = true;
    this.connectionState = 'connecting';

    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Connecting to WebSocket: ${this.url}`);
        
        // For development, simulate connection
        setTimeout(() => {
          console.log('✅ WebSocket connected (simulated)');
          this.isConnecting = false;
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          this.clearReconnectTimer();
          
          // Simulate welcome message
          this.handleMessage({
            type: 'welcome',
            message: 'Connected to Toto Shlush Real-time Updates (Simulated)',
            timestamp: new Date().toISOString()
          });
          
          resolve();
        }, 100);
        
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    this.autoReconnect = false;
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connectionState = 'disconnected';
  }

  // Send message to server
  send(type: string, data?: any): boolean {
    if (this.connectionState !== 'connected') {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }

    try {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      
      // Simulate sending message
      console.log(`📤 Sent WebSocket message (simulated): ${type}`, message);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  // Subscribe to specific event types
  on(eventType: string, handler: Function): void {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType)!.push(handler);
  }

  // Unsubscribe from event type
  off(eventType: string, handler: Function): void {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  }

  // Schedule reconnection with exponential backoff
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      if (this.autoReconnect) {
        console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts})...`);
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  // Clear reconnection timer
  private clearReconnectTimer(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // Get connection state
  getConnectionState(): string {
    return this.connectionState;
  }

  // Check if connected
  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  // Get connection info
  getConnectionInfo(): { state: string; userId: string; reconnectAttempts: number } {
    return {
      state: this.connectionState,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();
export default websocketClient;
