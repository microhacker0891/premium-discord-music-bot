import { BaseAdapter } from './base'
import { Candle, Tick } from '@/types'

export class TiingoAdapter extends BaseAdapter {
  name = 'tiingo'
  private apiKey: string = ''
  private ws: WebSocket | null = null
  private wsUrl = 'wss://api.tiingo.com/iex'

  async connect(): Promise<void> {
    const result = await chrome.storage.local.get(['tiingoApiKey'])
    this.apiKey = result.tiingoApiKey || ''

    if (!this.apiKey) {
      throw new Error('Tiingo API key not found. Please configure in settings.')
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

    const tiingoSymbol = this.convertToTiingoSymbol(symbol)
    this.ws.send(JSON.stringify({
      eventName: 'subscribe',
      authorization: this.apiKey,
      eventData: {
        thresholdLevel: 5,
        tickers: [tiingoSymbol]
      }
    }))
  }

  async unsubscribe(symbol: string, timeframe: string): Promise<void> {
    const key = this.getSubscriptionKey(symbol, timeframe)
    this.subscriptions.delete(key)

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const tiingoSymbol = this.convertToTiingoSymbol(symbol)
      this.ws.send(JSON.stringify({
        eventName: 'unsubscribe',
        authorization: this.apiKey,
        eventData: {
          tickers: [tiingoSymbol]
        }
      }))
    }
  }

  async getBackfill(symbol: string, timeframe: string, from: number, to: number): Promise<Candle[]> {
    const tiingoSymbol = this.convertToTiingoSymbol(symbol)
    const fromDate = new Date(from).toISOString().split('T')[0]
    const toDate = new Date(to).toISOString().split('T')[0]

    const url = `https://api.tiingo.com/iex/${tiingoSymbol}/prices?startDate=${fromDate}&endDate=${toDate}&resampleFreq=1min&format=json&token=${this.apiKey}`

    try {
      const response = await this.makeRequest(url)

      if (Array.isArray(response)) {
        return response.map((candle: any) => ({
          symbol,
          timeframe,
          ts: new Date(candle.date).getTime(),
          o: candle.open,
          h: candle.high,
          l: candle.low,
          c: candle.close,
          v: candle.volume
        }))
      }

      return []
    } catch (error) {
      console.error('StarkGlass: Error fetching Tiingo backfill data', error)
      return []
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.wsUrl}?token=${this.apiKey}`)

      this.ws.onopen = () => {
        console.log('StarkGlass: Tiingo WebSocket connected')
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('StarkGlass: Error parsing Tiingo WebSocket message', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('StarkGlass: Tiingo WebSocket error', error)
        reject(error)
      }

      this.ws.onclose = () => {
        console.log('StarkGlass: Tiingo WebSocket disconnected')
        this.isConnected = false
      }
    })
  }

  private handleWebSocketMessage(data: any): void {
    if (data.messageType === 'A') {
      // Trade data
      const tick = this.normalizeTick(data, data.ticker)
      
      for (const [key, callback] of this.subscriptions.entries()) {
        const [symbol] = key.split('@')
        if (symbol === data.ticker) {
          callback(tick)
        }
      }
    }
  }

  private convertToTiingoSymbol(symbol: string): string {
    // Convert NSE:ADANIGREEN to ADANIGREEN
    return symbol.split(':').pop() || symbol
  }
}
