import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectPlatform, createPlatformDetector } from '@/utils/platformDetection'

// Mock window.location
const mockLocation = (url: string) => {
  Object.defineProperty(window, 'location', {
    value: new URL(url),
    writable: true
  })
}

// Mock document
const mockDocument = (html: string) => {
  document.documentElement.innerHTML = html
}

describe('Platform Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('detectPlatform', () => {
    it('should detect Zerodha Kite context from URL', () => {
      mockLocation('https://kite.zerodha.com/chart/web/tvc/NSE:ADANIGREEN/15')
      
      const context = detectPlatform()
      
      expect(context).toEqual({
        symbol: 'NSE:ADANIGREEN',
        timeframe: '15',
        platform: 'kite',
        detected: true
      })
    })

    it('should detect TradingView context from URL', () => {
      mockLocation('https://www.tradingview.com/chart/?symbol=NSE:ADANIGREEN&interval=15')
      
      const context = detectPlatform()
      
      expect(context).toEqual({
        symbol: 'NSE:ADANIGREEN',
        timeframe: '15',
        platform: 'tradingview',
        detected: true
      })
    })

    it('should detect Upstox context from URL', () => {
      mockLocation('https://pro.upstox.com/chart/NSE:ADANIGREEN/15m')
      
      const context = detectPlatform()
      
      expect(context).toEqual({
        symbol: 'NSE:ADANIGREEN',
        timeframe: '15',
        platform: 'upstox',
        detected: true
      })
    })

    it('should detect Yahoo Finance context from URL', () => {
      mockLocation('https://finance.yahoo.com/quote/ADANIGREEN.NS')
      
      const context = detectPlatform()
      
      expect(context).toEqual({
        symbol: 'ADANIGREEN.NS',
        timeframe: '1',
        platform: 'yahoo',
        detected: true
      })
    })

    it('should return null for unsupported platform', () => {
      mockLocation('https://example.com/unsupported')
      
      const context = detectPlatform()
      
      expect(context).toBeNull()
    })

    it('should detect context from DOM elements', () => {
      mockLocation('https://kite.zerodha.com/chart')
      mockDocument(`
        <div class="symbol-name">NSE:ADANIGREEN</div>
        <div class="timeframe-selector">
          <div class="selected">15m</div>
        </div>
      `)
      
      const context = detectPlatform()
      
      expect(context).toEqual({
        symbol: 'NSE:ADANIGREEN',
        timeframe: '15',
        platform: 'kite',
        detected: true
      })
    })
  })

  describe('createPlatformDetector', () => {
    it('should create detector and call callback on context change', () => {
      const callback = vi.fn()
      mockLocation('https://kite.zerodha.com/chart/web/tvc/NSE:ADANIGREEN/15')
      
      const detector = createPlatformDetector(callback)
      
      expect(callback).toHaveBeenCalledWith({
        symbol: 'NSE:ADANIGREEN',
        timeframe: '15',
        platform: 'kite',
        detected: true
      })
      
      detector.cleanup()
    })

    it('should return current context', () => {
      const callback = vi.fn()
      mockLocation('https://kite.zerodha.com/chart/web/tvc/NSE:ADANIGREEN/15')
      
      const detector = createPlatformDetector(callback)
      const currentContext = detector.getCurrentContext()
      
      expect(currentContext).toEqual({
        symbol: 'NSE:ADANIGREEN',
        timeframe: '15',
        platform: 'kite',
        detected: true
      })
      
      detector.cleanup()
    })
  })
})
