import { Track } from './track.js';
import { calcTyreWear, calcFuelConsumption, TYRE_CONFIG, FUEL_CAPACITY } from './physics.js';

const TOTAL_LAPS = 60;

const state = {
  mode: 'classic',
  currentLap: 1,
  weather: 'dry',
  forecast: { changeLap: 25, nextWeather: 'rain' },
  drivers: [
    { id: 1, pace: 'normal', engine: 'normal', drs: 'normal', tyreWear: 0, fuel: 65, stress: 20, fatigue: 10, pitRequested: false, selectedTyre: 'medium', lapsOnTyre: 0, progress: 0, isPlayer: true },
    { id: 2, pace: 'normal', engine: 'normal', drs: 'normal', tyreWear: 0, fuel: 65, stress: 10, fatigue: 5, pitRequested: false, selectedTyre: 'medium', lapsOnTyre: 0, progress: 0, isPlayer: true },
  ],
};

let track;

function init() {
  const canvas = document.getElementById('track-canvas');
  track = new Track(canvas);

  bindUI();
  renderCarDiagrams();
  renderStatus();
  startGameLoop();
}

function bindUI() {
  const driverConfigs = [
    { prefix: 'd1', index: 0 },
    { prefix: 'd2', index: 1 },
  ];

  driverConfigs.forEach(({ prefix, index }) => {
    document.getElementById(`${prefix}-pace`).addEventListener('change', (e) => {
      state.drivers[index].pace = e.target.value;
    });
    document.getElementById(`${prefix}-engine`).addEventListener('change', (e) => {
      state.drivers[index].engine = e.target.value;
    });
    document.getElementById(`${prefix}-drs`).addEventListener('change', (e) => {
      state.drivers[index].drs = e.target.value;
    });
    document.getElementById(`${prefix}-tyre-select`).addEventListener('change', (e) => {
      state.drivers[index].selectedTyre = e.target.value;
    });
    document.getElementById(`${prefix}-fuel`).addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById(`${prefix}-fuel-value`).textContent = val;
      state.drivers[index].fuel = Number(val);
    });
    document.getElementById(`${prefix}-pit-request`).addEventListener('change', (e) => {
      state.drivers[index].pitRequested = e.target.checked;
    });
  });
}

