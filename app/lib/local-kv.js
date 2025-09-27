// Local development mock for Vercel KV
// This is used when Vercel KV is not available (local development)

class LocalKV {
  constructor() {
    this.data = new Map()
  }

  async get(key) {
    return this.data.get(key) || null
  }

  async set(key, value) {
    this.data.set(key, value)
    return 'OK'
  }

  async del(key) {
    return this.data.delete(key) ? 1 : 0
  }
}

// Create a singleton instance
const localKV = new LocalKV()

export { localKV as kv }
