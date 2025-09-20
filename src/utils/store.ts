import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TradingContext, Settings, Candle, IndicatorData, ConfluenceData, PredictionData } from '@/types'

interface StarkGlassState {
  // Context
  context: TradingContext | null
  
  // Settings
  settings: Settings
  
  // Data
  candles: Candle[]
  indicators: IndicatorData | null
  confluence: ConfluenceData | null
  prediction: PredictionData | null
  
  // UI State
  isVisible: boolean
  isPinned: boolean
  isExpanded: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  
  // Actions
  setContext: (context: TradingContext | null) => void
  updateSettings: (settings: Partial<Settings>) => void
  setCandles: (candles: Candle[]) => void
  setIndicators: (indicators: IndicatorData) => void
  setConfluence: (confluence: ConfluenceData) => void
  setPrediction: (prediction: PredictionData) => void
  setVisibility: (visible: boolean) => void
  setPinned: (pinned: boolean) => void
  setExpanded: (expanded: boolean) => void
  setPosition: (position: { x: number; y: number }) => void
  setSize: (size: { width: number; height: number }) => void
}

const defaultSettings: Settings = {
  dataSource: {
    provider: 'kite',
    apiKey: '',
    apiSecret: '',
    accessToken: ''
  },
  indicators: {
    rsi: { length: 14 },
    macd: { fast: 12, slow: 26, signal: 9 },
    adx: { length: 21 },
    ema: { fast: 20, medium: 50, slow: 200 },
    atr: { length: 14 },
    supertrend: { atrLength: 10, multiplier: 3 }
  },
  confluence: {
    trendWeights: {
      ema: 0.25,
      adx: 0.2,
      macd: 0.2,
      supertrend: 0.15,
      volume: 0.1,
      structure: 0.1
    },
    rangeWeights: {
      rsi: 0.25,
      structure: 0.2,
      vwap: 0.15,
      volume: 0.15,
      macd: 0.1,
      adx: 0.05,
      supertrend: 0.1
    }
  },
  risk: {
    atrMultiplier: 1.7,
    maxRiskPercent: 2
  },
  alerts: {
    enabled: true,
    confluenceThreshold: 70,
    webhook: ''
  },
  ui: {
    isVisible: true,
    isPinned: false,
    position: { x: 20, y: 20 },
    size: { width: 320, height: 400 },
    mode: 'compact',
    theme: 'auto'
  }
}

export const useStarkGlassStore = create<StarkGlassState>()(
  persist(
    (set, get) => ({
      // Initial state
      context: null,
      settings: defaultSettings,
      candles: [],
      indicators: null,
      confluence: null,
      prediction: null,
      isVisible: true,
      isPinned: false,
      isExpanded: false,
      position: { x: 20, y: 20 },
      size: { width: 320, height: 400 },
      
      // Actions
      setContext: (context) => set({ context }),
      
      updateSettings: (newSettings) => 
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),
      
      setCandles: (candles) => set({ candles }),
      
      setIndicators: (indicators) => set({ indicators }),
      
      setConfluence: (confluence) => set({ confluence }),
      
      setPrediction: (prediction) => set({ prediction }),
      
      setVisibility: (isVisible) => set({ isVisible }),
      
      setPinned: (isPinned) => set({ isPinned }),
      
      setExpanded: (isExpanded) => set({ isExpanded }),
      
      setPosition: (position) => set({ position }),
      
      setSize: (size) => set({ size })
    }),
    {
      name: 'starkglass-storage',
      partialize: (state) => ({
        settings: state.settings,
        isVisible: state.isVisible,
        isPinned: state.isPinned,
        isExpanded: state.isExpanded,
        position: state.position,
        size: state.size
      })
    }
  )
)
