import { ClickIdInfo } from '../types';

const CLICK_ID_PARAMS: Record<string, string> = {
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

export function extractClickId(): ClickIdInfo | null {
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
  } catch (error) {
    console.error('[GECapture] Error extracting click ID:', error);
  }

  return null;
}

export function storeClickId(clickIdInfo: ClickIdInfo): void {
  try {
    localStorage.setItem('ge_click_id', JSON.stringify(clickIdInfo));
  } catch (error) {
    console.error('[GECapture] Error storing click ID:', error);
  }
}

export function getStoredClickId(): ClickIdInfo | null {
  try {
    const stored = localStorage.getItem('ge_click_id');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[GECapture] Error retrieving stored click ID:', error);
  }
  return null;
}

export function getClickId(): ClickIdInfo | null {
  const currentClickId = extractClickId();

  if (currentClickId) {
    storeClickId(currentClickId);
    return currentClickId;
  }

  return getStoredClickId();
}
