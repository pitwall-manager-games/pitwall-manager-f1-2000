import { Track } from './track.js';
import { calcTyreWear, calcFuelConsumption, calcPitStopTime, TYRE_CONFIG, FUEL_CAPACITY } from './physics.js';

const TOTAL_LAPS = 60;

const AI_NAMES = ['Frentzen', 'Villeneuve', 'Barrichello', 'Irvine', 'Fisichella']
const AI_PERSONALITIES = [
  { paceBias: 'attack', engineBias: 'high', pitThreshold: 25, aggro: 1.15 },
  { paceBias: 'normal', engineBias: 'high', pitThreshold: 20, aggro: 1.05 },
  { paceBias: 'normal', engineBias: 'normal', pitThreshold: 18, aggro: 1.0 },
  { paceBias: 'defend', engineBias: 'normal', pitThreshold: 15, aggro: 0.95 },
  { paceBias: 'conserve', engineBias: 'low', pitThreshold: 12, aggro: 0.90 },
]

function createAIDrivers() {
  return AI_NAMES.map((name, i) => ({
    id: 10 + i,
    name,
    pace: 'normal',
    engine: 'normal',
    tyreWear: 0,
    fuel: 65,
    targetFuel: 65,
    stress: 10 + Math.random() * 20,
    fatigue: 5 + Math.random() * 10,
    pitRequested: false,
    selectedTyre: 'medium',
    lapsOnTyre: 0,
    lapsCompleted: 0,
    progress: 0,
    isPlayer: false,
    personality: AI_PERSONALITIES[i],
    decisionTimer: 0,
  }))
}

const state = {
  mode: 'classic',
  currentLap: 1,
  weather: 'dry',
  forecast: { changeLap: 25, nextWeather: 'rain' },
  drivers: [
    { id: 1, name: 'Piloto 1', pace: 'normal', engine: 'normal', tyreWear: 0, fuel: 65, targetFuel: 65, stress: 20, fatigue: 10, pitRequested: false, selectedTyre: 'medium', lapsOnTyre: 0, lapsCompleted: 0, progress: 0, isPlayer: true },
    { id: 2, name: 'Piloto 2', pace: 'normal', engine: 'normal', tyreWear: 0, fuel: 65, targetFuel: 65, stress: 10, fatigue: 5, pitRequested: false, selectedTyre: 'medium', lapsOnTyre: 0, lapsCompleted: 0, progress: 0, isPlayer: true },
  ],
};

let track;
let raceActive = false;

function init() {
  document.getElementById('start-fuel').addEventListener('input', (e) => {
    document.getElementById('start-fuel-value').textContent = e.target.value
  })

  document.getElementById('start-race-btn').addEventListener('click', () => {
    const startTyre = document.getElementById('start-tyre').value
    const startFuel = Number(document.getElementById('start-fuel').value)

    state.drivers = [
      { ...state.drivers[0], selectedTyre: startTyre, fuel: startFuel, targetFuel: startFuel },
      { ...state.drivers[1], selectedTyre: startTyre, fuel: startFuel, targetFuel: startFuel },
      ...createAIDrivers(),
    ]

    document.getElementById('title-screen').style.display = 'none'
    document.getElementById('race-screen').style.display = 'flex'

    const canvas = document.getElementById('track-canvas');
    track = new Track(canvas);

    bindUI();
    renderCarDiagrams();
    renderStatus();
    raceActive = true
    startGameLoop();
  })
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
    document.getElementById(`${prefix}-tyre-select`).addEventListener('change', (e) => {
      state.drivers[index].selectedTyre = e.target.value;
    });
    document.getElementById(`${prefix}-fuel`).addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById(`${prefix}-fuel-value`).textContent = val;
      state.drivers[index].targetFuel = Number(val);
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
  if (!raceActive) return

  const weather = getCurrentWeather();

  state.drivers.forEach((driver) => {
    if (!driver.isPlayer) updateAIDriver(driver)

    const progressGain = getProgressGain(driver, weather);
    driver.progress += progressGain;

    if (driver.progress >= 100) {
      completeLap(driver, weather);
    }
  });

  state.currentLap = Math.max(...state.drivers.map(d => d.lapsCompleted)) + 1

  if (state.currentLap > TOTAL_LAPS) {
    endRace()
    return
  }

  track.setCars(state.drivers);
  renderTiming();
  renderStatus();
  renderCarDiagrams();
}

function updateAIDriver(d) {
  d.decisionTimer = (d.decisionTimer || 0) + 1

  if (d.decisionTimer % 30 === 0) {
    const p = d.personality
    const tyrePct = d.tyreWear / 100
    const lapsRemaining = TOTAL_LAPS - (d.lapsCompleted || 0)
    const enoughFuel = d.fuel > lapsRemaining * 3

    if (tyrePct > 0.7 || (!enoughFuel && d.lapsCompleted > 5)) {
      d.pitRequested = true
    }

    if (!d.pitRequested) {
      if (tyrePct > 0.5) {
        d.pace = 'conserve'
        d.engine = 'low'
      } else {
        const roll = Math.random()
        if (roll < 0.4) {
          d.pace = p.paceBias
          d.engine = p.engineBias
        } else if (roll < 0.7) {
          d.pace = 'normal'
          d.engine = 'normal'
        } else {
          d.pace = Math.random() < 0.5 ? 'attack' : 'conserve'
          d.engine = Math.random() < 0.5 ? 'high' : 'low'
        }
      }
    }
  }
}

