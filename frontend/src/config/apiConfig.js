// PaalVandi Cloud API Configuration
// When running inside a native Android APK, relative URLs (/api/...) resolve to https://localhost inside the WebView.
// This config ensures APK network requests reach the live cloud backend or local server.

export const getApiBaseUrl = () => {
  // 1. If explicit environment variable is set in .env
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }

  // 2. If user saved a custom server URL in settings/localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('paal_vandi_server_url');
    if (saved) return saved.replace(/\/+$/, '');
  }

  // 3. Fallback for Web browser (relative URL)
  return '';
};
