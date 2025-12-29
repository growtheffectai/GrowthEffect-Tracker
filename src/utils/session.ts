
export function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem('ge_session_id');

    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('ge_session_id', sessionId);
    }

    return sessionId;
  } catch (error) {
    console.error('[GECapture] Error managing session ID:', error);
    return generateSessionId();
  }
}

export function storeLandingPage(): void {
  try {
    const existing = sessionStorage.getItem('ge_landing_page');
    if (!existing) {
      sessionStorage.setItem('ge_landing_page', window.location.href);
    }
  } catch (error) {
    console.error('[GECapture] Error storing landing page:', error);
  }
}

export function getLandingPage(): string {
  try {
    return sessionStorage.getItem('ge_landing_page') || window.location.href;
  } catch (error) {
    return window.location.href;
  }
}

export function getReferrer(): string {
  try {
    return document.referrer || '';
  } catch (error) {
    return '';
  }
}

export function getUserAgent(): string {
  try {
    return navigator.userAgent || '';
  } catch (error) {
    return '';
  }
}
