(function (global) {
  const WEATHER_EMOJI = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌦️', 56: '🌧️', 57: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
    71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️',
    80: '🌧️', 81: '🌧️', 82: '🌧️', 85: '❄️', 86: '❄️',
    95: '⛈️', 96: '⛈️', 99: '⛈️'
  };

  function weatherEmoji(code) {
    return WEATHER_EMOJI[code] || '🌡️';
  }

  async function geocodeCity(name) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=fr&format=json`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Geocoding failed: HTTP ${response.status}`);
    const data = await response.json();
    return data.results?.[0] || null;
  }

  async function fetchWeather(city) {
    const place = await geocodeCity(city || 'Paris');
    if (!place) throw new Error('Ville introuvable');
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`;
    const response = await fetch(forecastUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Forecast failed: HTTP ${response.status}`);
    const data = await response.json();
    const current = data.current || {};
    const daily = data.daily || {};
    return {
      place,
      currentTemp: Math.round(current.temperature_2m),
      weatherCode: current.weather_code,
      emoji: weatherEmoji(current.weather_code),
      minTemp: Math.round(daily.temperature_2m_min?.[0] ?? current.temperature_2m),
      maxTemp: Math.round(daily.temperature_2m_max?.[0] ?? current.temperature_2m)
    };
  }

  global.CadreWeather = {
    weatherEmoji,
    fetchWeather
  };
})(window);
