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

// ==================== RIDE DOWN — CARPOOL LOOKUP ====================

const CARPOOL = {
  // --- DRIVERS ---
  "7291": { name: "Tom Beckett",     role: "driver", car: { color: "White",  make: "Subaru",  model: "Outback",        plate: "NH 482-XJ3" }, cell: "(603) 555-0142" },
  "4853": { name: "Laura Chen",      role: "driver", car: { color: "Silver", make: "Honda",   model: "CR-V",           plate: "VT 8K9-WR1" }, cell: "(802) 555-0387" },
  "2067": { name: "Marcus Johnson",  role: "driver", car: { color: "Blue",   make: "Toyota",  model: "Tacoma",         plate: "ME 203-4PP" }, cell: "(207) 555-0261" },
  "9134": { name: "Diane Kowalski",  role: "driver", car: { color: "Red",    make: "Ford",    model: "Explorer",       plate: "MA 7LM-N42" }, cell: "(617) 555-0493" },
  "6482": { name: "Kevin Park",      role: "driver", car: { color: "Black",  make: "Jeep",    model: "Grand Cherokee", plate: "NH 3RR-476" }, cell: "(603) 555-0815" },
  "3719": { name: "Rachel Torres",   role: "driver", car: { color: "Green",  make: "Subaru",  model: "Forester",       plate: "VT KK7-201" }, cell: "(802) 555-0634" },
  "8546": { name: "James O'Brien",   role: "driver", car: { color: "Gray",   make: "Volvo",   model: "XC60",           plate: "MA 5BV-T88" }, cell: "(617) 555-0277" },
  "1293": { name: "Emily Walsh",     role: "driver", car: { color: "Navy",   make: "Honda",   model: "Pilot",          plate: "NH 9JQ-245" }, cell: "(603) 555-0561" },
  "5807": { name: "Andre Williams",  role: "driver", car: { color: "White",  make: "Toyota",  model: "4Runner",        plate: "NY 7ZX-R33" }, cell: "(518) 555-0723" },
  "0476": { name: "Patricia Huang",  role: "driver", car: { color: "Silver", make: "Audi",    model: "Q5",             plate: "MA 2KL-819" }, cell: "(617) 555-0948" },

  // --- PASSENGERS → Tom Beckett (7291) ---
  "3847": { name: "Sarah Mitchell",   role: "passenger", driverKey: "7291" },
  "6120": { name: "Connor Hayes",     role: "passenger", driverKey: "7291" },
  "9504": { name: "Mei Lin",          role: "passenger", driverKey: "7291" },
  "2738": { name: "David Orozco",     role: "passenger", driverKey: "7291" },

  // --- PASSENGERS → Laura Chen (4853) ---
  "5931": { name: "Jessica Bloom",    role: "passenger", driverKey: "4853" },
  "8274": { name: "Ryan Fitzgerald",  role: "passenger", driverKey: "4853" },
  "1658": { name: "Tanya Reeves",     role: "passenger", driverKey: "4853" },

  // --- PASSENGERS → Marcus Johnson (2067) ---
  "7045": { name: "Alex Kowalski",    role: "passenger", driverKey: "2067" },
  "3892": { name: "Brianna Scott",    role: "passenger", driverKey: "2067" },
  "6317": { name: "Nate Patel",       role: "passenger", driverKey: "2067" },
  "4160": { name: "Sam Nguyen",       role: "passenger", driverKey: "2067" },

  // --- PASSENGERS → Diane Kowalski (9134) ---
  "0823": { name: "Frank DeLuca",     role: "passenger", driverKey: "9134" },
  "7469": { name: "Olivia Reed",      role: "passenger", driverKey: "9134" },
  "2951": { name: "Miguel Santos",    role: "passenger", driverKey: "9134" },

  // --- PASSENGERS → Kevin Park (6482) ---
  "5074": { name: "Amanda Carter",    role: "passenger", driverKey: "6482" },
  "8641": { name: "Tony Russo",       role: "passenger", driverKey: "6482" },
  "3028": { name: "Linda Yee",        role: "passenger", driverKey: "6482" },

  // --- PASSENGERS → Rachel Torres (3719) ---
  "9285": { name: "Jordan Simmons",   role: "passenger", driverKey: "3719" },
  "1840": { name: "Chris Walton",     role: "passenger", driverKey: "3719" },
  "6593": { name: "Paige Brennan",    role: "passenger", driverKey: "3719" },

  // --- PASSENGERS → James O'Brien (8546) ---
  "4017": { name: "Heather Quinn",    role: "passenger", driverKey: "8546" },
  "7382": { name: "Nathan Burke",     role: "passenger", driverKey: "8546" },
  "2609": { name: "Sofia Mendez",     role: "passenger", driverKey: "8546" },
  "5148": { name: "Will Thornton",    role: "passenger", driverKey: "8546" },

  // --- PASSENGERS → Emily Walsh (1293) ---
  "8730": { name: "Derek Manning",    role: "passenger", driverKey: "1293" },
  "3465": { name: "Claire Nakamura",  role: "passenger", driverKey: "1293" },
  "6891": { name: "Phillip Gao",      role: "passenger", driverKey: "1293" },

  // --- PASSENGERS → Andre Williams (5807) ---
  "1234": { name: "Rosa Ivanovic",    role: "passenger", driverKey: "5807" },
  "4680": { name: "Brett Hutchins",   role: "passenger", driverKey: "5807" },
  "9023": { name: "Kayla Frost",      role: "passenger", driverKey: "5807" },

  // --- PASSENGERS → Patricia Huang (0476) ---
  "7815": { name: "Logan Strickland", role: "passenger", driverKey: "0476" },
  "2390": { name: "Isabel Fern",      role: "passenger", driverKey: "0476" },
  "5167": { name: "Carlos Vega",      role: "passenger", driverKey: "0476" },
};

