const isProduction = import.meta.env.PROD;

interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: string;
}

const metrics: Metric[] = [];

function emitMetric(name: string, value: number, tags?: Record<string, string>): void {
  metrics.push({ name, value, tags, timestamp: new Date().toISOString() });

  if (!isProduction && metrics.length > 100) {
    metrics.splice(0, metrics.length - 100);
  }
}

export function recordPageLoad(page: string, durationMs: number): void {
  emitMetric('page_load', durationMs, { page });
}

export function recordApiCall(endpoint: string, durationMs: number, status: number): void {
  emitMetric('api_call', durationMs, { endpoint, status: String(status) });
}

export function recordRender(component: string, durationMs: number): void {
  emitMetric('render', durationMs, { component });
}

export function getMetrics(): Metric[] {
  return [...metrics];
}

export function clearMetrics(): void {
  metrics.length = 0;
}
