import { 
  User, 
  Match, 
  UserGuess, 
  Settings, 
  Pot, 
  LeaderboardEntry, 
  ApiResponse,
  DataStatus,
  BackupData
} from '../types';
import { API_ENDPOINTS, ERROR_MESSAGES, HTTP_STATUS } from './constants';
import { createError, isNetworkError } from './utils';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw createError(data.error || ERROR_MESSAGES.SERVER_ERROR, response.status.toString());
      }

      return {
        ok: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      if (isNetworkError(error)) {
        throw createError(ERROR_MESSAGES.NETWORK_ERROR, 'NETWORK_ERROR');
      }
      throw error;
    }
  }

  // Data Management
  async getData(): Promise<ApiResponse<{
    users: User[];
    matches: Match[];
    userGuesses: UserGuess[];
    settings: Settings;
  }>> {
    return this.request(API_ENDPOINTS.DATA);
  }

  async updateData(data: any): Promise<ApiResponse> {
    return this.request(API_ENDPOINTS.DATA, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getDataStatus(): Promise<ApiResponse<DataStatus>> {
    return this.request(API_ENDPOINTS.DATA, {
      method: 'POST',
      body: JSON.stringify({ action: 'status' }),
    });
  }

  async cleanupData(adminToken?: string): Promise<ApiResponse<{ cleaned: number; message: string }>> {
    const headers: Record<string, string> = {};
    if (adminToken) {
      headers['x-admin-token'] = adminToken;
    }

    return this.request(API_ENDPOINTS.DATA, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'cleanup' }),
    });
  }

  async clearAllData(adminToken?: string): Promise<ApiResponse<{ message: string }>> {
    const headers: Record<string, string> = {};
    if (adminToken) {
      headers['x-admin-token'] = adminToken;
    }

    return this.request(API_ENDPOINTS.DATA, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'clearAll' }),
    });
  }

  // Leaderboard
  async getLeaderboard(week?: number): Promise<ApiResponse<{
    count: number;
    leaderboard: LeaderboardEntry[];
  }>> {
    const url = week ? `${API_ENDPOINTS.LEADERBOARD}?week=${week}` : API_ENDPOINTS.LEADERBOARD;
    return this.request(url);
  }

  // Pot
  async getPot(week?: number): Promise<ApiResponse<Pot>> {
    const url = week ? `${API_ENDPOINTS.POT}?week=${week}` : API_ENDPOINTS.POT;
    return this.request(url);
  }

  // Backup
  async createBackup(triggerAction?: string): Promise<ApiResponse<{ timestamp: string }>> {
    return this.request(API_ENDPOINTS.BACKUP, {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        triggerAction: triggerAction || 'Manual backup'
      }),
    });
  }

  async getBackups(): Promise<ApiResponse<BackupData[]>> {
    return this.request(API_ENDPOINTS.BACKUP);
  }

  async restoreBackup(backupId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(API_ENDPOINTS.BACKUP, {
      method: 'POST',
      body: JSON.stringify({
        action: 'restore',
        backupId
      }),
    });
  }

  async deleteBackup(backupId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(API_ENDPOINTS.BACKUP, {
      method: 'DELETE',
      body: JSON.stringify({ backupId }),
    });
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request(API_ENDPOINTS.HEALTH);
  }

  // Email
  async sendEmail(data: {
    to: string;
    subject: string;
    body: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request(API_ENDPOINTS.SEND_EMAIL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export individual methods for convenience
export const {
  getData,
  updateData,
  getDataStatus,
  cleanupData,
  clearAllData,
  getLeaderboard,
  getPot,
  createBackup,
  getBackups,
  restoreBackup,
  deleteBackup,
  healthCheck,
  sendEmail
} = apiClient;
