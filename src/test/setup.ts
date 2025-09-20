// Test setup file
import { vi } from 'vitest'

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    onConnect: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
    getConnections: vi.fn(() => [])
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
      remove: vi.fn()
    }
  },
  alarms: {
    create: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  permissions: {
    request: vi.fn(),
    contains: vi.fn()
  }
} as any

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN
}))

// Mock fetch
global.fetch = vi.fn()

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}))

// Mock crypto for WebCrypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      generateKey: vi.fn(),
      importKey: vi.fn(),
      exportKey: vi.fn()
    }
  }
})
