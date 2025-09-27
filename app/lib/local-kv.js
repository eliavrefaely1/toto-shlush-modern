// Local development mock for Vercel KV
// This is used when Vercel KV is not available (local development)

class LocalKV {
  constructor() {
    this.storageKey = 'toto-local-kv-data'
  }

  // Load data from localStorage
  _loadData() {
    if (typeof window === 'undefined') {
      // Server-side: use Map (will reset on restart)
      return new Map()
    }
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        return new Map(Object.entries(data))
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
    }
    
    return new Map()
  }

  // Save data to localStorage
  _saveData(map) {
    if (typeof window === 'undefined') {
      // Server-side: no persistence
      return
    }
    
    try {
      const data = Object.fromEntries(map)
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  async get(key) {
    const data = this._loadData()
    return data.get(key) || null
  }

  async set(key, value) {
    const data = this._loadData()
    data.set(key, value)
    this._saveData(data)
    return 'OK'
  }

  async del(key) {
    const data = this._loadData()
    const deleted = data.delete(key)
    this._saveData(data)
    return deleted ? 1 : 0
  }
}

// Create a singleton instance
const localKV = new LocalKV()

export { localKV as kv }
