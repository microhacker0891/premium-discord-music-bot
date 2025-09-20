import { TradingContext } from '@/types'

export function detectPlatform(): TradingContext | null {
  const url = window.location.href
  const hostname = window.location.hostname

  // Zerodha Kite detection
  if (hostname.includes('kite.zerodha.com')) {
    return detectKiteContext(url)
  }

  // TradingView detection
  if (hostname.includes('tradingview.com')) {
    return detectTradingViewContext(url)
  }

  // Upstox detection
  if (hostname.includes('upstox.com')) {
    return detectUpstoxContext(url)
  }

  // Yahoo Finance detection
  if (hostname.includes('finance.yahoo.com')) {
    return detectYahooContext(url)
  }

  return null
}

function detectKiteContext(url: string): TradingContext | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Pattern: /chart/web/tvc/NSE:ADANIGREEN/15
    const chartMatch = pathname.match(/\/chart\/web\/tvc\/([^\/]+)\/(\d+)/)
    if (chartMatch) {
      return {
        symbol: chartMatch[1],
        timeframe: chartMatch[2],
        platform: 'kite',
        detected: true
      }
    }

    // Try to extract from DOM if URL pattern doesn't match
    const symbolElement = document.querySelector('[data-name="symbol"]') || 
                         document.querySelector('.symbol-name') ||
                         document.querySelector('.instrument-name')
    
    const timeframeElement = document.querySelector('[data-name="timeframe"]') ||
                            document.querySelector('.timeframe-selector .selected') ||
                            document.querySelector('.interval-selector .selected')

    if (symbolElement && timeframeElement) {
      const symbol = symbolElement.textContent?.trim() || ''
      const timeframe = extractTimeframe(timeframeElement.textContent?.trim() || '')
      
      if (symbol && timeframe) {
        return {
          symbol,
          timeframe,
          platform: 'kite',
          detected: true
        }
      }
    }

    return null
  } catch (error) {
    console.error('StarkGlass: Error detecting Kite context', error)
    return null
  }
}

function detectTradingViewContext(url: string): TradingContext | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Pattern: /chart/?symbol=NSE:ADANIGREEN&interval=15
    const symbolMatch = urlObj.searchParams.get('symbol')
    const intervalMatch = urlObj.searchParams.get('interval')

    if (symbolMatch && intervalMatch) {
      return {
        symbol: symbolMatch,
        timeframe: intervalMatch,
        platform: 'tradingview',
        detected: true
      }
    }

    // Pattern: /chart/symbol/NSE:ADANIGREEN/
    const chartMatch = pathname.match(/\/chart\/symbol\/([^\/]+)/)
    if (chartMatch) {
      // Try to get timeframe from DOM or default to 1m
      const timeframe = getTimeframeFromDOM() || '1'
      return {
        symbol: chartMatch[1],
        timeframe,
        platform: 'tradingview',
        detected: true
      }
    }

    // Try to get from TradingView's global state
    if (window.TradingView && window.TradingView.widget) {
      const widget = window.TradingView.widget
      if (widget.symbol && widget.interval) {
        return {
          symbol: widget.symbol,
          timeframe: widget.interval,
          platform: 'tradingview',
          detected: true
        }
      }
    }

    return null
  } catch (error) {
    console.error('StarkGlass: Error detecting TradingView context', error)
    return null
  }
}

