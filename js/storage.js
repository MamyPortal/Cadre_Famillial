(function (global) {
  const STORAGE_KEY = 'cadre-familial.settings.v4';

  const DEFAULT_SETTINGS = {
    title: 'Bonjour Mamie',
    subtitle: 'Cadre familial',
    message: 'Nous venons dimanche midi. Gros bisous de toute la famille.',
    city: 'Paris',
    photoIntervalMs: 12000,
    photoScale: 72,
    accent: '#4f8cff',
    themeMode: 'dark',
    showWeather: true,
    showTime: true,
    fullScreenHint: true,
    photoUrls: [],
    links: []
  };

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function deepMerge(base, extra) {
    const output = Array.isArray(base) ? [...base] : { ...base };
    if (!extra || typeof extra !== 'object') return output;
    for (const [key, value] of Object.entries(extra)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
        output[key] = deepMerge(base[key], value);
      } else {
        output[key] = value;
      }
    }
    return output;
  }

  function normalizeLinks(list) {
    if (!Array.isArray(list)) return [];
    return list.map((item) => {
      if (typeof item === 'string') {
        const parts = item.split('|').map((s) => s.trim());
        return { label: parts[0] || 'Lien', url: parts[1] || '#' };
      }
      return {
        label: String(item?.label || 'Lien').trim(),
        url: String(item?.url || '#').trim()
      };
    }).filter((item) => item.label && item.url);
  }

  function normalizeSettings(input) {
    const merged = deepMerge(DEFAULT_SETTINGS, input || {});
    merged.photoIntervalMs = Math.max(3000, Number(merged.photoIntervalMs) || DEFAULT_SETTINGS.photoIntervalMs);
    merged.photoScale = Math.min(85, Math.max(50, Number(merged.photoScale) || DEFAULT_SETTINGS.photoScale));
    merged.showWeather = Boolean(merged.showWeather);
    merged.showTime = Boolean(merged.showTime);
    merged.fullScreenHint = Boolean(merged.fullScreenHint);
    merged.themeMode = ['dark', 'light', 'system'].includes(merged.themeMode) ? merged.themeMode : 'dark';
    merged.photoUrls = Array.isArray(merged.photoUrls) ? merged.photoUrls.filter(Boolean) : [];
    merged.links = normalizeLinks(merged.links);
    merged.accent = String(merged.accent || DEFAULT_SETTINGS.accent);
    return merged;
  }

  function getBaseConfig() {
    return readJSON('cadre-familial.config.v4', DEFAULT_SETTINGS);
  }

  function getSettings() {
    const saved = readJSON(STORAGE_KEY, {});
    const base = getBaseConfig();
    return normalizeSettings(deepMerge(base, saved));
  }

  function saveSettings(settings) {
    const normalized = normalizeSettings(settings);
    writeJSON(STORAGE_KEY, normalized);
    return normalized;
  }

  function resetSettings() {
    localStorage.removeItem(STORAGE_KEY);
    return getSettings();
  }

  function exportSettings() {
    return getSettings();
  }

  global.CadreStorage = {
    STORAGE_KEY,
    DEFAULT_SETTINGS,
    getBaseConfig,
    getSettings,
    saveSettings,
    resetSettings,
    exportSettings,
    normalizeSettings,
    normalizeLinks
  };
})(window);
