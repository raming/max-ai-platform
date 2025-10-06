import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private counters: Record<string, number> = {
    app_requests_total: 0,
    resource_init_requests_total: 0,
  };

  increment(name: keyof MetricsShape) {
    this.counters[name] = (this.counters[name] ?? 0) + 1;
  }

  metrics(): string {
    // Basic Prometheus-like exposition
    const lines: string[] = [
      '# HELP app_requests_total Total number of API requests',
      '# TYPE app_requests_total counter',
      `app_requests_total ${this.counters.app_requests_total}`,
      '# HELP resource_init_requests_total Total number of resource init requests',
      '# TYPE resource_init_requests_total counter',
      `resource_init_requests_total ${this.counters.resource_init_requests_total}`,
    ];
    return lines.join('\n') + '\n';
  }
}

export type MetricsShape = {
  app_requests_total: number;
  resource_init_requests_total: number;
};