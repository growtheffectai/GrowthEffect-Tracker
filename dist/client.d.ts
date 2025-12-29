import { GECaptureConfig, LeadData, CaptureResponse } from './types';
export declare class GECaptureClient {
    private config;
    private initialized;
    private formListenersAttached;
    constructor(config: GECaptureConfig);
    init(): void;
    autoCapture(): void;
    private attachFormListeners;
    private attachToForms;
    private observeDynamicForms;
    private extractFormData;
    private buildAttributionData;
    capture(leadData: LeadData, rawFormFields?: Record<string, any>): Promise<CaptureResponse>;
    getUTMParams(): import("./types").UTMParams;
    getSessionId(): string;
    isReady(): boolean;
    private log;
}
//# sourceMappingURL=client.d.ts.map