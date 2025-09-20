import { expose } from 'comlink'
import { Candle, IndicatorData, ConfluenceData, PredictionData, MarketStructure, Settings } from '@/types'

class AnalysisWorker {
  private data: Map<string, Candle[]> = new Map()
  private indicators: Map<string, IndicatorData> = new Map()
  private confluence: Map<string, ConfluenceData> = new Map()
  private predictions: Map<string, PredictionData> = new Map()
  private settings: Settings | null = null

  async onBackfill(symbol: string, timeframe: string, candles: Candle[]): Promise<void> {
    const key = `${symbol}@${timeframe}`
    this.data.set(key, candles)
    
    // Compute indicators for backfill data
    await this.computeIndicators(symbol, timeframe)
    await this.computeConfluence(symbol, timeframe)
    await this.computePrediction(symbol, timeframe)
  }

  async onTick(symbol: string, timeframe: string, candle: Candle): Promise<void> {
    const key = `${symbol}@${timeframe}`
    const existingData = this.data.get(key) || []
    
    // Update the last candle or add new one
    if (existingData.length > 0) {
      const lastCandle = existingData[existingData.length - 1]
      if (lastCandle.ts === candle.ts) {
        // Update existing candle
        existingData[existingData.length - 1] = candle
      } else {
        // Add new candle
        existingData.push(candle)
      }
    } else {
      existingData.push(candle)
    }
    
    this.data.set(key, existingData)
    
    // Recompute indicators
    await this.computeIndicators(symbol, timeframe)
    await this.computeConfluence(symbol, timeframe)
    await this.computePrediction(symbol, timeframe)
  }

