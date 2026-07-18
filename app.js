const DEFAULT_CONFIG = {
  title: 'Bonjour Mamie',
  subtitle: 'Cadre familial simple',
  homeGreeting: 'Bienvenue',
  city: 'Paris',
  message: 'Nous venons dimanche midi. Gros bisous de toute la famille.',
  ephemeride: 'Saint du jour, anniversaire, rappel familial.',
  whatsappPhone: '33600000000',
  whatsappLabel: 'Appeler WhatsApp',
  photoIntervalMs: 12000,
  photoUrls: ['photos/sample-1.svg', 'photos/sample-2.svg', 'photos/sample-3.svg'],
  links: [{ label: 'Photos', url: 'https://photos.google.com/' }],
  theme: { accent: '#4f8cff' },
  familyNotes: [
    'Garder la tablette branchée.',
    "Le bouton WhatsApp ouvre l'application.",
    'Les proches modifient config.json à distance.'
  ]
};

const els = {
  subtitle: document.getElementById('subtitle'),
  title: document.getElementById('title'),
  familyNotes: document.getElementById('familyNotes'),
  dateLine: document.getElementById('dateLine'),
  timeLine: document.getElementById('timeLine'),
  weatherMain: document.getElementById('weatherMain'),
  weatherDetails: document.getElementById('weatherDetails'),
  onlineLine: document.getElementById('onlineLine'),
  batteryLine: document.getElementById('batteryLine'),
  messageBox: document.getElementById('messageBox'),
  photoImg: document.getElementById('photoImg'),
  photoStage: document.getElementById('photoStage'),
  photoLabel: document.getElementById('photoLabel'),
  whatsappLink: document.getElementById('whatsappLink'),
  refreshBtn: document.getElementById('refreshBtn'),
  photoLink: document.getElementById('photoLink'),
  linkList: document.getElementById('linkList')
};

const state = {
  config: { ...DEFAULT_CONFIG },
  photoIndex: 0,
  photoTimer: null,
  clockTimer: null,
  weatherTimer: null,
  battery: null,
  photoUrls: []
};

const $ = (id) => document.getElementById(id);

function sanitizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function setText(node, value) {
  if (node) node.textContent = value ?? '';
}

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function hexToRgb(hex) {
  const cleaned = String(hex || '').replace('#', '').trim();
  if (![3, 6].includes(cleaned.length)) return null;
  const full = cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255
  };
}

function rgbToHex(r, g, b) {
  const toHex = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function shadeHex(hex, percent) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const factor = 1 + percent;
  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

function normalizeConfig(raw) {
  const cfg = {
    ...DEFAULT_CONFIG,
    ...(raw || {}),
    theme: {
      ...DEFAULT_CONFIG.theme,
      ...(raw && raw.theme ? raw.theme : {})
    }
  };

  cfg.photoUrls = Array.isArray(cfg.photoUrls) ? cfg.photoUrls.filter(Boolean) : [];
  cfg.links = Array.isArray(cfg.links) ? cfg.links.filter((item) => item && item.label && item.url) : [];
  cfg.familyNotes = Array.isArray(cfg.familyNotes) ? cfg.familyNotes.filter(Boolean) : [];
  cfg.message = cfg.message || cfg.ephemeride || DEFAULT_CONFIG.message;
  return cfg;
}

function applyTheme(theme) {
  if (!theme || !theme.accent) return;
  document.documentElement.style.setProperty('--accent', theme.accent);
  document.documentElement.style.setProperty('--accent-strong', shadeHex(theme.accent, -0.16));
}

function formatDateTime(now = new Date()) {
  return {
    date: new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(now),
    time: new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(now)
  };
}

async function loadConfig() {
  try {
    const response = await fetch(`config.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return normalizeConfig(await response.json());
  } catch (error) {
    console.warn('Chargement de config.json impossible, valeurs par défaut utilisées.', error);
    return normalizeConfig();
  }
}

function renderHeader(cfg) {
  setText(els.subtitle, cfg.subtitle);
  setText(els.title, cfg.title || cfg.homeGreeting || 'Bonjour');
  setText(els.familyNotes, (cfg.familyNotes || []).join(' • '));

  const phone = sanitizePhone(cfg.whatsappPhone);
  const whatsapp = els.whatsappLink;
  if (whatsapp) {
    whatsapp.href = phone ? `https://wa.me/${phone}` : '#';
    whatsapp.textContent = cfg.whatsappLabel || 'WhatsApp';
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener noreferrer';
  }

  const firstPhoto = (cfg.photoUrls || [])[0] || '#';
  if (els.photoLink) {
    els.photoLink.href = firstPhoto;
    els.photoLink.target = '_blank';
    els.photoLink.rel = 'noopener noreferrer';
    els.photoLink.textContent = 'Photos';
  }

  setText(els.messageBox, cfg.message || DEFAULT_CONFIG.message);

  if (els.linkList) {
    els.linkList.innerHTML = '';
    (cfg.links || []).forEach((link) => {
      const a = document.createElement('a');
      a.className = 'link-pill';
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = link.label;
      els.linkList.appendChild(a);
    });
  }
}

function weatherEmoji(code, isDay = true) {
  const dayMap = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌦️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
    71: '❄️', 73: '❄️', 75: '❄️', 80: '🌦️', 81: '🌧️', 82: '🌧️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
  };
  const nightMap = {
    0: '🌙', 1: '🌙', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌦️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
    71: '❄️', 73: '❄️', 75: '❄️', 80: '🌦️', 81: '🌧️', 82: '🌧️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
  };
  return (isDay ? dayMap : nightMap)[code] || '🌡️';
}

async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=fr&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Geocoding failed');
  const data = await response.json();
  return data.results?.[0] || null;
}

