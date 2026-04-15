/**
 * useErrorBoundary.ts - 错误边界 Composable
 * 统一的错误处理
 */
import { ref } from 'vue'

export interface ErrorInfo {
  message: string
  stack?: string
  timestamp: number
}

export function useErrorBoundary() {
  const errors = ref<ErrorInfo[]>([])
  const hasError = ref(false)

  function handleError(error: unknown, context: string = 'Unknown') {
    const errorInfo: ErrorInfo = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now()
    }

    errors.value.push(errorInfo)
    hasError.value = true

    // Log to console for debugging
    console.error(`[${context}] Error:`, error)

    return errorInfo
  }

  function clearErrors() {
    errors.value = []
    hasError.value = false
  }

  function getLatestError(): ErrorInfo | null {
    return errors.value.length > 0 ? errors.value[errors.value.length - 1] : null
  }

  return {
    errors,
    hasError,
    handleError,
    clearErrors,
    getLatestError
  }
}

// Wrapper for async functions with error handling
export function withErrorHandler<T extends (...args: unknown[]) => unknown>(
  fn: T,
  errorHandler: (error: unknown) => void
): T {
  return ((...args: unknown[]) => {
    try {
      const result = fn(...args)
      if (result instanceof Promise) {
        return result.catch(errorHandler)
      }
      return result
    } catch (error) {
      errorHandler(error)
      throw error
    }
  }) as T
}