function endRace() {
  raceActive = false
  document.getElementById('race-screen').style.display = 'none'
  document.getElementById('results-screen').style.display = 'flex'

  const sorted = [...state.drivers].sort((a, b) => b.lapsCompleted - a.lapsCompleted)
  const tbody = document.getElementById('results-body')
  tbody.innerHTML = ''

  sorted.forEach((d, i) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>P${i + 1}</td>
      <td>${d.name}</td>
      <td>${d.lapsCompleted}</td>
      <td>${TYRE_CONFIG[d.selectedTyre]?.label || '-'}</td>
      <td>-</td>
    `
    tbody.appendChild(tr)
  })
}

document.getElementById('back-to-menu-btn').addEventListener('click', () => {
  document.getElementById('results-screen').style.display = 'none'
  document.getElementById('title-screen').style.display = 'flex'
  state.currentLap = 1
  state.drivers = [
    { id: 1, name: 'Piloto 1', pace: 'normal', engine: 'normal', tyreWear: 0, fuel: 65, targetFuel: 65, stress: 20, fatigue: 10, pitRequested: false, selectedTyre: 'medium', lapsOnTyre: 0, lapsCompleted: 0, progress: 0, isPlayer: true },
    { id: 2, name: 'Piloto 2', pace: 'normal', engine: 'normal', tyreWear: 0, fuel: 65, targetFuel: 65, stress: 10, fatigue: 5, pitRequested: false, selectedTyre: 'medium', lapsOnTyre: 0, lapsCompleted: 0, progress: 0, isPlayer: true },
  ]
})

function getCurrentWeather() {
  if (state.currentLap >= state.forecast.changeLap) {
    return state.forecast.nextWeather;
  }
  return state.weather;
}

function getProgressGain(driver, weather) {
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

  const tyreDurability = TYRE_CONFIG[driver.selectedTyre]?.durability?.max || 35;
  const tyreFactor = driver.lapsOnTyre < tyreDurability ? 1.0 : 0.6;
  const fuelFactor = 1 - (driver.fuel / FUEL_CAPACITY) * 0.08;
  const stressFactor = 1 - (driver.stress / 100) * 0.15;
  const fatigueFactor = 1 - (driver.fatigue / 100) * 0.1;

  const pace = baseSpeed[driver.pace] || 1.0;
  const engine = engineBoost[driver.engine] || 1.0;
  const tyreSpeed = TYRE_CONFIG[driver.selectedTyre]?.speed || 1.0;

  let weatherFactor = 1.0
  if (weather === 'rain') {
    if (driver.selectedTyre === 'wet' || driver.selectedTyre === 'inter') {
      weatherFactor = 0.92
    } else {
      weatherFactor = 0.55
    }
  } else {
    if (driver.selectedTyre === 'wet' || driver.selectedTyre === 'inter') {
      weatherFactor = 0.85
    }
  }

  return 0.5 * pace * engine * tyreSpeed * tyreFactor * fuelFactor * stressFactor * fatigueFactor * weatherFactor;
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
}

function executePitStop(driver) {
  const fuelToAdd = Math.max(0, driver.targetFuel - driver.fuel)
  const pitTime = calcPitStopTime(fuelToAdd)

  driver.tyreWear = 0
  driver.lapsOnTyre = 0
  driver.fuel = driver.targetFuel
  driver.pitRequested = false

  const PROGRESS_PER_SECOND = 4.74
  driver.progress -= pitTime * PROGRESS_PER_SECOND
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

  const sorted = [...state.drivers].sort((a, b) => {
    const aTotal = a.lapsCompleted * 100 + a.progress
    const bTotal = b.lapsCompleted * 100 + b.progress
    return bTotal - aTotal
  })

  const container = document.getElementById('timing-rows')
  container.innerHTML = ''

  sorted.forEach((d, i) => {
    const tyreSymbol = { soft: '🟥', medium: '🟨', hard: '⬜', inter: '🟢', wet: '🔵' }[d.selectedTyre] || '🟨'
    const tyreLabel = TYRE_CONFIG[d.selectedTyre]?.label || '-'
    const pos = i + 1

    const row = document.createElement('div')
    row.className = 'timing-row'
    row.innerHTML = `
      <span class="pos">P${pos}</span>
      <span class="driver-name">${d.name}</span>
      <span class="tyre">${tyreSymbol} ${tyreLabel}${Math.round(d.lapsOnTyre)}</span>
    `
    container.appendChild(row)
  })
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

  const bodyWear = (driver.tyreWear + driver.lapsOnTyre * 2) / 2
  const frontWingWear = driver.tyreWear * 0.8
  const rearWingWear = driver.tyreWear * 0.8
  const noseWear = driver.stress * 1.2
  const engineWear = driver.engine === 'high' ? 60 : driver.engine === 'low' ? 10 : 30

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
