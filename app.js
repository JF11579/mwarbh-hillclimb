/* ============================================================
   MWARBH — Tab navigation + Live Weather (Open-Meteo)
   ============================================================ */

// ==================== TABS ====================
(function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const panels  = document.querySelectorAll('.tab-panel');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      buttons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById('tab-' + target);
      if (panel) panel.classList.add('active');

      // Lazy-load weather when that tab is first opened
      if (target === 'weather') fetchWeather();
    });
  });
})();

// ==================== WEATHER (Open-Meteo) ====================

// Summit: 44.2706°N, 71.3033°W, 1916 m (6288 ft)
// Base:   44.2639°N, 71.2922°W, ~488 m (1600 ft)
const LOCATIONS = {
  summit: { lat: 44.2706, lon: -71.3033, elevation: 1916 },
  base:   { lat: 44.2639, lon: -71.2922, elevation: 488  },
};

let weatherFetched = false;

function buildOpenMeteoUrl(loc) {
  const params = new URLSearchParams({
    latitude:            loc.lat,
    longitude:           loc.lon,
    elevation:           loc.elevation,
    current:             'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,precipitation',
    temperature_unit:    'fahrenheit',
    wind_speed_unit:     'mph',
    precipitation_unit:  'inch',
    timezone:            'America/New_York',
    forecast_days:       1,
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

function wmoDescription(code) {
  const WMO = {
    0:  'Clear sky',
    1:  'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
    85: 'Snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Severe thunderstorm',
  };
  return WMO[code] || `Code ${code}`;
}

function windDirection(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function renderWeatherStation(key, data) {
  const c = data.current;
  const mainEl    = document.getElementById(key + '-main');
  const detailEl  = document.getElementById(key + '-details');

  const temp      = Math.round(c.temperature_2m);
  const feels     = Math.round(c.apparent_temperature);
  const condition = wmoDescription(c.weather_code);
  const humidity  = c.relative_humidity_2m;
  const wind      = Math.round(c.wind_speed_10m);
  const gusts     = Math.round(c.wind_gusts_10m);
  const windDir   = windDirection(c.wind_direction_10m);
  const precip    = c.precipitation;
  const now       = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

  mainEl.innerHTML = `
    <div class="weather-temp">${temp}<span class="weather-temp-unit">°F</span></div>
    <div class="weather-condition">${condition}</div>
  `;

  detailEl.innerHTML = `
    <div class="weather-stat">
      <span class="weather-stat-label">Feels Like</span>
      <span class="weather-stat-val">${feels}<span class="weather-stat-unit">°F</span></span>
    </div>
    <div class="weather-stat">
      <span class="weather-stat-label">Humidity</span>
      <span class="weather-stat-val">${humidity}<span class="weather-stat-unit">%</span></span>
    </div>
    <div class="weather-stat">
      <span class="weather-stat-label">Wind</span>
      <span class="weather-stat-val">${wind}<span class="weather-stat-unit">mph ${windDir}</span></span>
    </div>
    <div class="weather-stat">
      <span class="weather-stat-label">Gusts</span>
      <span class="weather-stat-val">${gusts}<span class="weather-stat-unit">mph</span></span>
    </div>
    <div class="weather-stat">
      <span class="weather-stat-label">Precip</span>
      <span class="weather-stat-val">${precip.toFixed(2)}<span class="weather-stat-unit">in</span></span>
    </div>
    <div class="weather-stat">
      <span class="weather-stat-label">Updated</span>
      <span class="weather-stat-val" style="font-size:13px;color:var(--muted)">${now}</span>
    </div>
  `;
}

async function fetchWeatherStation(key) {
  const loc = LOCATIONS[key];
  const mainEl = document.getElementById(key + '-main');
  const detailEl = document.getElementById(key + '-details');

  mainEl.innerHTML = '<div class="loading-spinner">Fetching…</div>';
  detailEl.innerHTML = '';

  try {
    const res = await fetch(buildOpenMeteoUrl(loc));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderWeatherStation(key, data);
  } catch (err) {
    mainEl.innerHTML = `<div class="weather-error">Could not load weather data. Check connection.</div>`;
    console.error('[MWARBH weather]', key, err);
  }
}

function fetchWeather() {
  fetchWeatherStation('summit');
  fetchWeatherStation('base');
}

// Auto-fetch if weather tab is already active on load
document.addEventListener('DOMContentLoaded', () => {
  const weatherPanel = document.getElementById('tab-weather');
  if (weatherPanel && weatherPanel.classList.contains('active')) {
    fetchWeather();
  }
});
