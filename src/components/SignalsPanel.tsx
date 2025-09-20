import React from 'react'
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

export function SignalsPanel() {
  // Mock data - in real implementation, this would come from the analysis worker
  const signals = [
    {
      type: 'breakout',
      direction: 'bullish',
      message: 'Breakout > 1,032 @ 10:15',
      time: '10:15'
    },
    {
      type: 'fvg',
      direction: 'bullish',
      message: 'FVG filled @ 10:05',
      time: '10:05'
    },
    {
      type: 'resistance',
      direction: 'bearish',
      message: 'Resistance at 1,040',
      time: '10:00'
    }
  ]

  const getSignalIcon = (type: string, direction: string) => {
    switch (type) {
      case 'breakout':
        return direction === 'bullish' ? 
          <CheckCircle size={14} /> : 
          <XCircle size={14} />
      case 'fvg':
        return <AlertTriangle size={14} />
      default:
        return <Clock size={14} />
    }
  }

  const getSignalClass = (direction: string) => {
    return direction === 'bullish' ? 'sg-signal-bullish' : 'sg-signal-bearish'
  }

  return (
    <div className="sg-signals-panel">
      <div className="sg-panel-header">
        <AlertTriangle size={16} />
        <span>Signals</span>
      </div>
      
      <div className="sg-signals-list">
        {signals.map((signal, index) => (
          <div key={index} className={`sg-signal ${getSignalClass(signal.direction)}`}>
            <div className="sg-signal-icon">
              {getSignalIcon(signal.type, signal.direction)}
            </div>
            <div className="sg-signal-content">
              <div className="sg-signal-message">{signal.message}</div>
              <div className="sg-signal-time">{signal.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
