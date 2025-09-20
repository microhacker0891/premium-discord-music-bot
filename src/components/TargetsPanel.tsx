import React from 'react'
import { Target, Shield } from 'lucide-react'

export function TargetsPanel() {
  // Mock data - in real implementation, this would come from the analysis worker
  const targets = {
    t1: 1045,
    t2: 1073,
    t3: 1118
  }
  const stopLoss = 1012
  const stopReason = 'ATR*1.7'

  return (
    <div className="sg-targets-panel">
      <div className="sg-panel-header">
        <Target size={16} />
        <span>Targets</span>
      </div>
      
      <div className="sg-targets-grid">
        <div className="sg-target">
          <div className="sg-target-label">T1</div>
          <div className="sg-target-value">{targets.t1}</div>
        </div>
        <div className="sg-target">
          <div className="sg-target-label">T2</div>
          <div className="sg-target-value">{targets.t2}</div>
        </div>
        <div className="sg-target">
          <div className="sg-target-label">T3</div>
          <div className="sg-target-value">{targets.t3}</div>
        </div>
      </div>
      
      <div className="sg-stop-loss">
        <Shield size={14} />
        <span>SL: {stopLoss} ({stopReason})</span>
      </div>
    </div>
  )
}
