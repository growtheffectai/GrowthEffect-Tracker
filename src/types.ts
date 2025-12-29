
export interface GECaptureConfig {
  apiKey: string;
  companyId?: string;
  apiHost?: string;
  debug?: boolean;
}

export interface LeadData {
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  notes?: string;
  custom?: Record<string, any>;
  chatflowId?: string;
}

export interface AttributionData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  clickId?: string;
  adPlatform?: string;
  referrer?: string;
  landingPage?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface CapturePayload extends LeadData {
  attribution?: AttributionData;
  rawData?: {
    formFields: Record<string, any>;
    utm: UTMParams;
    attribution: AttributionData;
    timestamp: string;
    url: string;
  };
}

export interface CaptureResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface ClickIdInfo {
  clickId: string;
  platform: string;
}
