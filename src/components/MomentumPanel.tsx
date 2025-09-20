import React from 'react'
import { TrendingUp, BarChart3 } from 'lucide-react'

export function MomentumPanel() {
  // Mock data - in real implementation, this would come from the analysis worker
  const nowcast = 0.9
  const forecast = 1.2
  const confidence = 85

  return (
    <div className="sg-momentum-panel">
      <div className="sg-panel-header">
        <BarChart3 size={16} />
        <span>Momentum Nowcast</span>
      </div>
      
      <div className="sg-momentum-chart">
        <div className="sg-chart-placeholder">
          <TrendingUp size={24} />
          <span>Momentum Curve (60 bars)</span>
        </div>
      </div>
      
      <div className="sg-momentum-stats">
        <div className="sg-stat">
          <span className="sg-stat-label">Nowcast:</span>
          <span className="sg-stat-value">{nowcast.toFixed(1)}σ</span>
        </div>
        <div className="sg-stat">
          <span className="sg-stat-label">Forecast:</span>
          <span className="sg-stat-value">{forecast.toFixed(1)}σ</span>
        </div>
        <div className="sg-stat">
          <span className="sg-stat-label">Confidence:</span>
          <span className="sg-stat-value">{confidence}%</span>
        </div>
      </div>
    </div>
  )
}
