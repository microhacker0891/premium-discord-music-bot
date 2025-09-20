// Core data types
export interface Candle {
  symbol: string
  timeframe: string
  ts: number // milliseconds
  o: number
  h: number
  l: number
  c: number
  v: number
}

export interface Tick {
  symbol: string
  ts: number
  price: number
  volume: number
  bid?: number
  ask?: number
}

// Context detection
export interface TradingContext {
  symbol: string
  timeframe: string
  platform: 'kite' | 'tradingview' | 'upstox' | 'yahoo' | 'unknown'
  detected: boolean
}

// Indicator data
export interface IndicatorData {
  rsi: number
  macd: {
    macd: number
    signal: number
    histogram: number
  }
  adx: {
    adx: number
    diPlus: number
    diMinus: number
  }
  ema: {
    ema20: number
    ema50: number
    ema200: number
  }
  atr: number
  supertrend: {
    value: number
    direction: 'up' | 'down'
  }
  vwap: number
  volume: {
    current: number
    average: number
    spike: boolean
  }
}

// Market structure
export interface MarketStructure {
  highs: number[]
  lows: number[]
  hh: boolean // Higher High
  hl: boolean // Higher Low
  lh: boolean // Lower High
  ll: boolean // Lower Low
  trend: 'bullish' | 'bearish' | 'sideways'
}

// Confluence and predictions
export interface ConfluenceData {
  score: number // 0-100
  regime: 'trend' | 'range'
  momentum: 'strong' | 'moderate' | 'weak'
  volatility: 'high' | 'medium' | 'low'
  atr: number
}

export interface PredictionData {
  nowcast: number
  targets: {
    t1: number
    t2: number
    t3: number
  }
  stops: {
    sl: number
    reason: string
  }
  confidence: number
  horizon: number // bars ahead
}

// UI state
export interface UIState {
  isVisible: boolean
  isPinned: boolean
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  mode: 'compact' | 'expanded' | 'floating'
  theme: 'auto' | 'light' | 'dark'
}

// Settings
export interface Settings {
  dataSource: {
    provider: 'kite' | 'upstox' | 'polygon' | 'tiingo' | 'yahoo'
    apiKey?: string
    apiSecret?: string
    accessToken?: string
  }
  indicators: {
    rsi: { length: number }
    macd: { fast: number; slow: number; signal: number }
    adx: { length: number }
    ema: { fast: number; medium: number; slow: number }
    atr: { length: number }
    supertrend: { atrLength: number; multiplier: number }
  }
  confluence: {
    trendWeights: Record<string, number>
    rangeWeights: Record<string, number>
  }
  risk: {
    atrMultiplier: number
    maxRiskPercent: number
  }
  alerts: {
    enabled: boolean
    confluenceThreshold: number
    webhook?: string
  }
  ui: UIState
}

// Messages between components
export interface Message {
  type: string
  payload?: any
}

export interface DataMessage extends Message {
  type: 'DATA_UPDATE' | 'BACKFILL' | 'TICK'
  payload: {
    symbol: string
    timeframe: string
    data: Candle[] | Tick
  }
}

export interface ContextMessage extends Message {
  type: 'CONTEXT_DETECTED' | 'CONTEXT_CHANGED'
  payload: TradingContext
}

export interface SettingsMessage extends Message {
  type: 'SETTINGS_UPDATE'
  payload: Partial<Settings>
}

// Analysis worker API
export interface AnalysisWorkerAPI {
  onBackfill(symbol: string, timeframe: string, candles: Candle[]): Promise<void>
  onTick(symbol: string, timeframe: string, candle: Candle): Promise<void>
  getSnapshot(symbol: string, timeframe: string): Promise<{
    indicators: IndicatorData
    structure: MarketStructure
    confluence: ConfluenceData
    prediction: PredictionData
  }>
  updateSettings(settings: Partial<Settings>): Promise<void>
}

// Data adapter interface
export interface DataAdapter {
  name: string
  connect(): Promise<void>
  disconnect(): Promise<void>
  subscribe(symbol: string, timeframe: string, callback: (data: Candle | Tick) => void): Promise<void>
  unsubscribe(symbol: string, timeframe: string): Promise<void>
  getBackfill(symbol: string, timeframe: string, from: number, to: number): Promise<Candle[]>
}

// Platform detection
export interface PlatformDetector {
  detect(): TradingContext | null
  observe(callback: (context: TradingContext) => void): () => void
}
