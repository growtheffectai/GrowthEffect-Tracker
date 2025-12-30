import {
  GECaptureConfig,
  LeadData,
  AttributionData,
  CapturePayload,
  CaptureResponse
} from './types';
import { getUTMParams } from './utils/utm';
import { getClickId } from './utils/clickId';
import {
  getSessionId,
  storeLandingPage,
  getLandingPage,
  getReferrer,
  getUserAgent
} from './utils/session';

export class GECaptureClient {
  private config: Required<GECaptureConfig>;
  private initialized: boolean = false;
  private formListenersAttached: boolean = false;

  constructor(config: GECaptureConfig) {
    this.config = {
      apiKey: config.apiKey,
      companyId: config.companyId || '',
      apiHost: config.apiHost || 'http://localhost:3000',
      debug: config.debug || false
    };

    this.log('GETracker initialized with config:', this.config);
  }

  public init(): void {
    if (this.initialized) {
      this.log('Already initialized');
      return;
    }

    storeLandingPage();

    this.initialized = true;
    this.log('GETracker SDK initialized successfully');
  }

  public autoCapture(): void {
    if (!this.initialized) {
      throw new Error('[GETracker] Must call init() before autoCapture()');
    }

    if (this.formListenersAttached) {
      this.log('Auto-capture already enabled');
      return;
    }

    this.attachFormListeners();
    this.formListenersAttached = true;
    this.log('Auto-capture enabled');
  }

  private attachFormListeners(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.attachToForms());
    } else {
      this.attachToForms();
    }

    this.observeDynamicForms();
  }

  private attachToForms(): void {
    const forms = document.querySelectorAll('form');
    this.log(`Found ${forms.length} forms on the page`);

    forms.forEach((form, index) => {
      if (form.hasAttribute('data-ge-capture')) {
        return;
      }

      form.setAttribute('data-ge-capture', 'true');

      form.addEventListener('submit', () => {
        this.log(`Form ${index} submitted`);

        try {
          const extractedData = this.extractFormData(form);

          if (extractedData && extractedData.leadData.email) {
            this.log('Capturing lead data in parallel with form submission...');

            // Capture the lead data asynchronously without blocking the form submission
            this.capture(extractedData.leadData, extractedData.rawFormFields)
              .then((result) => {
                if (result.success) {
                  this.log('Lead captured successfully');
                } else {
                  this.log('Lead capture failed:', result.error);
                }
              })
              .catch((error) => {
                this.log('Error capturing lead:', error);
              });

          } else {
            this.log('Form does not contain email field, skipping capture');
          }
        } catch (error) {
          this.log('Error processing form:', error);
        }
      });
    });
  }

  private observeDynamicForms(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            if (element.tagName === 'FORM') {
              this.attachToForms();
            }

            if (element.querySelectorAll) {
              const forms = element.querySelectorAll('form');
              if (forms.length > 0) {
                this.attachToForms();
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private extractFormData(form: HTMLFormElement): { leadData: LeadData; rawFormFields: Record<string, any> } | null {
    const formData = new FormData(form);
    const data: LeadData = {
      email: '',
      custom: {}
    };

    const rawFormFields: Record<string, any> = {};
    formData.forEach((value, key) => {
      rawFormFields[key] = value;
    });

    const fieldMappings: Record<string, string[]> = {
      email: ['email', 'e-mail', 'emailaddress', 'email_address', 'user_email', 'mail'],
      name: ['name', 'fullname', 'full_name', 'username', 'user_name', 'firstname', 'first_name'],
      phone: ['phone', 'telephone', 'mobile', 'phonenumber', 'phone_number', 'tel'],
      company: ['company', 'organization', 'business', 'companyname', 'company_name']
    };

    for (const [key, variations] of Object.entries(fieldMappings)) {
      for (const variation of variations) {
        const value = formData.get(variation);
        if (value && typeof value === 'string') {
          (data as any)[key] = value;
          break;
        }
      }
    }

    formData.forEach((value, key) => {
      const keyLower = key.toLowerCase();
      const isKnownField = Object.values(fieldMappings).some(variations =>
        variations.some(v => v === keyLower)
      );

      if (!isKnownField && typeof value === 'string') {
        data.custom![key] = value;
      }
    });

    return data.email ? { leadData: data, rawFormFields } : null;
  }

  private buildAttributionData(): AttributionData {
    const utmParams = getUTMParams();
    const clickIdInfo = getClickId();

    return {
      utmSource: utmParams.utm_source,
      utmMedium: utmParams.utm_medium,
      utmCampaign: utmParams.utm_campaign,
      utmTerm: utmParams.utm_term,
      utmContent: utmParams.utm_content,
      clickId: clickIdInfo?.clickId,
      adPlatform: clickIdInfo?.platform,
      referrer: getReferrer(),
      landingPage: getLandingPage(),
      userAgent: getUserAgent(),
      sessionId: getSessionId()
    };
  }

  public async capture(leadData: LeadData, rawFormFields?: Record<string, any>): Promise<CaptureResponse> {
    if (!this.initialized) {
      throw new Error('[GETracker] Must call init() before capture()');
    }

    if (!leadData.email) {
      throw new Error('[GETracker] Email is required for lead tracking');
    }

    const attributionData = this.buildAttributionData();
    const utmParams = getUTMParams();

    const payload: CapturePayload = {
      ...leadData,
      attribution: attributionData,
      rawData: {
        formFields: rawFormFields || {},
        utm: utmParams,
        attribution: attributionData,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }
    };

    this.log('Tracking lead:', payload);

    try {
      const response = await fetch(`${this.config.apiHost}/api/v1/tracker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        this.log('Tracking failed:', result);
        return {
          success: false,
          error: result.error || result.message || 'Tracking failed'
        };
      }

      this.log('Tracking successful:', result);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      this.log('Network error during tracking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  public getUTMParams() {
    return getUTMParams();
  }

  public getSessionId(): string {
    return getSessionId();
  }

  public isReady(): boolean {
    return this.initialized;
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[GETracker]', ...args);
    }
  }
}
