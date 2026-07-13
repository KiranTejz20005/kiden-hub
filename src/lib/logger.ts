type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  data?: Record<string, unknown>;
  error?: Error;
}

const isProduction = import.meta.env.PROD;

class Logger {
  private correlationId: string | null = null;

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  clearCorrelationId(): void {
    this.correlationId = null;
  }

  private createEntry(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId ?? undefined,
      data: this.sanitize(data),
      error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined,
    };
  }

  private sanitize(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) {return undefined;}

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitize(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (isProduction) {return;}
    const entry = this.createEntry('debug', message, data);
    console.debug(`[${entry.timestamp}] [${entry.level.toUpperCase()}] ${message}`, data ?? '');
  }

  info(message: string, data?: Record<string, unknown>): void {
    const entry = this.createEntry('info', message, data);
    console.info(`[${entry.timestamp}] [${entry.level.toUpperCase()}] ${message}`, data ?? '');
  }

  warn(message: string, data?: Record<string, unknown>): void {
    const entry = this.createEntry('warn', message, data);
    console.warn(`[${entry.timestamp}] [${entry.level.toUpperCase()}] ${message}`, data ?? '');
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    const entry = this.createEntry('error', message, data, error);
    console.error(`[${entry.timestamp}] [${entry.level.toUpperCase()}] ${message}`, {
      error: entry.error,
      data: entry.data,
    });
  }
}

export const logger = new Logger();
