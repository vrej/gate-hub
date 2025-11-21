// Client-side error logging utility

interface ClientErrorLog {
  level?: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: string;
  metadata?: any;
}

export async function logClientError(errorData: ClientErrorLog): Promise<void> {
  try {
    await fetch('/api/error-logs-client', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...errorData,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (logError) {
    console.error('Failed to log client error:', logError);
  }
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    logClientError({
      level: 'error',
      message: `Unhandled Error: ${event.message}`,
      stack: event.error?.stack,
      context: 'GLOBAL_ERROR_HANDLER',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript_error',
      },
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logClientError({
      level: 'error',
      message: `Unhandled Promise Rejection: ${event.reason}`,
      stack: event.reason?.stack,
      context: 'PROMISE_REJECTION',
      metadata: {
        reason: event.reason,
        type: 'promise_rejection',
      },
    });
  });

  // Handle console errors (optional - can be noisy)
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Call original console.error
    originalConsoleError.apply(console, args);
    
    // Log to backend if it's a significant error
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    
    // Only log console errors that seem significant
    if (message.includes('Warning') || message.includes('React')) {
      logClientError({
        level: 'warn',
        message: `Console Error: ${message}`,
        context: 'CONSOLE_ERROR',
        metadata: {
          args: args,
          type: 'console_error',
        },
      });
    }
  };
}

// Helper function to manually log errors
export function logError(error: Error, context?: string, metadata?: any): void {
  logClientError({
    level: 'error',
    message: error.message,
    stack: error.stack,
    context: context || 'MANUAL_LOG',
    metadata,
  });
}

export function logWarning(message: string, context?: string, metadata?: any): void {
  logClientError({
    level: 'warn',
    message,
    context: context || 'MANUAL_LOG',
    metadata,
  });
}

export function logInfo(message: string, context?: string, metadata?: any): void {
  logClientError({
    level: 'info',
    message,
    context: context || 'MANUAL_LOG',
    metadata,
  });
}
