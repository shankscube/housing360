import { pingDatabase } from '../models/health.model';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'connected' | 'unreachable';
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const isDatabaseConnected = await pingDatabase();
  return {
    status: isDatabaseConnected ? 'ok' : 'degraded',
    database: isDatabaseConnected ? 'connected' : 'unreachable',
  };
}
