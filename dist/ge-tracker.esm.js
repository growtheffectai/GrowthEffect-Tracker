/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function extractUTMParams() {
    const params = {};
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const utmKeys = [
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_term',
            'utm_content'
        ];
        utmKeys.forEach(key => {
            const value = urlParams.get(key);
            if (value) {
                params[key] = value;
            }
        });
    }
    catch (error) {
        console.error('[GECapture] Error extracting UTM params:', error);
    }
    return params;
}
function storeUTMParams(params) {
    try {
        if (Object.keys(params).length > 0) {
            localStorage.setItem('ge_utm_params', JSON.stringify(params));
        }
    }
    catch (error) {
        console.error('[GECapture] Error storing UTM params:', error);
    }
}
function getStoredUTMParams() {
    try {
        const stored = localStorage.getItem('ge_utm_params');
        if (stored) {
            return JSON.parse(stored);
        }
    }
    catch (error) {
        console.error('[GECapture] Error retrieving stored UTM params:', error);
    }
    return {};
}
function getUTMParams() {
    const currentParams = extractUTMParams();
    if (Object.keys(currentParams).length > 0) {
        storeUTMParams(currentParams);
        return currentParams;
    }
    return getStoredUTMParams();
}

const CLICK_ID_PARAMS = {
    fbclid: 'facebook',
    gclid: 'google',
    msclkid: 'microsoft',
    ttclid: 'tiktok',
    li_fat_id: 'linkedin',
    twclid: 'twitter',
    ScCid: 'snapchat',
    gbraid: 'google',
    wbraid: 'google',
};
function extractClickId() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        for (const [param, platform] of Object.entries(CLICK_ID_PARAMS)) {
            const value = urlParams.get(param);
            if (value) {
                return {
                    clickId: value,
                    platform
                };
            }
        }
    }
    catch (error) {
        console.error('[GECapture] Error extracting click ID:', error);
    }
    return null;
}
function storeClickId(clickIdInfo) {
    try {
        localStorage.setItem('ge_click_id', JSON.stringify(clickIdInfo));
    }
    catch (error) {
        console.error('[GECapture] Error storing click ID:', error);
    }
}
function getStoredClickId() {
    try {
        const stored = localStorage.getItem('ge_click_id');
        if (stored) {
            return JSON.parse(stored);
        }
    }
    catch (error) {
        console.error('[GECapture] Error retrieving stored click ID:', error);
    }
    return null;
}
function getClickId() {
    const currentClickId = extractClickId();
    if (currentClickId) {
        storeClickId(currentClickId);
        return currentClickId;
    }
    return getStoredClickId();
}

function generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function getSessionId() {
    try {
        let sessionId = sessionStorage.getItem('ge_session_id');
        if (!sessionId) {
            sessionId = generateSessionId();
            sessionStorage.setItem('ge_session_id', sessionId);
        }
        return sessionId;
    }
    catch (error) {
        console.error('[GECapture] Error managing session ID:', error);
        return generateSessionId();
    }
}
function storeLandingPage() {
    try {
        const existing = sessionStorage.getItem('ge_landing_page');
        if (!existing) {
            sessionStorage.setItem('ge_landing_page', window.location.href);
        }
    }
    catch (error) {
        console.error('[GECapture] Error storing landing page:', error);
    }
}
function getLandingPage() {
    try {
        return sessionStorage.getItem('ge_landing_page') || window.location.href;
    }
    catch (error) {
        return window.location.href;
    }
}
function getReferrer() {
    try {
        return document.referrer || '';
    }
    catch (error) {
        return '';
    }
}
function getUserAgent() {
    try {
        return navigator.userAgent || '';
    }
    catch (error) {
        return '';
    }
}

