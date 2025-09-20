import { BaseAdapter } from './base'
import { Candle, Tick } from '@/types'

export class KiteAdapter extends BaseAdapter {
  name = 'kite'
  private apiKey: string = ''
  private accessToken: string = ''
  private ws: WebSocket | null = null
  private wsUrl = 'wss://api.kite.trade/ws/stream'

  async connect(): Promise<void> {
    // Get API credentials from storage
    const result = await chrome.storage.local.get(['kiteApiKey', 'kiteAccessToken'])
    this.apiKey = result.kiteApiKey || ''
    this.accessToken = result.kiteAccessToken || ''

    if (!this.apiKey || !this.accessToken) {
      throw new Error('Kite API credentials not found. Please configure in settings.')
    }

    this.isConnected = true
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }

  async subscribe(symbol: string, timeframe: string, callback: (data: Candle | Tick) => void): Promise<void> {
    const key = this.getSubscriptionKey(symbol, timeframe)
    this.subscriptions.set(key, callback)

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connectWebSocket()
    }

    // Subscribe to instrument
    const instrumentToken = await this.getInstrumentToken(symbol)
    this.ws.send(JSON.stringify({
      a: 'subscribe',
      v: [instrumentToken]
    }))
  }

  async unsubscribe(symbol: string, timeframe: string): Promise<void> {
    const key = this.getSubscriptionKey(symbol, timeframe)
    this.subscriptions.delete(key)

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const instrumentToken = await this.getInstrumentToken(symbol)
      this.ws.send(JSON.stringify({
        a: 'unsubscribe',
        v: [instrumentToken]
      }))
    }
  }

  async getBackfill(symbol: string, timeframe: string, from: number, to: number): Promise<Candle[]> {
    const instrumentToken = await this.getInstrumentToken(symbol)
    const fromDate = new Date(from).toISOString().split('T')[0]
    const toDate = new Date(to).toISOString().split('T')[0]

    const url = `https://api.kite.trade/instruments/historical/${instrumentToken}/${timeframe}?from=${fromDate}&to=${toDate}&api_key=${this.apiKey}&access_token=${this.accessToken}`

    try {
      const response = await this.makeRequest(url)
      
      if (response.status === 'success' && response.data.candles) {
        return response.data.candles.map((candle: any[]) => ({
          symbol,
          timeframe,
          ts: new Date(candle[0]).getTime(),
          o: parseFloat(candle[1]),
          h: parseFloat(candle[2]),
          l: parseFloat(candle[3]),
          c: parseFloat(candle[4]),
          v: parseFloat(candle[5])
        }))
      }

      return []
    } catch (error) {
      console.error('StarkGlass: Error fetching Kite backfill data', error)
      return []
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.wsUrl}?api_key=${this.apiKey}&access_token=${this.accessToken}`)

      this.ws.onopen = () => {
        console.log('StarkGlass: Kite WebSocket connected')
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('StarkGlass: Error parsing WebSocket message', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('StarkGlass: Kite WebSocket error', error)
        reject(error)
      }

      this.ws.onclose = () => {
        console.log('StarkGlass: Kite WebSocket disconnected')
        this.isConnected = false
      }
    })
  }

  private handleWebSocketMessage(data: any): void {
    if (data.type === 'tick') {
      // Handle tick data
      const tick = this.normalizeTick(data, data.instrument_token)
      
      // Find matching subscription
      for (const [key, callback] of this.subscriptions.entries()) {
        const [symbol] = key.split('@')
        if (symbol === data.instrument_token) {
          callback(tick)
        }
      }
    } else if (data.type === 'candle') {
      // Handle candle data
      const candle = this.normalizeCandle(data, data.instrument_token, data.timeframe)
      
      // Find matching subscription
      for (const [key, callback] of this.subscriptions.entries()) {
        const [symbol, timeframe] = key.split('@')
        if (symbol === data.instrument_token && timeframe === data.timeframe) {
          callback(candle)
        }
      }
    }
  }

  private async getInstrumentToken(symbol: string): Promise<string> {
    // In a real implementation, you would maintain a mapping of symbols to instrument tokens
    // For now, we'll use a simple approach
    const symbolMap: Record<string, string> = {
      'NSE:ADANIGREEN': '2885633',
      'NSE:RELIANCE': '738561',
      'NSE:TCS': '2953217',
      'NSE:INFY': '408065',
      'NSE:HDFC': '341249'
    }

    return symbolMap[symbol] || symbol
  }
}
