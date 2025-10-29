
import { Injectable } from '@nestjs/common';
import client from 'prom-client';

@Injectable()
export class MetricsService {
  counter: client.Counter<string>;
  constructor() {
    client.collectDefaultMetrics();
    this.counter = new client.Counter({ name: 'api_requests_total', help: 'Total API requests' });
  }
  inc() { this.counter.inc(); }
  metrics() { return client.register.metrics(); }
}