class GECaptureClient {
    constructor(config) {
        this.initialized = false;
        this.formListenersAttached = false;
        this.config = {
            apiKey: config.apiKey,
            companyId: config.companyId || '',
            apiHost: config.apiHost || 'http://localhost:3000',
            debug: config.debug || false
        };
        this.log('GETracker initialized with config:', this.config);
    }
    init() {
        if (this.initialized) {
            this.log('Already initialized');
            return;
        }
        storeLandingPage();
        this.initialized = true;
        this.log('GETracker SDK initialized successfully');
    }
    autoCapture() {
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
    attachFormListeners() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.attachToForms());
        }
        else {
            this.attachToForms();
        }
        this.observeDynamicForms();
    }
    attachToForms() {
        const forms = document.querySelectorAll('form');
        this.log(`Found ${forms.length} forms on the page`);
        forms.forEach((form, index) => {
            if (form.hasAttribute('data-ge-capture')) {
                return;
            }
            form.setAttribute('data-ge-capture', 'true');
            form.addEventListener('submit', (event) => __awaiter(this, void 0, void 0, function* () {
                this.log(`Form ${index} submitted`);
                try {
                    const extractedData = this.extractFormData(form);
                    if (extractedData && extractedData.leadData.email) {
                        event.preventDefault();
                        this.log('Capturing lead data before form submission...');
                        const result = yield this.capture(extractedData.leadData, extractedData.rawFormFields);
                        if (result.success) {
                            this.log('Lead captured successfully, allowing form to submit');
                            if (form.action && form.action !== window.location.href) {
                                form.submit();
                            }
                        }
                        else {
                            this.log('Lead capture failed:', result.error);
                            if (form.action && form.action !== window.location.href) {
                                form.submit();
                            }
                        }
                    }
                    else {
                        this.log('Form does not contain email field, skipping capture');
                    }
                }
                catch (error) {
                    this.log('Error processing form:', error);
                }
            }));
        });
    }
    observeDynamicForms() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node;
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
    extractFormData(form) {
        const formData = new FormData(form);
        const data = {
            email: '',
            custom: {}
        };
        const rawFormFields = {};
        formData.forEach((value, key) => {
            rawFormFields[key] = value;
        });
        const fieldMappings = {
            email: ['email', 'e-mail', 'emailaddress', 'email_address', 'user_email', 'mail'],
            name: ['name', 'fullname', 'full_name', 'username', 'user_name', 'firstname', 'first_name'],
            phone: ['phone', 'telephone', 'mobile', 'phonenumber', 'phone_number', 'tel'],
            company: ['company', 'organization', 'business', 'companyname', 'company_name']
        };
        for (const [key, variations] of Object.entries(fieldMappings)) {
            for (const variation of variations) {
                const value = formData.get(variation);
                if (value && typeof value === 'string') {
                    data[key] = value;
                    break;
                }
            }
        }
        formData.forEach((value, key) => {
            const keyLower = key.toLowerCase();
            const isKnownField = Object.values(fieldMappings).some(variations => variations.some(v => v === keyLower));
            if (!isKnownField && typeof value === 'string') {
                data.custom[key] = value;
            }
        });
        return data.email ? { leadData: data, rawFormFields } : null;
    }
    buildAttributionData() {
        const utmParams = getUTMParams();
        const clickIdInfo = getClickId();
        return {
            utmSource: utmParams.utm_source,
            utmMedium: utmParams.utm_medium,
            utmCampaign: utmParams.utm_campaign,
            utmTerm: utmParams.utm_term,
            utmContent: utmParams.utm_content,
            clickId: clickIdInfo === null || clickIdInfo === void 0 ? void 0 : clickIdInfo.clickId,
            adPlatform: clickIdInfo === null || clickIdInfo === void 0 ? void 0 : clickIdInfo.platform,
            referrer: getReferrer(),
            landingPage: getLandingPage(),
            userAgent: getUserAgent(),
            sessionId: getSessionId()
        };
    }
    capture(leadData, rawFormFields) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized) {
                throw new Error('[GETracker] Must call init() before capture()');
            }
            if (!leadData.email) {
                throw new Error('[GETracker] Email is required for lead tracking');
            }
            const attributionData = this.buildAttributionData();
            const utmParams = getUTMParams();
            const payload = Object.assign(Object.assign({}, leadData), { attribution: attributionData, rawData: {
                    formFields: rawFormFields || {},
                    utm: utmParams,
                    attribution: attributionData,
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                } });
            this.log('Tracking lead:', payload);
            try {
                const response = yield fetch(`${this.config.apiHost}/api/v1/tracker`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.apiKey}`
                    },
                    body: JSON.stringify(payload)
                });
                const result = yield response.json();
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
            }
            catch (error) {
                this.log('Network error during tracking:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Network error'
                };
            }
        });
    }
    getUTMParams() {
        return getUTMParams();
    }
    getSessionId() {
        return getSessionId();
    }
    isReady() {
        return this.initialized;
    }
    log(...args) {
        if (this.config.debug) {
            console.log('[GETracker]', ...args);
        }
    }
}

let globalInstance = null;
function init(config) {
    const fullConfig = typeof config === 'string'
        ? { apiKey: config }
        : config;
    if (!fullConfig.apiKey) {
        throw new Error('[GETracker] API key is required');
    }
    globalInstance = new GECaptureClient(fullConfig);
    globalInstance.init();
    return globalInstance;
}
function autoCapture() {
    if (!globalInstance) {
        throw new Error('[GETracker] Must call init() before autoCapture()');
    }
    globalInstance.autoCapture();
}
function capture(leadData) {
    if (!globalInstance) {
        throw new Error('[GETracker] Must call init() before capture()');
    }
    return globalInstance.capture(leadData);
}
function getInstance() {
    return globalInstance;
}
function isReady() {
    return (globalInstance === null || globalInstance === void 0 ? void 0 : globalInstance.isReady()) || false;
}
if (typeof window !== 'undefined') {
    window.GETracker = {
        init,
        autoCapture,
        capture,
        getInstance,
        getUTMParams: () => (globalInstance === null || globalInstance === void 0 ? void 0 : globalInstance.getUTMParams()) || getUTMParams(),
        getSessionId: () => (globalInstance === null || globalInstance === void 0 ? void 0 : globalInstance.getSessionId()) || getSessionId(),
        isReady: () => (globalInstance === null || globalInstance === void 0 ? void 0 : globalInstance.isReady()) || false
    };
}

export { autoCapture, capture, getClickId, getInstance, getSessionId, getUTMParams, init, isReady };
//# sourceMappingURL=ge-tracker.esm.js.map
