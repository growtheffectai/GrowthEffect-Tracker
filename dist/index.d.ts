import { GECaptureClient } from './client';
import { GECaptureConfig, LeadData, CaptureResponse } from './types';
export * from './types';
export { getUTMParams } from './utils/utm';
export { getClickId } from './utils/clickId';
export { getSessionId } from './utils/session';
export declare function init(config: GECaptureConfig | string): GECaptureClient;
export declare function autoCapture(): void;
export declare function capture(leadData: LeadData): Promise<CaptureResponse>;
export declare function getInstance(): GECaptureClient | null;
export declare function isReady(): boolean;
//# sourceMappingURL=index.d.ts.map