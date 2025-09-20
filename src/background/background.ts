import { DataAdapter, TradingContext } from '@/types'
import { KiteAdapter } from '@/adapters/kite'
import { UpstoxAdapter } from '@/adapters/upstox'
import { PolygonAdapter } from '@/adapters/polygon'
import { TiingoAdapter } from '@/adapters/tiingo'
import { YahooAdapter } from '@/adapters/yahoo'

class StarkGlassBackground {
  private adapters: Map<string, DataAdapter> = new Map()
  private subscriptions: Map<string, Set<chrome.runtime.Port>> = new Map()
  private analysisWorker: Worker | null = null

  constructor() {
    this.initializeAdapters()
    this.setupMessageHandlers()
    this.setupAlarms()
  }

  private initializeAdapters() {
    // Initialize data adapters
    this.adapters.set('kite', new KiteAdapter())
    this.adapters.set('upstox', new UpstoxAdapter())
    this.adapters.set('polygon', new PolygonAdapter())
    this.adapters.set('tiingo', new TiingoAdapter())
    this.adapters.set('yahoo', new YahooAdapter())
  }

  private setupMessageHandlers() {
    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async responses
    })

    // Handle port connections (for real-time data)
    chrome.runtime.onConnect.addListener((port) => {
      this.handlePortConnection(port)
    })
  }

  private async handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
    try {
      switch (message.type) {
        case 'CONTEXT_DETECTED':
        case 'CONTEXT_CHANGED':
          await this.handleContextChange(message.payload as TradingContext)
          break

        case 'SUBSCRIBE_DATA':
          await this.handleDataSubscription(message.payload, sendResponse)
          break

        case 'UNSUBSCRIBE_DATA':
          await this.handleDataUnsubscription(message.payload)
          break

        case 'GET_SETTINGS':
          await this.handleGetSettings(sendResponse)
          break

        case 'UPDATE_SETTINGS':
          await this.handleUpdateSettings(message.payload)
          break

        case 'PAUSE_UPDATES':
          await this.handlePauseUpdates()
          break

        case 'RESUME_UPDATES':
          await this.handleResumeUpdates()
          break

        default:
          console.warn('StarkGlass: Unknown message type', message.type)
      }
    } catch (error) {
      console.error('StarkGlass: Error handling message', error)
      sendResponse({ error: error.message })
    }
  }

  private handlePortConnection(port: chrome.runtime.Port) {
    console.log('StarkGlass: Port connected', port.name)

    port.onMessage.addListener((message) => {
      this.handlePortMessage(port, message)
    })

    port.onDisconnect.addListener(() => {
      console.log('StarkGlass: Port disconnected')
      this.cleanupPort(port)
    })
  }

  private handlePortMessage(port: chrome.runtime.Port, message: any) {
    switch (message.type) {
      case 'SUBSCRIBE':
        this.addSubscription(port, message.symbol, message.timeframe)
        break
      case 'UNSUBSCRIBE':
        this.removeSubscription(port, message.symbol, message.timeframe)
        break
    }
  }

  private async handleContextChange(context: TradingContext) {
    console.log('StarkGlass: Context changed', context)
    
    // Notify all connected ports about context change
    this.broadcastToPorts({
      type: 'CONTEXT_CHANGED',
      payload: context
    })
  }

  private async handleDataSubscription(payload: any, sendResponse: (response?: any) => void) {
    const { symbol, timeframe, provider } = payload
    
    try {
      const adapter = this.adapters.get(provider)
      if (!adapter) {
        throw new Error(`Unknown data provider: ${provider}`)
      }

      // Get backfill data first
      const endTime = Date.now()
      const startTime = endTime - (24 * 60 * 60 * 1000) // 24 hours ago
      
      const backfill = await adapter.getBackfill(symbol, timeframe, startTime, endTime)
      
      sendResponse({
        type: 'BACKFILL',
        data: backfill
      })

      // Set up live data subscription
      await adapter.subscribe(symbol, timeframe, (data) => {
        this.broadcastToPorts({
          type: 'DATA_UPDATE',
          payload: {
            symbol,
            timeframe,
            data
          }
        })
      })

    } catch (error) {
      console.error('StarkGlass: Error subscribing to data', error)
      sendResponse({ error: error.message })
    }
  }

  private async handleDataUnsubscription(payload: any) {
    const { symbol, timeframe, provider } = payload
    
    try {
      const adapter = this.adapters.get(provider)
      if (adapter) {
        await adapter.unsubscribe(symbol, timeframe)
      }
    } catch (error) {
      console.error('StarkGlass: Error unsubscribing from data', error)
    }
  }

  private async handleGetSettings(sendResponse: (response?: any) => void) {
    try {
      const result = await chrome.storage.local.get(['settings'])
      sendResponse({
        type: 'SETTINGS',
        payload: result.settings || {}
      })
    } catch (error) {
      console.error('StarkGlass: Error getting settings', error)
      sendResponse({ error: error.message })
    }
  }

  private async handleUpdateSettings(payload: any) {
    try {
      await chrome.storage.local.set({ settings: payload })
      
      // Notify all ports about settings update
      this.broadcastToPorts({
        type: 'SETTINGS_UPDATE',
        payload
      })
    } catch (error) {
      console.error('StarkGlass: Error updating settings', error)
    }
  }

  private async handlePauseUpdates() {
    // Pause all data subscriptions
    for (const adapter of this.adapters.values()) {
      // Adapters should implement pause/resume methods
      if ('pause' in adapter) {
        (adapter as any).pause()
      }
    }
  }

  private async handleResumeUpdates() {
    // Resume all data subscriptions
    for (const adapter of this.adapters.values()) {
      if ('resume' in adapter) {
        (adapter as any).resume()
      }
    }
  }

  private addSubscription(port: chrome.runtime.Port, symbol: string, timeframe: string) {
    const key = `${symbol}@${timeframe}`
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set())
    }
    
    this.subscriptions.get(key)!.add(port)
    
    console.log('StarkGlass: Added subscription', key)
  }

  private removeSubscription(port: chrome.runtime.Port, symbol: string, timeframe: string) {
    const key = `${symbol}@${timeframe}`
    
    const subscription = this.subscriptions.get(key)
    if (subscription) {
      subscription.delete(port)
      
      if (subscription.size === 0) {
        this.subscriptions.delete(key)
        // Unsubscribe from data source
        this.unsubscribeFromDataSource(symbol, timeframe)
      }
    }
  }

  private async unsubscribeFromDataSource(symbol: string, timeframe: string) {
    // Find which adapter is providing data for this symbol/timeframe
    // and unsubscribe
    for (const adapter of this.adapters.values()) {
      try {
        await adapter.unsubscribe(symbol, timeframe)
      } catch (error) {
        // Ignore errors - adapter might not be subscribed
      }
    }
  }

  private cleanupPort(port: chrome.runtime.Port) {
    // Remove port from all subscriptions
    for (const [key, ports] of this.subscriptions.entries()) {
      ports.delete(port)
      if (ports.size === 0) {
        this.subscriptions.delete(key)
      }
    }
  }

  private broadcastToPorts(message: any) {
    // Broadcast to all connected ports
    chrome.runtime.getConnections().forEach(port => {
      try {
        port.postMessage(message)
      } catch (error) {
        console.error('StarkGlass: Error broadcasting to port', error)
      }
    })
  }

  private setupAlarms() {
    // Set up periodic tasks
    chrome.alarms.create('cleanup', { periodInMinutes: 60 })
    chrome.alarms.create('healthCheck', { periodInMinutes: 5 })

    chrome.alarms.onAlarm.addListener((alarm) => {
      switch (alarm.name) {
        case 'cleanup':
          this.performCleanup()
          break
        case 'healthCheck':
          this.performHealthCheck()
          break
      }
    })
  }

  private performCleanup() {
    // Clean up old data, expired subscriptions, etc.
    console.log('StarkGlass: Performing cleanup')
  }

  private performHealthCheck() {
    // Check health of data connections
    console.log('StarkGlass: Performing health check')
  }
}

// Initialize background service
new StarkGlassBackground()
