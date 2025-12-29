import { UTMParams } from '../types';

export function extractUTMParams(): UTMParams {
  const params: UTMParams = {};

  try {
    const urlParams = new URLSearchParams(window.location.search);

    const utmKeys: Array<keyof UTMParams> = [
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
  } catch (error) {
    console.error('[GECapture] Error extracting UTM params:', error);
  }

  return params;
}

export function storeUTMParams(params: UTMParams): void {
  try {
    if (Object.keys(params).length > 0) {
      localStorage.setItem('ge_utm_params', JSON.stringify(params));
    }
  } catch (error) {
    console.error('[GECapture] Error storing UTM params:', error);
  }
}

export function getStoredUTMParams(): UTMParams {
  try {
    const stored = localStorage.getItem('ge_utm_params');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[GECapture] Error retrieving stored UTM params:', error);
  }
  return {};
}

export function getUTMParams(): UTMParams {
  const currentParams = extractUTMParams();

  if (Object.keys(currentParams).length > 0) {
    storeUTMParams(currentParams);
    return currentParams;
  }

  return getStoredUTMParams();
}
