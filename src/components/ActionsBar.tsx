import React from 'react'
import { Settings, Download, Bell, Maximize2 } from 'lucide-react'

interface ActionsBarProps {
  isExpanded: boolean
}

export function ActionsBar({ isExpanded }: ActionsBarProps) {
  const handleSettings = () => {
    // Open settings modal
    console.log('Open settings')
  }

  const handleExport = () => {
    // Export data
    console.log('Export data')
  }

  const handleAlerts = () => {
    // Create alert
    console.log('Create alert')
  }

  const handleExpand = () => {
    // Toggle expanded mode
    console.log('Toggle expanded mode')
  }

  return (
    <div className="sg-actions">
      <button 
        className="sg-btn-secondary"
        onClick={handleSettings}
        title="Settings"
      >
        <Settings size={14} />
        {isExpanded && <span>Settings</span>}
      </button>
      
      <button 
        className="sg-btn-secondary"
        onClick={handleExport}
        title="Export Data"
      >
        <Download size={14} />
        {isExpanded && <span>Export</span>}
      </button>
      
      <button 
        className="sg-btn-secondary"
        onClick={handleAlerts}
        title="Create Alert"
      >
        <Bell size={14} />
        {isExpanded && <span>Alert</span>}
      </button>
      
      {!isExpanded && (
        <button 
          className="sg-btn-secondary"
          onClick={handleExpand}
          title="Expand"
        >
          <Maximize2 size={14} />
        </button>
      )}
    </div>
  )
}
