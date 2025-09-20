// Performance monitoring utilities for StarkGlass

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  context?: string
}

export interface MemoryUsage {
  used: number
  total: number
  percentage: number
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000
  private memoryThreshold = 100 * 1024 * 1024 // 100MB

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Measure function execution time
  measure<T>(name: string, fn: () => T, context?: string): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    this.recordMetric({
      name,
      duration,
      timestamp: Date.now(),
      context
    })

    return result
  }

  // Measure async function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>, context?: string): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    this.recordMetric({
      name,
      duration,
      timestamp: Date.now(),
      context
    })

    return result
  }

  // Record a custom metric
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.unshift(metric)
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics)
    }

    // Log slow operations
    if (metric.duration > 100) {
      console.warn(`StarkGlass: Slow operation detected - ${metric.name}: ${metric.duration.toFixed(2)}ms`, metric.context)
    }
  }

  // Get metrics by name
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name)
    }
    return [...this.metrics]
  }

  // Get average duration for a metric
  getAverageDuration(name: string): number {
    const metrics = this.getMetrics(name)
    if (metrics.length === 0) return 0
    
    const total = metrics.reduce((sum, metric) => sum + metric.duration, 0)
    return total / metrics.length
  }

  // Get performance statistics
  getStats(): {
    totalMetrics: number
    averageDuration: number
    slowestOperations: PerformanceMetric[]
    memoryUsage: MemoryUsage
  } {
    const totalMetrics = this.metrics.length
    const averageDuration = totalMetrics > 0 
      ? this.metrics.reduce((sum, metric) => sum + metric.duration, 0) / totalMetrics
      : 0

    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)

    const memoryUsage = this.getMemoryUsage()

    return {
      totalMetrics,
      averageDuration,
      slowestOperations,
      memoryUsage
    }
  }

  // Monitor memory usage
  getMemoryUsage(): MemoryUsage {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const used = memory.usedJSHeapSize
      const total = memory.totalJSHeapSize
      const percentage = (used / total) * 100

      return { used, total, percentage }
    }

    // Fallback estimation
    return {
      used: 0,
      total: 0,
      percentage: 0
    }
  }

  // Check if memory usage is high
  isMemoryHigh(): boolean {
    const memory = this.getMemoryUsage()
    return memory.used > this.memoryThreshold
  }

  // Clear old metrics
  clearOldMetrics(olderThan: number = 3600000): void { // 1 hour
    const cutoff = Date.now() - olderThan
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff)
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = []
  }

  // Start performance monitoring
  startMonitoring(): void {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      if (this.isMemoryHigh()) {
        console.warn('StarkGlass: High memory usage detected', this.getMemoryUsage())
        this.clearOldMetrics()
      }
    }, 30000)

    // Clear old metrics every 5 minutes
    setInterval(() => {
      this.clearOldMetrics()
    }, 300000)
  }
}

// Convenience functions
export const measure = <T>(name: string, fn: () => T, context?: string): T => {
  return PerformanceMonitor.getInstance().measure(name, fn, context)
}

export const measureAsync = <T>(name: string, fn: () => Promise<T>, context?: string): Promise<T> => {
  return PerformanceMonitor.getInstance().measureAsync(name, fn, context)
}

export const recordMetric = (metric: PerformanceMetric): void => {
  PerformanceMonitor.getInstance().recordMetric(metric)
}

// Performance decorators
export function measureMethod(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const methodName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = function (...args: any[]) {
      return measure(methodName, () => originalMethod.apply(this, args))
    }

    return descriptor
  }
}

export function measureAsyncMethod(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const methodName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = function (...args: any[]) {
      return measureAsync(methodName, () => originalMethod.apply(this, args))
    }

    return descriptor
  }
}

// Initialize performance monitoring
const performanceMonitor = PerformanceMonitor.getInstance()
performanceMonitor.startMonitoring()