const CAR_COLORS = {
  White:  '#d8d8d8',
  Silver: '#a0a0a0',
  Blue:   '#2c6fad',
  Red:    '#c0392b',
  Black:  '#4a4a4a',
  Green:  '#27ae60',
  Gray:   '#6c7a89',
  Navy:   '#1e3a5f',
};

// --- PIN Entry ---
(function initPinEntry() {
  const boxes = Array.from(document.querySelectorAll('.pin-box'));
  if (!boxes.length) return;

  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '').slice(-1);
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
      if (box.value && i === boxes.length - 1) lookupRider();
    });

    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        boxes[i - 1].focus();
        boxes[i - 1].value = '';
      }
      if (e.key === 'Enter') lookupRider();
    });

    box.addEventListener('paste', e => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      [...paste.slice(0, 4)].forEach((ch, j) => { if (boxes[j]) boxes[j].value = ch; });
      const last = Math.min(paste.length - 1, boxes.length - 1);
      boxes[last].focus();
      if (paste.length >= 4) lookupRider();
    });
  });
})();

function getPinCode() {
  return Array.from(document.querySelectorAll('.pin-box')).map(b => b.value).join('');
}

function clearPin() {
  document.querySelectorAll('.pin-box').forEach(b => { b.value = ''; });
  const resultEl = document.getElementById('ridedown-result');
  if (resultEl) { resultEl.style.display = 'none'; resultEl.innerHTML = ''; }
  const first = document.querySelector('.pin-box');
  if (first) first.focus();
}

function lookupRider() {
  const code    = getPinCode();
  const resultEl = document.getElementById('ridedown-result');
  if (!resultEl || code.length !== 4) return;

  const rider = CARPOOL[code];

  if (!rider) {
    resultEl.style.display = 'flex';
    resultEl.innerHTML = `
      <div class="result-error">
        <div class="result-error-icon">?</div>
        <div class="result-error-text">
          <strong>No match for &bull;&bull;&bull;&bull; ${code}</strong>
          <p>Check the digits match the card you used on BikeReg. Still stuck? Find a race official at the summit.</p>
        </div>
        <button class="result-retry-btn" onclick="clearPin()">Try Again</button>
      </div>`;
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  if (rider.role === 'passenger') {
    resultEl.style.display = 'flex';
    resultEl.innerHTML = renderPassengerCard(rider, CARPOOL[rider.driverKey]);
  } else {
    const passengers = Object.values(CARPOOL).filter(r => r.role === 'passenger' && r.driverKey === code);
    resultEl.style.display = 'flex';
    resultEl.innerHTML = renderDriverCard(rider, passengers);
  }
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderPassengerCard(rider, driver) {
  const { car, cell, name: driverName } = driver;
  const colorHex = CAR_COLORS[car.color] || '#888';
  return `
    <div class="result-card">
      <div class="result-greeting">
        <span class="result-greeting-label">Welcome to the Summit</span>
        <span class="result-greeting-name">${rider.name}</span>
      </div>
      <div class="result-section-label">Your Ride Down</div>
      <div class="result-car-block">
        <div class="result-car-color-bar" style="background:${colorHex}"></div>
        <div class="result-car-info">
          <div class="result-car-name">${car.color} ${car.make} ${car.model}</div>
          <span class="result-plate">${car.plate}</span>
        </div>
      </div>
      <div class="result-driver-row">
        <div class="result-driver-item">
          <span class="result-driver-label">Driver</span>
          <span class="result-driver-val">${driverName}</span>
        </div>
        <div class="result-driver-item">
          <span class="result-driver-label">Cell</span>
          <a class="result-driver-val result-phone" href="tel:${cell}">${cell}</a>
        </div>
      </div>
      <div class="result-tip">&#9651;&nbsp; Meet at the summit staging area after the finish. Text your driver if you need to leave early.</div>
      <button class="result-retry-btn" onclick="clearPin()">Look Up Another Rider</button>
    </div>`;
}

function renderDriverCard(driver, passengers) {
  const { car } = driver;
  const colorHex = CAR_COLORS[car.color] || '#888';
  const pList = passengers.map(p => `
    <div class="result-pax-row">
      <span class="result-pax-dot">&#9651;</span>
      <span class="result-pax-name">${p.name}</span>
    </div>`).join('');
  return `
    <div class="result-card result-card-driver">
      <div class="result-greeting">
        <span class="result-greeting-label">Welcome to the Summit</span>
        <span class="result-greeting-name">${driver.name}</span>
      </div>
      <div class="result-section-label">You&rsquo;re Driving</div>
      <div class="result-car-block">
        <div class="result-car-color-bar" style="background:${colorHex}"></div>
        <div class="result-car-info">
          <div class="result-car-name">${car.color} ${car.make} ${car.model}</div>
          <span class="result-plate">${car.plate}</span>
        </div>
      </div>
      <div class="result-section-label" style="margin-top:16px">Your Passengers (${passengers.length})</div>
      <div class="result-pax-list">${pList}</div>
      <div class="result-tip">&#9651;&nbsp; Thank you for driving! Please wait at staging. Your passengers have your name &mdash; they&rsquo;ll find you.</div>
      <button class="result-retry-btn" onclick="clearPin()">Look Up Another Rider</button>
    </div>`;
}
