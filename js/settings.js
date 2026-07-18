(function () {
  const $ = (id) => document.getElementById(id);

  function toLines(text) {
    return String(text || '').split('
').map((line) => line.trim()).filter(Boolean);
  }

  function renderForm(settings) {
    $('titleInput').value = settings.title || '';
    $('subtitleInput').value = settings.subtitle || '';
    $('messageInput').value = settings.message || '';
    $('cityInput').value = settings.city || '';
    $('intervalInput').value = settings.photoIntervalMs || 12000;
    $('photoScaleInput').value = settings.photoScale || 72;
    $('accentInput').value = settings.accent || '#4f8cff';
    $('themeModeInput').value = settings.themeMode || 'dark';
    $('showWeatherInput').checked = Boolean(settings.showWeather);
    $('showTimeInput').checked = Boolean(settings.showTime);
    $('fullScreenInput').checked = Boolean(settings.fullScreenHint);
    $('photosInput').value = (settings.photoUrls || []).join('
');
    $('linksInput').value = (settings.links || []).map((link) => `${link.label} | ${link.url}`).join('
');
  }

  function collectForm() {
    return CadreStorage.normalizeSettings({
      title: $('titleInput').value.trim(),
      subtitle: $('subtitleInput').value.trim(),
      message: $('messageInput').value.trim(),
      city: $('cityInput').value.trim(),
      photoIntervalMs: Number($('intervalInput').value) || 12000,
      photoScale: Number($('photoScaleInput').value) || 72,
      accent: $('accentInput').value,
      themeMode: $('themeModeInput').value,
      showWeather: $('showWeatherInput').checked,
      showTime: $('showTimeInput').checked,
      fullScreenHint: $('fullScreenInput').checked,
      photoUrls: toLines($('photosInput').value),
      links: toLines($('linksInput').value).map((line) => {
        const [label, url] = line.split('|').map((s) => s.trim());
        return { label: label || 'Lien', url: url || '#' };
      })
    });
  }

  function init() {
    const current = CadreStorage.getSettings();
    renderForm(current);

    $('settingsForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const saved = CadreStorage.saveSettings(collectForm());
      renderForm(saved);
      alert('Paramètres enregistrés.');
    });

    $('resetBtn').addEventListener('click', () => {
      const restored = CadreStorage.resetSettings();
      renderForm(restored);
      alert('Paramètres réinitialisés.');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
