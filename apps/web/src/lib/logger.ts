/**
 * Structured logging utility for production-ready APIs
 * Provides consistent logging format with severity levels, timestamps, and correlation IDs
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  correlationId?: string
  userId?: string
  endpoint?: string
  duration?: number
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Generate a correlation ID for request tracking
   */
  generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Format log message with structured data
   */
  private formatLog(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()

    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    }

    // In production, output JSON for log aggregation tools
    if (!this.isDevelopment) {
      return JSON.stringify(logEntry)
    }

    // In development, use readable format
    const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
    return `[${timestamp}] ${level} - ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatLog(LogLevel.DEBUG, message, context))
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatLog(LogLevel.INFO, message, context))
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog(LogLevel.WARN, message, context))
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      } : undefined,
    }
    console.error(this.formatLog(LogLevel.ERROR, message, errorContext))
  }

  /**
   * Log API request start
   */
  apiRequestStart(endpoint: string, method: string, correlationId: string) {
    this.info('API Request Started', {
      endpoint,
      method,
      correlationId,
    })
  }

  /**
   * Log API request completion
   */
  apiRequestEnd(endpoint: string, method: string, statusCode: number, duration: number, correlationId: string) {
    this.info('API Request Completed', {
      endpoint,
      method,
      statusCode,
      duration,
      correlationId,
    })
  }

  /**
   * Log database operation
   */
  dbOperation(operation: string, table: string, duration?: number) {
    this.debug('Database Operation', {
      operation,
      table,
      duration,
    })
  }

  /**
   * Log external API call
   */
  externalApiCall(service: string, endpoint: string, duration?: number) {
    this.info('External API Call', {
      service,
      endpoint,
      duration,
    })
  }
}

export const logger = new Logger()