function startGameLoop() {
  let lastTime = 0;
  const TICK_INTERVAL = 100;

  function tick(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;

    if (delta >= TICK_INTERVAL) {
      lastTime = timestamp;
      update();
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function update() {
  const weather = getCurrentWeather();

  state.drivers.forEach((driver) => {
    const progressGain = getProgressGain(driver, weather);
    driver.progress += progressGain;

    if (driver.progress >= 100) {
      completeLap(driver, weather);
    }

    driver.lapsOnTyre += progressGain / 100 * (1 / 60);
  });

  track.setCars(state.drivers);
  renderTiming();
  renderStatus();
  renderCarDiagrams();
}

function getCurrentWeather() {
  if (state.currentLap >= state.forecast.changeLap) {
    return state.forecast.nextWeather;
  }
  return state.weather;
}

function getProgressGain(driver, _weather) {
  const baseSpeed = {
    attack: 1.2,
    normal: 1.0,
    defend: 0.9,
    conserve: 0.7,
  };

  const engineBoost = {
    high: 1.15,
    normal: 1.0,
    low: 0.85,
  };

  const drsBoost = {
    push: 1.05,
    normal: 1.0,
    save: 0.95,
  };

  const tyreDurability = TYRE_CONFIG[driver.selectedTyre]?.durability?.max || 35;
  const tyreFactor = driver.lapsOnTyre < tyreDurability ? 1.0 : 0.6;
  const fuelFactor = 1 - (driver.fuel / FUEL_CAPACITY) * 0.08;
  const stressFactor = 1 - (driver.stress / 100) * 0.15;
  const fatigueFactor = 1 - (driver.fatigue / 100) * 0.1;

  const pace = baseSpeed[driver.pace] || 1.0;
  const engine = engineBoost[driver.engine] || 1.0;
  const drs = drsBoost[driver.drs] || 1.0;

  return 0.5 * pace * engine * drs * tyreFactor * fuelFactor * stressFactor * fatigueFactor;
}

function completeLap(driver, weather) {
  driver.progress = 0;
  driver.lapsOnTyre += 1;

  const tyreWearLap = calcTyreWear(driver.pace, 1, weather === 'rain');
  driver.tyreWear = Math.min(100, driver.tyreWear + tyreWearLap);

  const fuelConsumed = calcFuelConsumption(driver.engine, 1);
  driver.fuel = Math.max(0, driver.fuel - fuelConsumed);

  if (driver.pitRequested) {
    executePitStop(driver);
  }

  updateDriverState(driver);
  state.currentLap += 1;
}

function executePitStop(driver) {
  driver.tyreWear = 0;
  driver.lapsOnTyre = 0;
  driver.pitRequested = false;
}

function updateDriverState(driver) {
  if (driver.pace === 'attack' || driver.pace === 'defend') {
    driver.stress = Math.min(100, driver.stress + 8);
    driver.fatigue = Math.min(100, driver.fatigue + 5);
  } else if (driver.pace === 'conserve') {
    driver.stress = Math.max(0, driver.stress - 12);
    driver.fatigue = Math.min(100, driver.fatigue + 2);
  } else {
    driver.stress = Math.max(0, driver.stress - 3);
    driver.fatigue = Math.min(100, driver.fatigue + 3);
  }
}

function renderTiming() {
  document.getElementById('current-lap').textContent = Math.min(state.currentLap, TOTAL_LAPS);

  state.drivers.forEach((driver, i) => {
    const prefix = `d${i + 1}`;
    const tyreConfig = TYRE_CONFIG[driver.selectedTyre] || TYRE_CONFIG.medium;
    const tyreSymbol = { soft: '🟥', medium: '🟨', hard: '⬜', inter: '🟢', wet: '🔵' }[driver.selectedTyre] || '🟨';
    document.getElementById(`${prefix}-tyre`).textContent = `${tyreSymbol} ${tyreConfig.label}${Math.round(driver.lapsOnTyre)}`;
  });
}

function renderStatus() {
  state.drivers.forEach((driver, i) => {
    const prefix = `d${i + 1}`;
    document.getElementById(`${prefix}-stress`).style.width = `${driver.stress}%`;
    document.getElementById(`${prefix}-stress-value`).textContent = `${Math.round(driver.stress)}%`;
    document.getElementById(`${prefix}-fatigue`).style.width = `${driver.fatigue}%`;
    document.getElementById(`${prefix}-fatigue-value`).textContent = `${Math.round(driver.fatigue)}%`;
  });
}

function renderCarDiagrams() {
  state.drivers.forEach((driver, i) => {
    const canvas = document.getElementById(`car-canvas-d${i + 1}`);
    drawCarDiagram(canvas, driver);
  });
}

function drawCarDiagram(canvas, driver) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const bodyTop = 30;

  const tyreColor = getTyreColor(driver.tyreWear);
  const partColor = (wear) => {
    if (wear < 30) return 'rgba(255,255,255,0.15)';
    if (wear < 60) return '#ffcc00';
    return '#ff3344';
  };

  const bodyWear = Math.random() * 40;
  const frontWingWear = Math.random() * 40;
  const rearWingWear = Math.random() * 40;
  const noseWear = Math.random() * 40;
  const engineWear = Math.random() * 40;

  ctx.save();

  ctx.translate(cx, bodyTop);
  ctx.strokeStyle = '#8888a0';
  ctx.lineWidth = 1.5;

  ctx.fillStyle = partColor(noseWear);
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(-8, 5);
  ctx.lineTo(8, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = partColor(frontWingWear);
  ctx.beginPath();
  ctx.moveTo(-35, 8);
  ctx.lineTo(-20, 5);
  ctx.lineTo(-15, 8);
  ctx.lineTo(-35, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(35, 8);
  ctx.lineTo(20, 5);
  ctx.lineTo(15, 8);
  ctx.lineTo(35, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = partColor(bodyWear);
  ctx.beginPath();
  ctx.moveTo(-12, 5);
  ctx.lineTo(-15, 60);
  ctx.lineTo(15, 60);
  ctx.lineTo(12, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-20, 60);
  ctx.lineTo(-18, 100);
  ctx.lineTo(18, 100);
  ctx.lineTo(20, 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-15, 100);
  ctx.lineTo(-12, 130);
  ctx.lineTo(12, 130);
  ctx.lineTo(15, 100);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = partColor(engineWear);
  ctx.beginPath();
  ctx.moveTo(-16, 130);
  ctx.lineTo(-18, 155);
  ctx.lineTo(18, 155);
  ctx.lineTo(16, 130);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = partColor(rearWingWear);
  ctx.beginPath();
  ctx.moveTo(-36, 155);
  ctx.lineTo(-18, 150);
  ctx.lineTo(-15, 155);
  ctx.lineTo(-36, 162);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(36, 155);
  ctx.lineTo(18, 150);
  ctx.lineTo(15, 155);
  ctx.lineTo(36, 162);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  const tyrePositions = [
    { x: cx - 16, y: bodyTop + 35, label: 'DI' },
    { x: cx + 10, y: bodyTop + 35, label: 'DD' },
    { x: cx - 16, y: bodyTop + 120, label: 'TI' },
    { x: cx + 10, y: bodyTop + 120, label: 'TD' },
  ];

  tyrePositions.forEach(({ x, y }) => {
    ctx.fillStyle = tyreColor;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#666688';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

function getTyreColor(wear) {
  if (wear < 5) return '#ffcc00';
  if (wear < 30) return '#33ff77';
  if (wear < 70) return '#ffcc00';
  return '#ff3344';
}

document.addEventListener('DOMContentLoaded', init);
