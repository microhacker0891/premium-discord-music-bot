import React, { useState, useEffect } from 'react'
import { Header } from './Header'
import { CompactScore } from './CompactScore'
import { MomentumPanel } from './MomentumPanel'
import { TargetsPanel } from './TargetsPanel'
import { SignalsPanel } from './SignalsPanel'
import { ActionsBar } from './ActionsBar'
import { useStarkGlassStore } from '@/utils/store'

export function OverlayRoot() {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const { context, settings } = useStarkGlassStore()

  useEffect(() => {
    // Listen for keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + A to toggle overlay
      if (event.altKey && event.key === 'a') {
        event.preventDefault()
        setIsVisible(prev => !prev)
      }
      
      // Alt + E to toggle expanded mode
      if (event.altKey && event.key === 'e') {
        event.preventDefault()
        setIsExpanded(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isVisible) {
    return (
      <div className="sg-container sg-compact">
        <div className="sg-minimized" onClick={() => setIsVisible(true)}>
          <span className="sg-title">StarkGlass</span>
        </div>
      </div>
    )
  }

  if (!context) {
    return (
      <div className="sg-container">
        <div className="sg-content">
          <div className="sg-no-context">
            <h3>No Trading Context Detected</h3>
            <p>Please navigate to a supported trading platform or manually enter symbol and timeframe.</p>
            <button className="sg-btn-primary">Manual Entry</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`sg-container ${isExpanded ? 'sg-expanded' : 'sg-compact'} sg-fade-in`}>
      <Header 
        context={context}
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded(!isExpanded)}
        onClose={() => setIsVisible(false)}
      />
      
      <div className="sg-content">
        <CompactScore context={context} />
        
        {isExpanded && (
          <>
            <MomentumPanel />
            <TargetsPanel />
            <SignalsPanel />
          </>
        )}
        
        <ActionsBar isExpanded={isExpanded} />
      </div>
    </div>
  )
}