  async getSnapshot(symbol: string, timeframe: string): Promise<{
    indicators: IndicatorData
    structure: MarketStructure
    confluence: ConfluenceData
    prediction: PredictionData
  }> {
    const key = `${symbol}@${timeframe}`
    
    return {
      indicators: this.indicators.get(key) || this.getDefaultIndicators(),
      structure: this.computeMarketStructure(symbol, timeframe),
      confluence: this.confluence.get(key) || this.getDefaultConfluence(),
      prediction: this.predictions.get(key) || this.getDefaultPrediction()
    }
  }

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    if (this.settings) {
      this.settings = { ...this.settings, ...settings }
    } else {
      this.settings = settings as Settings
    }
  }

  private async computeIndicators(symbol: string, timeframe: string): Promise<void> {
    const key = `${symbol}@${timeframe}`
    const candles = this.data.get(key) || []
    
    if (candles.length < 50) return // Need minimum data

    const closes = candles.map(c => c.c)
    const highs = candles.map(c => c.h)
    const lows = candles.map(c => c.l)
    const volumes = candles.map(c => c.v)

    const rsi = this.computeRSI(closes, 14)
    const macd = this.computeMACD(closes, 12, 26, 9)
    const adx = this.computeADX(highs, lows, closes, 21)
    const ema = this.computeEMA(closes, [20, 50, 200])
    const atr = this.computeATR(highs, lows, closes, 14)
    const supertrend = this.computeSupertrend(highs, lows, closes, 10, 3)
    const vwap = this.computeVWAP(candles)
    const volume = this.computeVolumeAnalysis(volumes)

    const indicators: IndicatorData = {
      rsi: rsi[rsi.length - 1] || 50,
      macd: {
        macd: macd.macd[macd.macd.length - 1] || 0,
        signal: macd.signal[macd.signal.length - 1] || 0,
        histogram: macd.histogram[macd.histogram.length - 1] || 0
      },
      adx: {
        adx: adx.adx[adx.adx.length - 1] || 0,
        diPlus: adx.diPlus[adx.diPlus.length - 1] || 0,
        diMinus: adx.diMinus[adx.diMinus.length - 1] || 0
      },
      ema: {
        ema20: ema[0][ema[0].length - 1] || 0,
        ema50: ema[1][ema[1].length - 1] || 0,
        ema200: ema[2][ema[2].length - 1] || 0
      },
      atr: atr[atr.length - 1] || 0,
      supertrend: {
        value: supertrend.value[supertrend.value.length - 1] || 0,
        direction: supertrend.direction[supertrend.direction.length - 1] || 'up'
      },
      vwap: vwap[vwap.length - 1] || 0,
      volume: {
        current: volumes[volumes.length - 1] || 0,
        average: volume.average,
        spike: volume.spike
      }
    }

    this.indicators.set(key, indicators)
  }

  private async computeConfluence(symbol: string, timeframe: string): Promise<void> {
    const key = `${symbol}@${timeframe}`
    const indicators = this.indicators.get(key)
    const candles = this.data.get(key) || []
    
    if (!indicators || candles.length < 50) return

    // Detect regime
    const regime = this.detectRegime(indicators, candles)
    
    // Get weights based on regime
    const weights = regime === 'trend' 
      ? this.settings?.confluence.trendWeights || {}
      : this.settings?.confluence.rangeWeights || {}

    // Compute individual scores
    const scores = {
      ema: this.scoreEMA(indicators.ema, candles[candles.length - 1].c),
      adx: this.scoreADX(indicators.adx),
      macd: this.scoreMACD(indicators.macd),
      supertrend: this.scoreSupertrend(indicators.supertrend, candles[candles.length - 1].c),
      volume: this.scoreVolume(indicators.volume),
      structure: this.scoreStructure(candles),
      rsi: this.scoreRSI(indicators.rsi),
      vwap: this.scoreVWAP(indicators.vwap, candles[candles.length - 1].c)
    }

    // Weighted confluence score
    let confluenceScore = 0
    let totalWeight = 0

    for (const [indicator, score] of Object.entries(scores)) {
      const weight = weights[indicator] || 0
      confluenceScore += score * weight
      totalWeight += weight
    }

    confluenceScore = totalWeight > 0 ? (confluenceScore / totalWeight) * 100 : 50

    // Determine momentum
    const momentum = this.determineMomentum(indicators, confluenceScore)
    
    // Determine volatility
    const volatility = this.determineVolatility(indicators.atr, candles)

    const confluence: ConfluenceData = {
      score: Math.round(confluenceScore),
      regime,
      momentum,
      volatility,
      atr: indicators.atr
    }

    this.confluence.set(key, confluence)
  }

  private async computePrediction(symbol: string, timeframe: string): Promise<void> {
    const key = `${symbol}@${timeframe}`
    const candles = this.data.get(key) || []
    const indicators = this.indicators.get(key)
    
    if (!indicators || candles.length < 50) return

    // Kalman nowcast
    const nowcast = this.computeKalmanNowcast(candles.map(c => c.c))
    
    // Ridge regression prediction
    const prediction = this.computeRidgePrediction(candles, indicators)
    
    // Compute targets and stops
    const targets = this.computeTargets(candles, prediction)
    const stops = this.computeStops(candles, indicators)

    const predictionData: PredictionData = {
      nowcast,
      targets,
      stops,
      confidence: this.computeConfidence(indicators, candles),
      horizon: 3
    }

    this.predictions.set(key, predictionData)
  }

  // Technical indicator implementations
  private computeRSI(closes: number[], period: number): number[] {
    const rsi: number[] = []
    const gains: number[] = []
    const losses: number[] = []

    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1]
      gains.push(change > 0 ? change : 0)
      losses.push(change < 0 ? -change : 0)
    }

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period

      const rs = avgGain / (avgLoss || 0.0001)
      const rsiValue = 100 - (100 / (1 + rs))
      rsi.push(rsiValue)
    }

    return rsi
  }

  private computeMACD(closes: number[], fast: number, slow: number, signal: number): {
    macd: number[]
    signal: number[]
    histogram: number[]
  } {
    const emaFast = this.computeEMA(closes, [fast])[0]
    const emaSlow = this.computeEMA(closes, [slow])[0]
    
    const macd: number[] = []
    for (let i = 0; i < emaFast.length; i++) {
      macd.push(emaFast[i] - emaSlow[i])
    }

    const signalLine = this.computeEMA(macd, [signal])[0]
    const histogram: number[] = []
    
    for (let i = 0; i < macd.length; i++) {
      histogram.push(macd[i] - (signalLine[i] || 0))
    }

    return { macd, signal: signalLine, histogram }
  }

  private computeADX(highs: number[], lows: number[], closes: number[], period: number): {
    adx: number[]
    diPlus: number[]
    diMinus: number[]
  } {
    const tr = this.computeTrueRange(highs, lows, closes)
    const dmPlus = this.computeDMPositive(highs, lows)
    const dmMinus = this.computeDMNegative(highs, lows)

    const diPlus = this.computeDI(dmPlus, tr, period)
    const diMinus = this.computeDI(dmMinus, tr, period)
    const adx = this.computeADXFromDI(diPlus, diMinus, period)

    return { adx, diPlus, diMinus }
  }

  private computeEMA(data: number[], periods: number[]): number[][] {
    const results: number[][] = []
    
    for (const period of periods) {
      const ema: number[] = []
      const multiplier = 2 / (period + 1)
      
      ema[0] = data[0]
      
      for (let i = 1; i < data.length; i++) {
        ema[i] = (data[i] * multiplier) + (ema[i - 1] * (1 - multiplier))
      }
      
      results.push(ema)
    }
    
    return results
  }

  private computeATR(highs: number[], lows: number[], closes: number[], period: number): number[] {
    const tr = this.computeTrueRange(highs, lows, closes)
    return this.computeSMA(tr, period)
  }

  private computeSupertrend(highs: number[], lows: number[], closes: number[], atrPeriod: number, multiplier: number): {
    value: number[]
    direction: ('up' | 'down')[]
  } {
    const atr = this.computeATR(highs, lows, closes, atrPeriod)
    const value: number[] = []
    const direction: ('up' | 'down')[] = []

    for (let i = 0; i < closes.length; i++) {
      const hl2 = (highs[i] + lows[i]) / 2
      const upper = hl2 + (atr[i] * multiplier)
      const lower = hl2 - (atr[i] * multiplier)

      if (i === 0) {
        value[i] = upper
        direction[i] = 'up'
      } else {
        const prevValue = value[i - 1]
        const prevDirection = direction[i - 1]

        if (prevDirection === 'up' && closes[i] <= lower) {
          value[i] = lower
          direction[i] = 'down'
        } else if (prevDirection === 'down' && closes[i] >= upper) {
          value[i] = upper
          direction[i] = 'up'
        } else {
          value[i] = prevValue
          direction[i] = prevDirection
        }
      }
    }

    return { value, direction }
  }

  private computeVWAP(candles: Candle[]): number[] {
    const vwap: number[] = []
    let cumulativeVolume = 0
    let cumulativeVolumePrice = 0

    for (const candle of candles) {
      const typicalPrice = (candle.h + candle.l + candle.c) / 3
      cumulativeVolume += candle.v
      cumulativeVolumePrice += typicalPrice * candle.v
      vwap.push(cumulativeVolumePrice / cumulativeVolume)
    }

    return vwap
  }

  private computeVolumeAnalysis(volumes: number[]): { average: number; spike: boolean } {
    const average = volumes.reduce((a, b) => a + b, 0) / volumes.length
    const current = volumes[volumes.length - 1] || 0
    const spike = current > average * 1.5

    return { average, spike }
  }

  // Helper methods for technical indicators
  private computeTrueRange(highs: number[], lows: number[], closes: number[]): number[] {
    const tr: number[] = []
    
    for (let i = 0; i < highs.length; i++) {
      if (i === 0) {
        tr[i] = highs[i] - lows[i]
      } else {
        const hl = highs[i] - lows[i]
        const hc = Math.abs(highs[i] - closes[i - 1])
        const lc = Math.abs(lows[i] - closes[i - 1])
        tr[i] = Math.max(hl, hc, lc)
      }
    }
    
    return tr
  }

  private computeDMPositive(highs: number[], lows: number[]): number[] {
    const dmPlus: number[] = []
    
    for (let i = 1; i < highs.length; i++) {
      const highDiff = highs[i] - highs[i - 1]
      const lowDiff = lows[i - 1] - lows[i]
      
      if (highDiff > lowDiff && highDiff > 0) {
        dmPlus[i] = highDiff
      } else {
        dmPlus[i] = 0
      }
    }
    
    return dmPlus
  }

  private computeDMNegative(highs: number[], lows: number[]): number[] {
    const dmMinus: number[] = []
    
    for (let i = 1; i < highs.length; i++) {
      const highDiff = highs[i] - highs[i - 1]
      const lowDiff = lows[i - 1] - lows[i]
      
      if (lowDiff > highDiff && lowDiff > 0) {
        dmMinus[i] = lowDiff
      } else {
        dmMinus[i] = 0
      }
    }
    
    return dmMinus
  }

  private computeDI(dm: number[], tr: number[], period: number): number[] {
    const di: number[] = []
    const smoothedDM = this.computeSMA(dm, period)
    const smoothedTR = this.computeSMA(tr, period)
    
    for (let i = 0; i < smoothedDM.length; i++) {
      di[i] = 100 * (smoothedDM[i] / (smoothedTR[i] || 0.0001))
    }
    
    return di
  }

  private computeADXFromDI(diPlus: number[], diMinus: number[], period: number): number[] {
    const dx: number[] = []
    const adx: number[] = []
    
    for (let i = 0; i < diPlus.length; i++) {
      const sum = diPlus[i] + diMinus[i]
      dx[i] = 100 * Math.abs(diPlus[i] - diMinus[i]) / (sum || 0.0001)
    }
    
    const smoothedDX = this.computeSMA(dx, period)
    
    for (let i = 0; i < smoothedDX.length; i++) {
      adx[i] = smoothedDX[i]
    }
    
    return adx
  }

  private computeSMA(data: number[], period: number): number[] {
    const sma: number[] = []
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      sma[i] = sum / period
    }
    
    return sma
  }

  // Scoring methods for confluence
  private scoreEMA(ema: any, currentPrice: number): number {
    const { ema20, ema50, ema200 } = ema
    let score = 0

    // EMA alignment
    if (ema20 > ema50 && ema50 > ema200) score += 25
    else if (ema20 < ema50 && ema50 < ema200) score += 25

    // Price vs EMA
    if (currentPrice > ema20) score += 25
    else if (currentPrice < ema20) score += 25

    // EMA slope
    const slope20 = ema20 > 0 ? (ema20 - ema50) / ema50 : 0
    if (Math.abs(slope20) > 0.01) score += 25

    return Math.min(score, 100)
  }

  private scoreADX(adx: any): number {
    const { adx: adxValue, diPlus, diMinus } = adx
    
    if (adxValue > 25) {
      return diPlus > diMinus ? 100 : 0
    } else if (adxValue > 20) {
      return diPlus > diMinus ? 75 : 25
    } else {
      return 50
    }
  }

  private scoreMACD(macd: any): number {
    const { macd: macdValue, signal, histogram } = macd
    
    if (macdValue > signal && histogram > 0) return 100
    if (macdValue < signal && histogram < 0) return 0
    if (macdValue > signal) return 75
    if (macdValue < signal) return 25
    return 50
  }

  private scoreSupertrend(supertrend: any, currentPrice: number): number {
    const { value, direction } = supertrend
    
    if (direction === 'up' && currentPrice > value) return 100
    if (direction === 'down' && currentPrice < value) return 0
    return 50
  }

  private scoreVolume(volume: any): number {
    if (volume.spike) return 100
    if (volume.current > volume.average * 1.2) return 75
    if (volume.current > volume.average) return 50
    return 25
  }

  private scoreStructure(candles: Candle[]): number {
    // Simplified structure scoring
    if (candles.length < 10) return 50
    
    const recent = candles.slice(-10)
    const highs = recent.map(c => c.h)
    const lows = recent.map(c => c.l)
    
    const highestHigh = Math.max(...highs)
    const lowestLow = Math.min(...lows)
    const currentPrice = candles[candles.length - 1].c
    
    // Higher highs, higher lows = bullish
    if (currentPrice > highestHigh * 0.95) return 100
    if (currentPrice < lowestLow * 1.05) return 0
    return 50
  }

  private scoreRSI(rsi: number): number {
    if (rsi > 70) return 0 // Overbought
    if (rsi < 30) return 100 // Oversold
    if (rsi > 50) return 75
    return 25
  }

  private scoreVWAP(vwap: number, currentPrice: number): number {
    if (currentPrice > vwap) return 75
    if (currentPrice < vwap) return 25
    return 50
  }

  // Regime detection
  private detectRegime(indicators: IndicatorData, candles: Candle[]): 'trend' | 'range' {
    const { adx } = indicators
    const { adx: adxValue } = adx
    
    // Simple regime detection based on ADX
    if (adxValue > 25) return 'trend'
    return 'range'
  }

  // Momentum determination
  private determineMomentum(indicators: IndicatorData, confluenceScore: number): 'strong' | 'moderate' | 'weak' {
    if (confluenceScore > 75) return 'strong'
    if (confluenceScore > 50) return 'moderate'
    return 'weak'
  }

  // Volatility determination
  private determineVolatility(atr: number, candles: Candle[]): 'high' | 'medium' | 'low' {
    if (candles.length < 20) return 'medium'
    
    const recentPrices = candles.slice(-20).map(c => c.c)
    const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length
    const atrPercent = (atr / avgPrice) * 100
    
    if (atrPercent > 3) return 'high'
    if (atrPercent > 1.5) return 'medium'
    return 'low'
  }

  // Prediction methods
  private computeKalmanNowcast(prices: number[]): number {
    // Simplified Kalman filter for nowcast
    if (prices.length < 2) return 0
    
    const returns = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    return avgReturn * 100 // Convert to percentage
  }

  private computeRidgePrediction(candles: Candle[], indicators: IndicatorData): number {
    // Simplified ridge regression prediction
    const features = [
      indicators.rsi / 100,
      indicators.macd.macd,
      indicators.adx.adx / 100,
      indicators.volume.current / indicators.volume.average
    ]
    
    // Simple linear combination (in practice, this would be trained)
    const weights = [0.3, 0.2, 0.2, 0.3]
    const prediction = features.reduce((sum, feature, i) => sum + feature * weights[i], 0)
    
    return prediction * 100 // Convert to percentage
  }

  private computeTargets(candles: Candle[], prediction: number): { t1: number; t2: number; t3: number } {
    const currentPrice = candles[candles.length - 1].c
    const move = currentPrice * (prediction / 100)
    
    return {
      t1: Math.round(currentPrice + move * 0.5),
      t2: Math.round(currentPrice + move),
      t3: Math.round(currentPrice + move * 1.5)
    }
  }

  private computeStops(candles: Candle[], indicators: IndicatorData): { sl: number; reason: string } {
    const currentPrice = candles[candles.length - 1].c
    const atr = indicators.atr
    const multiplier = this.settings?.risk.atrMultiplier || 1.7
    
    const sl = Math.round(currentPrice - (atr * multiplier))
    
    return {
      sl,
      reason: `ATR*${multiplier}`
    }
  }

  private computeConfidence(indicators: IndicatorData, candles: Candle[]): number {
    // Simple confidence calculation based on indicator agreement
    let confidence = 50
    
    // RSI confidence
    if (indicators.rsi > 30 && indicators.rsi < 70) confidence += 10
    
    // ADX confidence
    if (indicators.adx.adx > 20) confidence += 15
    
    // Volume confidence
    if (indicators.volume.spike) confidence += 10
    
    // MACD confidence
    if (Math.abs(indicators.macd.histogram) > 0.1) confidence += 15
    
    return Math.min(confidence, 100)
  }

  private computeMarketStructure(candles: Candle[]): MarketStructure {
    if (candles.length < 20) {
      return {
        highs: [],
        lows: [],
        hh: false,
        hl: false,
        lh: false,
        ll: false,
        trend: 'sideways'
      }
    }
    
    // Simplified market structure analysis
    const recent = candles.slice(-20)
    const highs = recent.map(c => c.h)
    const lows = recent.map(c => c.l)
    
    const highestHigh = Math.max(...highs)
    const lowestLow = Math.min(...lows)
    const currentPrice = candles[candles.length - 1].c
    
    let trend: 'bullish' | 'bearish' | 'sideways' = 'sideways'
    if (currentPrice > highestHigh * 0.95) trend = 'bullish'
    else if (currentPrice < lowestLow * 1.05) trend = 'bearish'
    
    return {
      highs: [highestHigh],
      lows: [lowestLow],
      hh: trend === 'bullish',
      hl: trend === 'bullish',
      lh: trend === 'bearish',
      ll: trend === 'bearish',
      trend
    }
  }

  // Default values
  private getDefaultIndicators(): IndicatorData {
    return {
      rsi: 50,
      macd: { macd: 0, signal: 0, histogram: 0 },
      adx: { adx: 0, diPlus: 0, diMinus: 0 },
      ema: { ema20: 0, ema50: 0, ema200: 0 },
      atr: 0,
      supertrend: { value: 0, direction: 'up' },
      vwap: 0,
      volume: { current: 0, average: 0, spike: false }
    }
  }

  private getDefaultConfluence(): ConfluenceData {
    return {
      score: 50,
      regime: 'range',
      momentum: 'moderate',
      volatility: 'medium',
      atr: 0
    }
  }

  private getDefaultPrediction(): PredictionData {
    return {
      nowcast: 0,
      targets: { t1: 0, t2: 0, t3: 0 },
      stops: { sl: 0, reason: 'N/A' },
      confidence: 50,
      horizon: 3
    }
  }
}

// Expose the worker API
expose(new AnalysisWorker())
