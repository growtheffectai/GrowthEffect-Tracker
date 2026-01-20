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
      email: [
        'email', 'e-mail', 'emailaddress', 'email_address', 'user_email', 'mail',
        'email-address', 'your_email', 'your-email', 'youremail', 'contact_email',
        'contact-email', 'contactemail', 'primary_email', 'primary-email', 'primaryemail',
        'work_email', 'work-email', 'workemail', 'business_email', 'business-email',
        'businessemail', 'personal_email', 'personal-email', 'personalemail',
        'useremail', 'user-email', 'subscriber_email', 'subscriber-email', 'subscriberemail',
        'lead_email', 'lead-email', 'leademail', 'customer_email', 'customer-email',
        'customeremail', 'client_email', 'client-email', 'clientemail', 'member_email',
        'member-email', 'memberemail', 'signup_email', 'signup-email', 'signupemail',
        'register_email', 'register-email', 'registeremail', 'login_email', 'login-email',
        'loginemail', 'account_email', 'account-email', 'accountemail', 'newsletter_email',
        'newsletter-email', 'newsletteremail', 'form_email', 'form-email', 'formemail',
        'input_email', 'input-email', 'inputemail', 'field_email', 'field-email', 'fieldemail',
        'em', 'eml', 'correo', 'correo_electronico', 'courriel', 'e_mail'
      ],
      name: [
        'name', 'fullname', 'full_name', 'username', 'user_name', 'firstname', 'first_name',
        'full-name', 'user-name', 'first-name', 'fname', 'your_name', 'your-name', 'yourname',
        'contact_name', 'contact-name', 'contactname', 'customer_name', 'customer-name',
        'customername', 'client_name', 'client-name', 'clientname', 'lead_name', 'lead-name',
        'leadname', 'subscriber_name', 'subscriber-name', 'subscribername', 'member_name',
        'member-name', 'membername', 'person_name', 'person-name', 'personname',
        'display_name', 'display-name', 'displayname', 'real_name', 'real-name', 'realname',
        'given_name', 'given-name', 'givenname', 'first', 'lastname', 'last_name',
        'last-name', 'lname', 'last', 'surname', 'family_name', 'family-name', 'familyname',
        'nombre', 'nom', 'prenom', 'vorname', 'nachname', 'complete_name', 'complete-name',
        'completename', 'legal_name', 'legal-name', 'legalname', 'billing_name', 'billing-name',
        'billingname', 'shipping_name', 'shipping-name', 'shippingname', 'applicant_name',
        'applicant-name', 'applicantname', 'sender_name', 'sender-name', 'sendername',
        'visitor_name', 'visitor-name', 'visitorname', 'guest_name', 'guest-name', 'guestname',
        'attendee_name', 'attendee-name', 'attendeename', 'participant_name', 'participant-name',
        'participantname', 'requester_name', 'requester-name', 'requestername'
      ],
      phone: [
        'phone', 'telephone', 'mobile', 'phonenumber', 'phone_number', 'tel',
        'phone-number', 'mobile_number', 'mobile-number', 'mobilenumber', 'cell',
        'cellphone', 'cell_phone', 'cell-phone', 'contact_phone', 'contact-phone',
        'contactphone', 'primary_phone', 'primary-phone', 'primaryphone', 'work_phone',
        'work-phone', 'workphone', 'business_phone', 'business-phone', 'businessphone',
        'home_phone', 'home-phone', 'homephone', 'personal_phone', 'personal-phone',
        'personalphone', 'your_phone', 'your-phone', 'yourphone', 'phone_no', 'phone-no',
        'phoneno', 'mobile_no', 'mobile-no', 'mobileno', 'tel_no', 'tel-no', 'telno',
        'contact_number', 'contact-number', 'contactnumber', 'daytime_phone', 'daytime-phone',
        'daytimephone', 'evening_phone', 'evening-phone', 'eveningphone', 'office_phone',
        'office-phone', 'officephone', 'fax', 'faxnumber', 'fax_number', 'fax-number',
        'numero', 'telefono', 'telefone', 'telefon', 'tele', 'ph', 'phno', 'phn',
        'whatsapp', 'whatsapp_number', 'whatsapp-number', 'whatsappnumber', 'sms', 'sms_number',
        'sms-number', 'smsnumber', 'callback', 'callback_number', 'callback-number',
        'callbacknumber', 'direct_phone', 'direct-phone', 'directphone', 'main_phone',
        'main-phone', 'mainphone', 'alternate_phone', 'alternate-phone', 'alternatephone',
        'secondary_phone', 'secondary-phone', 'secondaryphone', 'billing_phone', 'billing-phone',
        'billingphone', 'shipping_phone', 'shipping-phone', 'shippingphone', 'customer_phone',
        'customer-phone', 'customerphone', 'client_phone', 'client-phone', 'clientphone',
        'user_phone', 'user-phone', 'userphone', 'member_phone', 'member-phone', 'memberphone'
      ],
      company: [
        'company', 'organization', 'business', 'companyname', 'company_name',
        'company-name', 'org', 'organisation', 'organization_name', 'organisation_name',
        'organization-name', 'organisation-name', 'organizationname', 'organisationname',
        'business_name', 'business-name', 'businessname', 'employer', 'employer_name',
        'employer-name', 'employername', 'firm', 'firm_name', 'firm-name', 'firmname',
        'enterprise', 'enterprise_name', 'enterprise-name', 'enterprisename', 'corp',
        'corporation', 'corporation_name', 'corporation-name', 'corporationname',
        'workplace', 'work_place', 'work-place', 'your_company', 'your-company', 'yourcompany',
        'client_company', 'client-company', 'clientcompany', 'customer_company',
        'customer-company', 'customercompany', 'agency', 'agency_name', 'agency-name',
        'agencyname', 'brand', 'brand_name', 'brand-name', 'brandname', 'store', 'store_name',
        'store-name', 'storename', 'shop', 'shop_name', 'shop-name', 'shopname',
        'empresa', 'societe', 'firmenname', 'unternehmen', 'azienda', 'institucion',
        'institution', 'institution_name', 'institution-name', 'institutionname',
        'startup', 'startup_name', 'startup-name', 'startupname', 'venture', 'venture_name',
        'venture-name', 'venturename', 'client', 'account', 'account_name', 'account-name',
        'accountname', 'affiliate', 'affiliate_name', 'affiliate-name', 'affiliatename',
        'partner', 'partner_name', 'partner-name', 'partnername', 'vendor', 'vendor_name',
        'vendor-name', 'vendorname', 'supplier', 'supplier_name', 'supplier-name', 'suppliername',
        'merchant', 'merchant_name', 'merchant-name', 'merchantname', 'school', 'school_name',
        'school-name', 'schoolname', 'university', 'university_name', 'university-name',
        'universityname', 'college', 'college_name', 'college-name', 'collegename',
        'hospital', 'hospital_name', 'hospital-name', 'hospitalname', 'clinic', 'clinic_name',
        'clinic-name', 'clinicname', 'practice', 'practice_name', 'practice-name', 'practicename'
      ]
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
