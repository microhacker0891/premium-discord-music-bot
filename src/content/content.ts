import React from 'react'
import { createRoot } from 'react-dom/client'
import { OverlayRoot } from '@/components/OverlayRoot'
import { detectPlatform, createPlatformDetector } from '@/utils/platformDetection'
import { TradingContext } from '@/types'

class StarkGlassContentScript {
  private shadowRoot: ShadowRoot | null = null
  private reactRoot: any = null
  private platformDetector: any = null
  private isInitialized = false

  constructor() {
    this.init()
  }

  private async init() {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup())
      } else {
        this.setup()
      }
    } catch (error) {
      console.error('StarkGlass: Failed to initialize content script', error)
    }
  }

  private setup() {
    if (this.isInitialized) return

    // Detect platform and context
    const context = detectPlatform()
    if (!context) {
      console.log('StarkGlass: Platform not supported or context not detected')
      return
    }

    console.log('StarkGlass: Detected context', context)

    // Create shadow DOM container
    this.createShadowContainer()

    // Mount React app
    this.mountReactApp()

    // Set up platform detection observer
    this.setupPlatformObserver()

    // Notify background script
    this.notifyBackground('CONTEXT_DETECTED', context)

    this.isInitialized = true
  }

  private createShadowContainer() {
    // Create mount point
    const mount = document.createElement('div')
    mount.id = 'starkglass-mount'
    mount.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483640;
    `

    // Create shadow root
    this.shadowRoot = mount.attachShadow({ mode: 'open' })

    // Add styles
    const style = document.createElement('link')
    style.rel = 'stylesheet'
    style.href = chrome.runtime.getURL('content.css')
    this.shadowRoot.appendChild(style)

    // Add container for React app
    const appContainer = document.createElement('div')
    appContainer.id = 'starkglass-root'
    appContainer.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      pointer-events: auto;
    `
    this.shadowRoot.appendChild(appContainer)

    // Append to document
    document.documentElement.appendChild(mount)
  }

  private mountReactApp() {
    if (!this.shadowRoot) return

    const appContainer = this.shadowRoot.getElementById('starkglass-root')
    if (!appContainer) return

    this.reactRoot = createRoot(appContainer)
    this.reactRoot.render(React.createElement(OverlayRoot))
  }

  private setupPlatformObserver() {
    this.platformDetector = createPlatformDetector((context: TradingContext) => {
      console.log('StarkGlass: Context changed', context)
      this.notifyBackground('CONTEXT_CHANGED', context)
    })
  }

  private notifyBackground(type: string, payload: any) {
    chrome.runtime.sendMessage({ type, payload }).catch((error) => {
      console.error('StarkGlass: Failed to send message to background', error)
    })
  }

  public destroy() {
    if (this.reactRoot) {
      this.reactRoot.unmount()
      this.reactRoot = null
    }

    if (this.platformDetector) {
      this.platformDetector.cleanup()
      this.platformDetector = null
    }

    const mount = document.getElementById('starkglass-mount')
    if (mount) {
      mount.remove()
    }

    this.isInitialized = false
  }
}

// Initialize content script
const starkGlass = new StarkGlassContentScript()

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  starkGlass.destroy()
})

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause updates when tab is hidden
    chrome.runtime.sendMessage({ type: 'PAUSE_UPDATES' })
  } else {
    // Resume updates when tab becomes visible
    chrome.runtime.sendMessage({ type: 'RESUME_UPDATES' })
  }
})

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'DATA_UPDATE':
      // Handle data updates from background
      break
    case 'SETTINGS_UPDATE':
      // Handle settings updates
      break
    case 'TOGGLE_OVERLAY':
      // Toggle overlay visibility
      break
    default:
      break
  }
})

export {}
