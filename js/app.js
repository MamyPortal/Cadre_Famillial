(function () {
  const DEFAULT_CONFIG_URL = 'config.json?ts=' + Date.now();

  const $ = (id) => document.getElementById(id);

  const app = {
    settings: null,
    weather: null,
    slideshow: null,
    baseConfig: null
  };

  function sanitizePhone(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function formatDateTime() {
    const now = new Date();
    return {
      date: new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
      }).format(now),
      time: new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit', minute: '2-digit'
      }).format(now)
    };
  }

  function setText(id, value) {
    const node = $(id);
    if (node) node.textContent = value ?? '';
  }

  function applyTheme(settings) {
    const root = document.documentElement;
    if (settings?.accent) root.style.setProperty('--accent', settings.accent);
    if (settings?.photoScale) root.style.setProperty('--photo-scale', settings.photoScale + '%');
    if (settings?.themeMode && settings.themeMode !== 'system') {
      document.body.dataset.theme = settings.themeMode;
    } else {
      document.body.dataset.theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.body.dataset.showWeather = settings?.showWeather ? 'true' : 'false';
    document.body.dataset.showTime = settings?.showTime ? 'true' : 'false';
    document.body.classList.toggle('compact', window.innerWidth <= 920);
  }

  async function loadBaseConfig() {
    try {
      const response = await fetch(DEFAULT_CONFIG_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Chargement de config.json impossible, valeurs par défaut utilisées.', error);
      return CadreStorage.DEFAULT_SETTINGS;
    }
  }

  function mergeState() {
    const base = app.baseConfig || CadreStorage.DEFAULT_SETTINGS;
    const saved = CadreStorage.getSettings();
    return CadreStorage.normalizeSettings({ ...base, ...saved });
  }

  function renderHeader(settings) {
    setText('title', settings.title);
    setText('subtitle', settings.subtitle);
    setText('messageBox', settings.message);
    setText('familyNotes', (settings.familyNotes || []).join(' • '));
    setText('cityLine', settings.city || 'Paris');

    const photoLink = $('photoLink');
    const firstPhoto = (settings.photoUrls || [])[0] || '#';
    photoLink.href = firstPhoto;
    photoLink.textContent = 'Photos';

    const phone = sanitizePhone(settings.whatsappPhone);
    const whatsapp = $('whatsappLink');
    whatsapp.href = phone ? `https://wa.me/${phone}` : '#';
    whatsapp.textContent = settings.whatsappLabel || 'WhatsApp';

    const linkList = $('linkList');
    linkList.innerHTML = '';
    (settings.links || []).forEach((link) => {
      const a = document.createElement('a');
      a.href = link.url;
      a.rel = 'noopener noreferrer';
      a.target = '_blank';
      a.className = 'link-pill';
      a.textContent = link.label;
      linkList.appendChild(a);
    });
  }

  function updateClock(settings) {
    const { date, time } = formatDateTime();
    if (settings.showTime) {
      setText('dateLine', date);
      setText('timeLine', time);
    } else {
      setText('dateLine', date);
      setText('timeLine', '');
    }
  }

  async function updateWeather(settings) {
    const badge = $('weatherBadge');
    if (!settings.showWeather) {
      badge.textContent = '';
      return;
    }
    try {
      const result = await CadreWeather.fetchWeather(settings.city || 'Paris');
      badge.textContent = `${result.emoji} ${result.currentTemp}°C · ${result.minTemp}/${result.maxTemp}°`;
      setText('weatherBadge', `${result.emoji} ${result.currentTemp}°C · ${result.minTemp}/${result.maxTemp}°`);
      setText('networkLine', navigator.onLine ? 'En ligne' : 'Hors ligne');
      setText('cityLine', `${result.place.name}${result.place.admin1 ? ', ' + result.place.admin1 : ''}`);
      $('weatherBadge').title = `Météo à ${result.place.name}`;
    } catch (error) {
      console.warn(error);
      setText('weatherBadge', 'Météo indisponible');
    }
  }

  function updateNetwork() {
    setText('networkLine', navigator.onLine ? 'En ligne' : 'Hors ligne');
  }

  async function updateBattery() {
    const batteryLine = $('batteryLine');
    try {
      if (!navigator.getBattery) {
        batteryLine.textContent = 'Non disponible';
        return;
      }
      const battery = await navigator.getBattery();
      const refresh = () => {
        const pct = Math.round(battery.level * 100);
        batteryLine.textContent = `${pct}%${battery.charging ? ' · charge' : ''}`;
      };
      refresh();
      battery.addEventListener('levelchange', refresh);
      battery.addEventListener('chargingchange', refresh);
    } catch (error) {
      batteryLine.textContent = 'Non disponible';
    }
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch((error) => console.warn('Service worker non installé', error));
    }
  }

  function hookFullscreen(settings) {
    const btn = $('fullscreenBtn');
    const request = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.warn(error);
      }
    };
    btn.addEventListener('click', request);
    if (settings.fullScreenHint) {
      document.addEventListener('click', async () => {
        if (document.fullscreenElement) return;
        try { await document.documentElement.requestFullscreen(); } catch (_) {}
      }, { once: true });
    }
  }

  function initSlideshow(settings) {
    const img = $('photoImg');
    const label = $('photoLabel');
    app.slideshow = CadreSlideshow.createSlideshow(img, {
      urls: settings.photoUrls,
      intervalMs: settings.photoIntervalMs,
      onChange: (_src, index, total) => {
        if (!total) {
          label.textContent = 'Ajoutez des photos dans config.json';
          return;
        }
        label.textContent = `Photo ${index} / ${total}`;
      }
    });
    app.slideshow.start();
  }

  function attachRefresh(settings) {
    $('refreshBtn').addEventListener('click', async () => {
      const merged = mergeState();
      app.settings = merged;
      applyTheme(merged);
      renderHeader(merged);
      await updateWeather(merged);
      if (app.slideshow) app.slideshow.update(merged.photoUrls, merged.photoIntervalMs);
    });
  }

  function applyCurrentSettings(settings) {
    app.settings = settings;
    applyTheme(settings);
    renderHeader(settings);
    document.documentElement.style.setProperty('--photo-scale', `${settings.photoScale}%`);
    document.body.style.setProperty('--photo-scale', `${settings.photoScale}%`);
  }

  async function init() {
    app.baseConfig = await loadBaseConfig();
    const settings = mergeState();
    applyCurrentSettings(settings);
    updateClock(settings);
    setInterval(() => updateClock(app.settings), 1000);
    updateNetwork();
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    await updateBattery();
    await updateWeather(settings);
    initSlideshow(settings);
    attachRefresh(settings);
    hookFullscreen(settings);
    registerServiceWorker();

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if ((app.settings || {}).themeMode === 'system') applyTheme(app.settings);
    });

    window.addEventListener('resize', () => {
      document.body.classList.toggle('compact', window.innerWidth <= 920);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