function detectUpstoxContext(url: string): TradingContext | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Pattern: /chart/NSE:ADANIGREEN/15m
    const chartMatch = pathname.match(/\/chart\/([^\/]+)\/(\d+[mhd])/)
    if (chartMatch) {
      return {
        symbol: chartMatch[1],
        timeframe: chartMatch[2],
        platform: 'upstox',
        detected: true
      }
    }

    // Try to extract from DOM
    const symbolElement = document.querySelector('.symbol-name') ||
                         document.querySelector('[data-testid="symbol-name"]')
    
    const timeframeElement = document.querySelector('.timeframe-selector .selected') ||
                            document.querySelector('[data-testid="timeframe"]')

    if (symbolElement && timeframeElement) {
      const symbol = symbolElement.textContent?.trim() || ''
      const timeframe = extractTimeframe(timeframeElement.textContent?.trim() || '')
      
      if (symbol && timeframe) {
        return {
          symbol,
          timeframe,
          platform: 'upstox',
          detected: true
        }
      }
    }

    return null
  } catch (error) {
    console.error('StarkGlass: Error detecting Upstox context', error)
    return null
  }
}

function detectYahooContext(url: string): TradingContext | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Pattern: /quote/ADANIGREEN.NS
    const quoteMatch = pathname.match(/\/quote\/([^\/\?]+)/)
    if (quoteMatch) {
      const symbol = quoteMatch[1]
      // Yahoo Finance doesn't have explicit timeframes in URL, default to 1m
      return {
        symbol,
        timeframe: '1',
        platform: 'yahoo',
        detected: true
      }
    }

    return null
  } catch (error) {
    console.error('StarkGlass: Error detecting Yahoo context', error)
    return null
  }
}

function extractTimeframe(timeframeText: string): string {
  // Convert various timeframe formats to standard format
  const mappings: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '4h': '240',
    '1d': '1440',
    '1w': '10080',
    '1M': '43200'
  }

  return mappings[timeframeText] || timeframeText.replace(/[^\d]/g, '')
}

function getTimeframeFromDOM(): string | null {
  // Try to find timeframe selector in DOM
  const selectors = [
    '.timeframe-selector .selected',
    '.interval-selector .selected',
    '[data-name="timeframe"]',
    '.chart-timeframe .selected'
  ]

  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (element) {
      const text = element.textContent?.trim()
      if (text) {
        return extractTimeframe(text)
      }
    }
  }

  return null
}

export function createPlatformDetector(callback: (context: TradingContext) => void) {
  let observer: MutationObserver | null = null
  let lastContext: TradingContext | null = null

  const checkForChanges = () => {
    const currentContext = detectPlatform()
    
    if (currentContext && (!lastContext || 
        currentContext.symbol !== lastContext.symbol || 
        currentContext.timeframe !== lastContext.timeframe)) {
      lastContext = currentContext
      callback(currentContext)
    }
  }

  const startObserving = () => {
    // Initial check
    checkForChanges()

    // Set up mutation observer for DOM changes
    observer = new MutationObserver((mutations) => {
      let shouldCheck = false
      
      for (const mutation of mutations) {
        // Check if URL changed
        if (mutation.type === 'childList' && mutation.target === document.head) {
          shouldCheck = true
          break
        }
        
        // Check if relevant elements changed
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          const target = mutation.target as Element
          if (target.matches && (
            target.matches('.symbol-name, .timeframe-selector, [data-name="symbol"], [data-name="timeframe"]') ||
            target.closest('.symbol-name, .timeframe-selector, [data-name="symbol"], [data-name="timeframe"]')
          )) {
            shouldCheck = true
            break
          }
        }
      }

      if (shouldCheck) {
        // Debounce checks
        setTimeout(checkForChanges, 100)
      }
    })

    // Observe document changes
    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-name', 'data-symbol']
    })

    // Listen for URL changes (for SPA navigation)
    let lastUrl = location.href
    const urlCheckInterval = setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href
        checkForChanges()
      }
    }, 1000)

    // Cleanup function
    return () => {
      if (observer) {
        observer.disconnect()
        observer = null
      }
      clearInterval(urlCheckInterval)
    }
  }

  const cleanup = startObserving()

  return {
    cleanup,
    getCurrentContext: () => lastContext
  }
}

// Global type declarations for TradingView
declare global {
  interface Window {
    TradingView?: {
      widget?: {
        symbol?: string
        interval?: string
      }
    }
  }
}