function formatTemp(value) {
  return `${Math.round(Number(value))}°`;
}

async function loadWeather() {
  const city = state.config.city || DEFAULT_CONFIG.city;
  try {
    const place = await geocodeCity(city);
    if (!place) throw new Error('City not found');

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.search = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: 'temperature_2m,weather_code,is_day,apparent_temperature',
      daily: 'temperature_2m_max,temperature_2m_min',
      timezone: 'auto'
    }).toString();

    const response = await fetch(forecastUrl);
    if (!response.ok) throw new Error('Forecast failed');
    const data = await response.json();
    const current = data.current || {};
    const daily = data.daily || {};
    const temp = current.temperature_2m ?? current.apparent_temperature;
    const emoji = weatherEmoji(current.weather_code, Boolean(current.is_day));
    const dayMax = daily.temperature_2m_max?.[0];
    const dayMin = daily.temperature_2m_min?.[0];

    setText(els.weatherMain, temp == null ? 'Météo' : `${emoji} ${formatTemp(temp)}`);
    const placeLine = [place.name, place.admin1].filter(Boolean).join(', ');
    const rangeLine = dayMax == null || dayMin == null ? '' : ` · ${formatTemp(dayMin)} / ${formatTemp(dayMax)}`;
    setText(els.weatherDetails, `${placeLine}${rangeLine}`);
  } catch (error) {
    console.warn(error);
    setText(els.weatherMain, 'Météo');
    setText(els.weatherDetails, city);
  }
}

function updateClock() {
  const { date, time } = formatDateTime();
  setText(els.dateLine, date);
  setText(els.timeLine, time);
}

function updateNetworkStatus() {
  if (!els.onlineLine) return;
  const online = navigator.onLine;
  els.onlineLine.textContent = online ? 'En ligne' : 'Hors ligne';
  els.onlineLine.classList.toggle('on', online);
  els.onlineLine.classList.toggle('off', !online);
}

async function updateBatteryStatus() {
  if (!els.batteryLine) return;
  if (!('getBattery' in navigator)) {
    els.batteryLine.textContent = 'Batterie --';
    return;
  }

  try {
    state.battery = await navigator.getBattery();
    const render = () => {
      const level = Math.round(state.battery.level * 100);
      const charging = state.battery.charging ? '⚡ ' : '';
      els.batteryLine.textContent = `Batterie ${charging}${level}%`;
    };
    render();
    state.battery.addEventListener('levelchange', render);
    state.battery.addEventListener('chargingchange', render);
  } catch (error) {
    els.batteryLine.textContent = 'Batterie --';
  }
}

function stopSlideshow() {
  if (state.photoTimer) {
    clearInterval(state.photoTimer);
    state.photoTimer = null;
  }
}

function showPhoto(index, animate = false) {
  const photos = state.photoUrls;
  const img = els.photoImg;
  const label = els.photoLabel;

  if (!photos.length) {
    img.removeAttribute('src');
    label.textContent = 'Ajoute des photos dans config.json';
    return;
  }

  const actual = ((index % photos.length) + photos.length) % photos.length;
  const src = photos[actual];
  label.textContent = `Photo ${actual + 1} / ${photos.length}`;

  if (!animate) {
    img.classList.remove('fading');
    img.src = src;
    return;
  }

  img.classList.add('fading');
  const preload = new Image();
  preload.onload = () => {
    img.src = src;
    requestAnimationFrame(() => img.classList.remove('fading'));
  };
  preload.onerror = () => {
    img.classList.remove('fading');
  };
  preload.src = src;
}

function nextPhoto(animate = true) {
  if (!state.photoUrls.length) return;
  state.photoIndex = (state.photoIndex + 1) % state.photoUrls.length;
  showPhoto(state.photoIndex, animate);
}

function startSlideshow() {
  stopSlideshow();
  state.photoUrls = Array.isArray(state.config.photoUrls) ? state.config.photoUrls.filter(Boolean) : [];
  state.photoIndex = 0;
  showPhoto(0, false);
  if (state.photoUrls.length > 1) {
    const interval = clamp(Number(state.config.photoIntervalMs) || 12000, 4000, 60000);
    state.photoTimer = setInterval(() => nextPhoto(true), interval);
  }
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('sw.js');
    } catch (error) {
      console.warn('Service worker non installé', error);
    }
  }
}

function requestFullscreenHint() {
  if (!document.fullscreenEnabled) return;
  const tryFullscreen = async () => {
    if (document.fullscreenElement) return;
    try {
      await document.documentElement.requestFullscreen();
    } catch (_) {
      // ignore
    }
  };
  document.addEventListener('pointerdown', tryFullscreen, { once: true, passive: true });
}

async function refreshAll() {
  state.config = await loadConfig();
  applyTheme(state.config.theme);
  renderHeader(state.config);
  await loadWeather();
  startSlideshow();
}

async function init() {
  state.config = await loadConfig();
  applyTheme(state.config.theme);
  renderHeader(state.config);

  updateClock();
  state.clockTimer = setInterval(updateClock, 1000);

  updateNetworkStatus();
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateNetworkStatus();
  });

  await updateBatteryStatus();

  await loadWeather();
  state.weatherTimer = setInterval(loadWeather, 30 * 60 * 1000);

  startSlideshow();
  await registerServiceWorker();
  requestFullscreenHint();

  els.refreshBtn?.addEventListener('click', async () => {
    await refreshAll();
  });

  els.photoStage?.addEventListener('click', () => nextPhoto(true));
  els.photoStage?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      nextPhoto(true);
    }
  });
}

init().catch((error) => {
  console.error('Initialisation impossible', error);
});
