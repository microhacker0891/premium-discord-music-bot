import React from 'react'
import { TradingContext } from '@/types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface CompactScoreProps {
  context: TradingContext
}

export function CompactScore({ context }: CompactScoreProps) {
  // Mock data - in real implementation, this would come from the analysis worker
  const confluenceScore = 78
  const momentum = 'strong'
  const volatility = 'medium'
  const atr = 12.4

  const getConfluenceColor = (score: number) => {
    if (score >= 70) return 'sg-confluence-bullish'
    if (score <= 30) return 'sg-confluence-bearish'
    return ''
  }

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case 'strong':
        return <TrendingUp size={14} className="sg-momentum-strong" />
      case 'weak':
        return <TrendingDown size={14} className="sg-momentum-weak" />
      default:
        return <Minus size={14} className="sg-momentum-moderate" />
    }
  }

  const getMomentumClass = (momentum: string) => {
    switch (momentum) {
      case 'strong':
        return 'sg-momentum-strong'
      case 'weak':
        return 'sg-momentum-weak'
      default:
        return 'sg-momentum-moderate'
    }
  }

  return (
    <div className="sg-score-section">
      <div className="sg-score-title">Score</div>
      
      <div className="sg-confluence">
        <div className="sg-confluence-label">Confluence:</div>
        <div className={`sg-confluence-score ${getConfluenceColor(confluenceScore)}`}>
          {confluenceScore}
        </div>
      </div>
      
      <div className="sg-momentum">
        {getMomentumIcon(momentum)}
        <span className={`sg-momentum-label ${getMomentumClass(momentum)}`}>
          {momentum.charAt(0).toUpperCase() + momentum.slice(1)}
        </span>
        <span className="sg-volatility">
          Vol: {volatility.charAt(0).toUpperCase() + volatility.slice(1)} ATR {atr}
        </span>
      </div>
    </div>
  )
}
