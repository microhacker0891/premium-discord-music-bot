import { BaseAdapter } from './base'
import { Candle, Tick } from '@/types'

export class YahooAdapter extends BaseAdapter {
  name = 'yahoo'
  private ws: WebSocket | null = null
  private wsUrl = 'wss://streamer.finance.yahoo.com'

  async connect(): Promise<void> {
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

    const yahooSymbol = this.convertToYahooSymbol(symbol)
    this.ws.send(JSON.stringify({
      subscribe: [yahooSymbol]
    }))
  }

  async unsubscribe(symbol: string, timeframe: string): Promise<void> {
    const key = this.getSubscriptionKey(symbol, timeframe)
    this.subscriptions.delete(key)

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const yahooSymbol = this.convertToYahooSymbol(symbol)
      this.ws.send(JSON.stringify({
        unsubscribe: [yahooSymbol]
      }))
    }
  }

  async getBackfill(symbol: string, timeframe: string, from: number, to: number): Promise<Candle[]> {
    const yahooSymbol = this.convertToYahooSymbol(symbol)
    const fromTimestamp = Math.floor(from / 1000)
    const toTimestamp = Math.floor(to / 1000)

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${fromTimestamp}&period2=${toTimestamp}&interval=1m&includePrePost=true&events=div%2Csplit`

    try {
      const response = await this.makeRequest(url)

      if (response.chart && response.chart.result && response.chart.result[0]) {
        const result = response.chart.result[0]
        const timestamps = result.timestamp || []
        const quotes = result.indicators?.quote?.[0] || {}

        const candles: Candle[] = []
        for (let i = 0; i < timestamps.length; i++) {
          if (quotes.open && quotes.high && quotes.low && quotes.close && quotes.volume) {
            candles.push({
              symbol,
              timeframe,
              ts: timestamps[i] * 1000,
              o: quotes.open[i] || 0,
              h: quotes.high[i] || 0,
              l: quotes.low[i] || 0,
              c: quotes.close[i] || 0,
              v: quotes.volume[i] || 0
            })
          }
        }

        return candles
      }

      return []
    } catch (error) {
      console.error('StarkGlass: Error fetching Yahoo backfill data', error)
      return []
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        console.log('StarkGlass: Yahoo WebSocket connected')
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('StarkGlass: Error parsing Yahoo WebSocket message', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('StarkGlass: Yahoo WebSocket error', error)
        reject(error)
      }

      this.ws.onclose = () => {
        console.log('StarkGlass: Yahoo WebSocket disconnected')
        this.isConnected = false
      }
    })
  }

  private handleWebSocketMessage(data: any): void {
    if (data.type === 'trade') {
      const tick = this.normalizeTick(data, data.id)
      
      for (const [key, callback] of this.subscriptions.entries()) {
        const [symbol] = key.split('@')
        if (symbol === data.id) {
          callback(tick)
        }
      }
    }
  }

  private convertToYahooSymbol(symbol: string): string {
    // Convert NSE:ADANIGREEN to ADANIGREEN.NS
    const parts = symbol.split(':')
    if (parts.length === 2) {
      const [exchange, ticker] = parts
      if (exchange === 'NSE') {
        return `${ticker}.NS`
      } else if (exchange === 'BSE') {
        return `${ticker}.BO`
      }
    }
    return symbol
  }
}
