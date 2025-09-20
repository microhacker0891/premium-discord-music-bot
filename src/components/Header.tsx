import React from 'react'
import { TradingContext } from '@/types'
import { Pin, X, Maximize2, Minimize2 } from 'lucide-react'

interface HeaderProps {
  context: TradingContext
  isExpanded: boolean
  onToggleExpanded: () => void
  onClose: () => void
}

export function Header({ context, isExpanded, onToggleExpanded, onClose }: HeaderProps) {
  const formatSymbol = (symbol: string) => {
    // Format symbol for display (e.g., NSE:ADANIGREEN -> ADANIGREEN)
    return symbol.split(':').pop() || symbol
  }

  const formatTimeframe = (timeframe: string) => {
    const tf = parseInt(timeframe)
    if (tf < 60) return `${tf}m`
    if (tf < 1440) return `${Math.floor(tf / 60)}h`
    if (tf < 10080) return `${Math.floor(tf / 1440)}d`
    return `${Math.floor(tf / 10080)}w`
  }

  return (
    <div className="sg-header">
      <div className="sg-header-left">
        <h2 className="sg-title">StarkGlass</h2>
        <span className="sg-symbol">
          {formatSymbol(context.symbol)} {formatTimeframe(context.timeframe)}
        </span>
      </div>
      
      <div className="sg-controls">
        <button 
          className="sg-btn" 
          onClick={onToggleExpanded}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        
        <button 
          className="sg-btn" 
          title="Pin to chart"
        >
          <Pin size={16} />
        </button>
        
        <button 
          className="sg-btn" 
          onClick={onClose}
          title="Close overlay"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
