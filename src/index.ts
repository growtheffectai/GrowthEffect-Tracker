import { GECaptureClient } from './client';
import { GECaptureConfig, LeadData, CaptureResponse } from './types';
import { getUTMParams as getUTMParamsUtil } from './utils/utm';
import { getSessionId as getSessionIdUtil } from './utils/session';
export * from './types';
export { getUTMParams } from './utils/utm';
export { getClickId } from './utils/clickId';
export { getSessionId } from './utils/session';

let globalInstance: GECaptureClient | null = null;

export function init(config: GECaptureConfig | string): GECaptureClient {
  const fullConfig: GECaptureConfig = typeof config === 'string'
    ? { apiKey: config }
    : config;

  if (!fullConfig.apiKey) {
    throw new Error('[GETracker] API key is required');
  }

  globalInstance = new GECaptureClient(fullConfig);
  globalInstance.init();

  return globalInstance;
}

export function autoCapture(): void {
  if (!globalInstance) {
    throw new Error('[GETracker] Must call init() before autoCapture()');
  }
  globalInstance.autoCapture();
}

export function capture(leadData: LeadData): Promise<CaptureResponse> {
  if (!globalInstance) {
    throw new Error('[GETracker] Must call init() before capture()');
  }
  return globalInstance.capture(leadData);
}

export function getInstance(): GECaptureClient | null {
  return globalInstance;
}

export function isReady(): boolean {
  return globalInstance?.isReady() || false;
}

if (typeof window !== 'undefined') {
  (window as any).GETracker = {
    init,
    autoCapture,
    capture,
    getInstance,
    getUTMParams: () => globalInstance?.getUTMParams() || getUTMParamsUtil(),
    getSessionId: () => globalInstance?.getSessionId() || getSessionIdUtil(),
    isReady: () => globalInstance?.isReady() || false
  };
}
