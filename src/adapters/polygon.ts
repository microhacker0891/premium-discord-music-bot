import { BaseAdapter } from './base'
import { Candle, Tick } from '@/types'

export class PolygonAdapter extends BaseAdapter {
  name = 'polygon'
  private apiKey: string = ''
  private ws: WebSocket | null = null
  private wsUrl = 'wss://socket.polygon.io/stocks'

  async connect(): Promise<void> {
    const result = await chrome.storage.local.get(['polygonApiKey'])
    this.apiKey = result.polygonApiKey || ''

    if (!this.apiKey) {
      throw new Error('Polygon API key not found. Please configure in settings.')
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

    const polygonSymbol = this.convertToPolygonSymbol(symbol)
    this.ws.send(JSON.stringify({
      action: 'subscribe',
      params: `T.${polygonSymbol}`
    }))
  }

  async unsubscribe(symbol: string, timeframe: string): Promise<void> {
    const key = this.getSubscriptionKey(symbol, timeframe)
    this.subscriptions.delete(key)

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const polygonSymbol = this.convertToPolygonSymbol(symbol)
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        params: `T.${polygonSymbol}`
      }))
    }
  }

  async getBackfill(symbol: string, timeframe: string, from: number, to: number): Promise<Candle[]> {
    const polygonSymbol = this.convertToPolygonSymbol(symbol)
    const fromDate = new Date(from).toISOString().split('T')[0]
    const toDate = new Date(to).toISOString().split('T')[0]

    const url = `https://api.polygon.io/v2/aggs/ticker/${polygonSymbol}/range/1/minute/${fromDate}/${toDate}?adjusted=true&sort=asc&apikey=${this.apiKey}`

    try {
      const response = await this.makeRequest(url)

      if (response.status === 'OK' && response.results) {
        return response.results.map((candle: any) => ({
          symbol,
          timeframe,
          ts: candle.t,
          o: candle.o,
          h: candle.h,
          l: candle.l,
          c: candle.c,
          v: candle.v
        }))
      }

      return []
    } catch (error) {
      console.error('StarkGlass: Error fetching Polygon backfill data', error)
      return []
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.wsUrl}?apikey=${this.apiKey}`)

      this.ws.onopen = () => {
        console.log('StarkGlass: Polygon WebSocket connected')
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('StarkGlass: Error parsing Polygon WebSocket message', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('StarkGlass: Polygon WebSocket error', error)
        reject(error)
      }

      this.ws.onclose = () => {
        console.log('StarkGlass: Polygon WebSocket disconnected')
        this.isConnected = false
      }
    })
  }

  private handleWebSocketMessage(data: any): void {
    if (data.ev === 'T') {
      // Trade data
      const tick = this.normalizeTick(data, data.sym)
      
      for (const [key, callback] of this.subscriptions.entries()) {
        const [symbol] = key.split('@')
        if (symbol === data.sym) {
          callback(tick)
        }
      }
    }
  }

  private convertToPolygonSymbol(symbol: string): string {
    // Convert NSE:ADANIGREEN to ADANIGREEN
    return symbol.split(':').pop() || symbol
  }
}
