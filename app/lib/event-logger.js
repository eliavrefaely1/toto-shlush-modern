// Event-based logging system for CRUD operations
class EventLogger {
  constructor() {
    this.events = [];
    this.maxEvents = 1000; // Keep last 1000 events
  }

  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // Log an event
  logEvent({ actor, entityType, entityId, action, before = null, after = null, metadata = {} }) {
    const event = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      actor: actor || 'system',
      entityType,
      entityId,
      action,
      before,
      after,
      metadata: {
        ...metadata,
        userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server',
        ip: metadata.ip || 'unknown'
      }
    };

    this.events.unshift(event); // Add to beginning
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    console.log(`📝 Event logged: ${action} ${entityType} by ${actor}`, event);
    return event;
  }

  // Get events with filtering
  getEvents({ 
    entityType = null, 
    action = null, 
    actor = null, 
    startDate = null, 
    endDate = null,
    limit = 100 
  } = {}) {
    let filtered = [...this.events];

    if (entityType) {
      filtered = filtered.filter(e => e.entityType === entityType);
    }
    
    if (action) {
      filtered = filtered.filter(e => e.action === action);
    }
    
    if (actor) {
      filtered = filtered.filter(e => e.actor === actor);
    }
    
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(e => new Date(e.timestamp) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter(e => new Date(e.timestamp) <= end);
    }

    return filtered.slice(0, limit);
  }

  // Get event statistics
  getStats() {
    const stats = {
      totalEvents: this.events.length,
      byAction: {},
      byEntityType: {},
      byActor: {},
      recentActivity: this.events.slice(0, 10)
    };

    this.events.forEach(event => {
      stats.byAction[event.action] = (stats.byAction[event.action] || 0) + 1;
      stats.byEntityType[event.entityType] = (stats.byEntityType[event.entityType] || 0) + 1;
      stats.byActor[event.actor] = (stats.byActor[event.actor] || 0) + 1;
    });

    return stats;
  }

  // Clear old events (keep last N)
  clearOldEvents(keepCount = 500) {
    if (this.events.length > keepCount) {
      this.events = this.events.slice(0, keepCount);
    }
  }

  // Export events for backup
  exportEvents() {
    return {
      events: this.events,
      exportedAt: new Date().toISOString(),
      totalCount: this.events.length
    };
  }

  // Import events from backup
  importEvents(backupData) {
    if (backupData.events && Array.isArray(backupData.events)) {
      this.events = [...backupData.events, ...this.events];
      this.clearOldEvents();
      return true;
    }
    return false;
  }
}

// Create global instance
const eventLogger = new EventLogger();

// Helper functions for common operations
export const logUserAction = (actor, action, entityType, entityId, before = null, after = null, metadata = {}) => {
  return eventLogger.logEvent({
    actor,
    entityType,
    entityId,
    action,
    before,
    after,
    metadata
  });
};

export const logSystemAction = (action, entityType, entityId, before = null, after = null, metadata = {}) => {
  return eventLogger.logEvent({
    actor: 'system',
    entityType,
    entityId,
    action,
    before,
    after,
    metadata
  });
};

export const logAdminAction = (action, entityType, entityId, before = null, after = null, metadata = {}) => {
  return eventLogger.logEvent({
    actor: 'admin',
    entityType,
    entityId,
    action,
    before,
    after,
    metadata
  });
};

export { eventLogger };
export default eventLogger;
