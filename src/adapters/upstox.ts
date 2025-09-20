import { BaseAdapter } from './base'
import { Candle, Tick } from '@/types'

export class UpstoxAdapter extends BaseAdapter {
  name = 'upstox'
  private apiKey: string = ''
  private accessToken: string = ''
  private ws: WebSocket | null = null
  private wsUrl = 'wss://api.upstox.com/v2/feed/market-data-feed'

  async connect(): Promise<void> {
    const result = await chrome.storage.local.get(['upstoxApiKey', 'upstoxAccessToken'])
    this.apiKey = result.upstoxApiKey || ''
    this.accessToken = result.upstoxAccessToken || ''

    if (!this.apiKey || !this.accessToken) {
      throw new Error('Upstox API credentials not found. Please configure in settings.')
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

    const instrumentKey = await this.getInstrumentKey(symbol)
    this.ws.send(JSON.stringify({
      a: 'subscribe',
      v: [instrumentKey]
    }))
  }

  async unsubscribe(symbol: string, timeframe: string): Promise<void> {
    const key = this.getSubscriptionKey(symbol, timeframe)
    this.subscriptions.delete(key)

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const instrumentKey = await this.getInstrumentKey(symbol)
      this.ws.send(JSON.stringify({
        a: 'unsubscribe',
        v: [instrumentKey]
      }))
    }
  }

  async getBackfill(symbol: string, timeframe: string, from: number, to: number): Promise<Candle[]> {
    const instrumentKey = await this.getInstrumentKey(symbol)
    const fromDate = new Date(from).toISOString().split('T')[0]
    const toDate = new Date(to).toISOString().split('T')[0]

    const url = `https://api.upstox.com/v2/historical-candle/${instrumentKey}/${timeframe}/${fromDate}/${toDate}`

    try {
      const response = await this.makeRequest(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Api-Version': '2.0'
        }
      })

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
      console.error('StarkGlass: Error fetching Upstox backfill data', error)
      return []
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.wsUrl}?api_key=${this.apiKey}&access_token=${this.accessToken}`)

      this.ws.onopen = () => {
        console.log('StarkGlass: Upstox WebSocket connected')
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('StarkGlass: Error parsing Upstox WebSocket message', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('StarkGlass: Upstox WebSocket error', error)
        reject(error)
      }

      this.ws.onclose = () => {
        console.log('StarkGlass: Upstox WebSocket disconnected')
        this.isConnected = false
      }
    })
  }

  private handleWebSocketMessage(data: any): void {
    if (data.type === 'tick') {
      const tick = this.normalizeTick(data, data.instrument_key)
      
      for (const [key, callback] of this.subscriptions.entries()) {
        const [symbol] = key.split('@')
        if (symbol === data.instrument_key) {
          callback(tick)
        }
      }
    }
  }

  private async getInstrumentKey(symbol: string): Promise<string> {
    const symbolMap: Record<string, string> = {
      'NSE:ADANIGREEN': 'NSE_EQ|INE364U01012',
      'NSE:RELIANCE': 'NSE_EQ|INE002A01018',
      'NSE:TCS': 'NSE_EQ|INE467B01029',
      'NSE:INFY': 'NSE_EQ|INE009A01021',
      'NSE:HDFC': 'NSE_EQ|INE001A01036'
    }

    return symbolMap[symbol] || symbol
  }
}
