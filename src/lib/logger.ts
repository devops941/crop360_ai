type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

class Logger {
  private formatLog(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogPayload {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
    };
  }

  info(message: string, context?: Record<string, unknown>): void {
    const payload = this.formatLog('INFO', message, context);
    console.log(JSON.stringify(payload));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const payload = this.formatLog('WARN', message, context);
    console.warn(JSON.stringify(payload));
  }

  error(message: string, context?: Record<string, unknown>): void {
    const payload = this.formatLog('ERROR', message, context);
    console.error(JSON.stringify(payload));
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      const payload = this.formatLog('DEBUG', message, context);
      console.debug(JSON.stringify(payload));
    }
  }
}

export const logger = new Logger();
