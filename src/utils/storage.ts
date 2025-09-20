import Dexie, { Table } from 'dexie'
import { Candle, Settings } from '@/types'

// Database schema
export class StarkGlassDB extends Dexie {
  candles!: Table<Candle & { id?: number }>
  settings!: Table<Settings & { id?: number }>
  cache!: Table<{
    id?: number
    key: string
    data: any
    timestamp: number
    expiresAt: number
  }>

  constructor() {
    super('StarkGlassDB')
    
    this.version(1).stores({
      candles: '++id, symbol, timeframe, ts',
      settings: '++id, dataSource, indicators, confluence, risk, alerts, ui',
      cache: '++id, key, timestamp, expiresAt'
    })
  }
}

// Create database instance
export const db = new StarkGlassDB()

// Storage utilities
export class StorageManager {
  private static instance: StorageManager
  private db: StarkGlassDB

  private constructor() {
    this.db = db
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  // Candle data management
  async saveCandles(candles: Candle[]): Promise<void> {
    try {
      await this.db.candles.bulkPut(
        candles.map(candle => ({
          ...candle,
          id: undefined // Let Dexie auto-generate
        }))
      )
    } catch (error) {
      console.error('StarkGlass: Error saving candles', error)
      throw error
    }
  }

  async getCandles(symbol: string, timeframe: string, from?: number, to?: number): Promise<Candle[]> {
    try {
      let query = this.db.candles
        .where(['symbol', 'timeframe'])
        .equals([symbol, timeframe])

      if (from) {
        query = query.filter(candle => candle.ts >= from)
      }
      if (to) {
        query = query.filter(candle => candle.ts <= to)
      }

      const candles = await query.toArray()
      return candles.map(({ id, ...candle }) => candle)
    } catch (error) {
      console.error('StarkGlass: Error getting candles', error)
      return []
    }
  }

  async getLatestCandle(symbol: string, timeframe: string): Promise<Candle | null> {
    try {
      const candle = await this.db.candles
        .where(['symbol', 'timeframe'])
        .equals([symbol, timeframe])
        .last()
      
      if (candle) {
        const { id, ...candleData } = candle
        return candleData
      }
      return null
    } catch (error) {
      console.error('StarkGlass: Error getting latest candle', error)
      return null
    }
  }

  async clearOldCandles(olderThan: number): Promise<void> {
    try {
      await this.db.candles
        .where('ts')
        .below(olderThan)
        .delete()
    } catch (error) {
      console.error('StarkGlass: Error clearing old candles', error)
    }
  }

  // Settings management
  async saveSettings(settings: Settings): Promise<void> {
    try {
      await this.db.settings.clear()
      await this.db.settings.add(settings)
    } catch (error) {
      console.error('StarkGlass: Error saving settings', error)
      throw error
    }
  }

  async getSettings(): Promise<Settings | null> {
    try {
      const settings = await this.db.settings.first()
      if (settings) {
        const { id, ...settingsData } = settings
        return settingsData
      }
      return null
    } catch (error) {
      console.error('StarkGlass: Error getting settings', error)
      return null
    }
  }

  // Cache management
  async setCache(key: string, data: any, ttl: number = 3600000): Promise<void> {
    try {
      const now = Date.now()
      const expiresAt = now + ttl

      await this.db.cache.put({
        key,
        data,
        timestamp: now,
        expiresAt
      })
    } catch (error) {
      console.error('StarkGlass: Error setting cache', error)
    }
  }

  async getCache(key: string): Promise<any | null> {
    try {
      const cached = await this.db.cache
        .where('key')
        .equals(key)
        .first()

      if (cached && cached.expiresAt > Date.now()) {
        return cached.data
      }

      // Remove expired cache
      if (cached) {
        await this.db.cache.delete(cached.id!)
      }

      return null
    } catch (error) {
      console.error('StarkGlass: Error getting cache', error)
      return null
    }
  }

  async clearExpiredCache(): Promise<void> {
    try {
      const now = Date.now()
      await this.db.cache
        .where('expiresAt')
        .below(now)
        .delete()
    } catch (error) {
      console.error('StarkGlass: Error clearing expired cache', error)
    }
  }

  // Chrome storage integration
  async syncWithChromeStorage(): Promise<void> {
    try {
      // Sync settings to Chrome storage
      const settings = await this.getSettings()
      if (settings) {
        await chrome.storage.local.set({ settings })
      }

      // Sync from Chrome storage
      const result = await chrome.storage.local.get(['settings'])
      if (result.settings) {
        await this.saveSettings(result.settings)
      }
    } catch (error) {
      console.error('StarkGlass: Error syncing with Chrome storage', error)
    }
  }

  // Database maintenance
  async cleanup(): Promise<void> {
    try {
      // Clear old candles (older than 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      await this.clearOldCandles(thirtyDaysAgo)

      // Clear expired cache
      await this.clearExpiredCache()

      console.log('StarkGlass: Database cleanup completed')
    } catch (error) {
      console.error('StarkGlass: Error during cleanup', error)
    }
  }

  // Get database statistics
  async getStats(): Promise<{
    candleCount: number
    cacheCount: number
    settingsCount: number
    dbSize: number
  }> {
    try {
      const [candleCount, cacheCount, settingsCount] = await Promise.all([
        this.db.candles.count(),
        this.db.cache.count(),
        this.db.settings.count()
      ])

      // Estimate database size (rough calculation)
      const dbSize = await this.estimateDbSize()

      return {
        candleCount,
        cacheCount,
        settingsCount,
        dbSize
      }
    } catch (error) {
      console.error('StarkGlass: Error getting database stats', error)
      return {
        candleCount: 0,
        cacheCount: 0,
        settingsCount: 0,
        dbSize: 0
      }
    }
  }

  private async estimateDbSize(): Promise<number> {
    try {
      // This is a rough estimation - in a real implementation,
      // you might want to use a more sophisticated method
      const allCandles = await this.db.candles.toArray()
      const allCache = await this.db.cache.toArray()
      const allSettings = await this.db.settings.toArray()

      const candleSize = JSON.stringify(allCandles).length
      const cacheSize = JSON.stringify(allCache).length
      const settingsSize = JSON.stringify(allSettings).length

      return candleSize + cacheSize + settingsSize
    } catch (error) {
      console.error('StarkGlass: Error estimating database size', error)
      return 0
    }
  }
}

// Export singleton instance
export const storage = StorageManager.getInstance()

// Initialize storage on module load
storage.syncWithChromeStorage().catch(console.error)
