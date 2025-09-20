import { DataAdapter, Candle, Tick } from '@/types'

export abstract class BaseAdapter implements DataAdapter {
  abstract name: string
  protected isConnected = false
  protected subscriptions: Map<string, (data: Candle | Tick) => void> = new Map()

  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract subscribe(symbol: string, timeframe: string, callback: (data: Candle | Tick) => void): Promise<void>
  abstract unsubscribe(symbol: string, timeframe: string): Promise<void>
  abstract getBackfill(symbol: string, timeframe: string, from: number, to: number): Promise<Candle[]>

  protected normalizeCandle(data: any, symbol: string, timeframe: string): Candle {
    return {
      symbol,
      timeframe,
      ts: new Date(data.timestamp || data.time || data.ts).getTime(),
      o: parseFloat(data.open || data.o),
      h: parseFloat(data.high || data.h),
      l: parseFloat(data.low || data.l),
      c: parseFloat(data.close || data.c),
      v: parseFloat(data.volume || data.v || 0)
    }
  }

  protected normalizeTick(data: any, symbol: string): Tick {
    return {
      symbol,
      ts: new Date(data.timestamp || data.time || data.ts).getTime(),
      price: parseFloat(data.price || data.p),
      volume: parseFloat(data.volume || data.v || 0),
      bid: data.bid ? parseFloat(data.bid) : undefined,
      ask: data.ask ? parseFloat(data.ask) : undefined
    }
  }

  protected getSubscriptionKey(symbol: string, timeframe: string): string {
    return `${symbol}@${timeframe}`
  }

  protected async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`StarkGlass: Request failed for ${url}`, error)
      throw error
    }
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  protected exponentialBackoff(attempt: number, baseDelay: number = 1000): number {
    return Math.min(baseDelay * Math.pow(2, attempt), 30000) // Max 30 seconds
  }
}
