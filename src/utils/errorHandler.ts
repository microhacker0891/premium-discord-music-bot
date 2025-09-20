// Error handling utilities for StarkGlass

export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  DATA = 'DATA',
  WORKER = 'WORKER',
  STORAGE = 'STORAGE',
  PLATFORM = 'PLATFORM',
  UNKNOWN = 'UNKNOWN'
}

export interface StarkGlassError {
  type: ErrorType
  message: string
  code?: string
  details?: any
  timestamp: number
  context?: string
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: StarkGlassError[] = []
  private maxLogSize = 100

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  handleError(
    error: Error | StarkGlassError,
    type: ErrorType = ErrorType.UNKNOWN,
    context?: string
  ): void {
    const starkGlassError: StarkGlassError = {
      type: error instanceof Error ? type : error.type,
      message: error.message,
      code: 'code' in error ? error.code : undefined,
      details: 'details' in error ? error.details : undefined,
      timestamp: Date.now(),
      context
    }

    this.logError(starkGlassError)
    this.notifyError(starkGlassError)
  }

  private logError(error: StarkGlassError): void {
    this.errorLog.unshift(error)
    
    // Keep only the most recent errors
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    console.error(`StarkGlass [${error.type}]:`, error.message, error.details)
  }

  private notifyError(error: StarkGlassError): void {
    // Send error to background script for potential reporting
    try {
      chrome.runtime.sendMessage({
        type: 'ERROR_REPORT',
        payload: error
      }).catch(() => {
        // Ignore errors when sending error reports
      })
    } catch (e) {
      // Ignore errors when sending error reports
    }
  }

  getErrors(type?: ErrorType): StarkGlassError[] {
    if (type) {
      return this.errorLog.filter(error => error.type === type)
    }
    return [...this.errorLog]
  }

  clearErrors(): void {
    this.errorLog = []
  }

  getErrorStats(): {
    total: number
    byType: Record<ErrorType, number>
    recent: number
  } {
    const byType = Object.values(ErrorType).reduce((acc, type) => {
      acc[type] = this.errorLog.filter(error => error.type === type).length
      return acc
    }, {} as Record<ErrorType, number>)

    const recent = this.errorLog.filter(
      error => Date.now() - error.timestamp < 3600000 // Last hour
    ).length

    return {
      total: this.errorLog.length,
      byType,
      recent
    }
  }
}

// Convenience functions
export const handleError = (error: Error | StarkGlassError, type?: ErrorType, context?: string) => {
  ErrorHandler.getInstance().handleError(error, type, context)
}

export const logError = (message: string, type: ErrorType = ErrorType.UNKNOWN, details?: any, context?: string) => {
  const error = new Error(message)
  handleError(error, type, context)
}

// Network error handling
export const handleNetworkError = (error: Error, context?: string) => {
  handleError(error, ErrorType.NETWORK, context)
}

// API error handling
export const handleApiError = (error: Error, context?: string) => {
  handleError(error, ErrorType.API, context)
}

// Data error handling
export const handleDataError = (error: Error, context?: string) => {
  handleError(error, ErrorType.DATA, context)
}

// Worker error handling
export const handleWorkerError = (error: Error, context?: string) => {
  handleError(error, ErrorType.WORKER, context)
}

// Storage error handling
export const handleStorageError = (error: Error, context?: string) => {
  handleError(error, ErrorType.STORAGE, context)
}

// Platform error handling
export const handlePlatformError = (error: Error, context?: string) => {
  handleError(error, ErrorType.PLATFORM, context)
}

// Retry utility with exponential backoff
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context?: string
): Promise<T> => {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        handleError(lastError, ErrorType.UNKNOWN, context)
        throw lastError
      }

      const delay = baseDelay * Math.pow(2, attempt)
      console.warn(`StarkGlass: Retry attempt ${attempt + 1}/${maxRetries + 1} after ${delay}ms`, error)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Safe async wrapper
export const safeAsync = async <T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    handleError(error as Error, ErrorType.UNKNOWN, context)
    return fallback
  }
}

// Safe sync wrapper
export const safeSync = <T>(
  fn: () => T,
  fallback: T,
  context?: string
): T => {
  try {
    return fn()
  } catch (error) {
    handleError(error as Error, ErrorType.UNKNOWN, context)
    return fallback
  }
}
