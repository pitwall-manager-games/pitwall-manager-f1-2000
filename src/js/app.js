import { Track } from './track.js';
import {
  calcTyreWear, calcFuelConsumption, calcPitStopTime,
  TYRE_CONFIG, FUEL_CAPACITY, BUDGET,
  DRIVER_LEVELS, ENGINE_TIERS, CHASSIS_TIERS,
  generateDriverAttributes,
  AI_PERSONALITY_CONFIG, pickWeighted,
  computeFactorySetup, SETUP_SCORE,
} from './physics.js';

const TOTAL_LAPS = 60;

const TEAM_COLORS = {
  rojo: '#ff4444',
  amarillo: '#ffdd00',
  verde: '#00ee66',
  azul: '#4499ff',
  naranja: '#ff8800',
}

const AI_TEAMS = [
  { short: 'roj', color: 'rojo', personalityKey: 'agresiva' },
  { short: 'ama', color: 'amarillo', personalityKey: 'equilibrada' },
  { short: 'ver', color: 'verde', personalityKey: 'conservadora' },
  { short: 'azu', color: 'azul', personalityKey: 'agresiva' },
  { short: 'nar', color: 'naranja', personalityKey: 'equilibrada' },
]

function createAIDrivers() {
  const drivers = []
  AI_TEAMS.forEach((team) => {
    const persCfg = AI_PERSONALITY_CONFIG[team.personalityKey]

    const engineTier = pickWeighted(persCfg.engineTierBias)
    const chassisTier = pickWeighted(persCfg.chassisTierBias)
    const d1Level = pickWeighted(persCfg.driverLevelBias)
    const d2Level = pickWeighted(persCfg.driverLevelBias)

    for (let n = 1; n <= 2; n++) {
      const level = n === 1 ? d1Level : d2Level
      const attrs = generateDriverAttributes(level)
      drivers.push({
        id: 1000 + drivers.length,
        name: `${team.short}-${n}`,
        team: team.color,
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
        level,
        attributes: attrs,
        personality: {
          agresividad: persCfg.agresividad[0] + Math.floor(Math.random() * (persCfg.agresividad[1] - persCfg.agresividad[0] + 1)),
          lealtad: persCfg.lealtad[0] + Math.floor(Math.random() * (persCfg.lealtad[1] - persCfg.lealtad[0] + 1)),
          confianza: 50,
        },
        car: {
          engineTier,
          engineSlider: 0,
          chassisTier,
          chassisSlider: 0,
          reliability: { motor: 100, caja: 100, suspension: 100, aero: 100 },
        },
        decisionTimer: 0,
      })
    }
  })
  return drivers
}

function createPlayerDrivers() {
  return [
    { id: 1, name: 'JUG-1', team: 'jug', pace: 'normal', engine: 'normal', tyreWear: 0, fuel: 65, targetFuel: 65, stress: 20, fatigue: 10, pitRequested: false, selectedTyre: 'medium', lapsOnTyre: 0, lapsCompleted: 0, progress: 0, isPlayer: true, level: 3, attributes: generateDriverAttributes(3), personality: { agresividad: 5, lealtad: 5, confianza: 50 }, car: null },
    { id: 2, name: 'JUG-2', team: 'jug', pace: 'normal', engine: 'normal', tyreWear: 0, fuel: 65, targetFuel: 65, stress: 10, fatigue: 5, pitRequested: false, selectedTyre: 'medium', lapsOnTyre: 0, lapsCompleted: 0, progress: 0, isPlayer: true, level: 3, attributes: generateDriverAttributes(3), personality: { agresividad: 5, lealtad: 5, confianza: 50 }, car: null },
  ]
}

const state = {
  mode: 'classic',
  currentLap: 1,
  weather: 'dry',
  forecast: { changeLap: 25, nextWeather: 'rain' },
  phase: 'economica',
  budget: BUDGET,
  car: {
    engineTier: 2,
    engineSlider: 0,
    chassisTier: 2,
    chassisSlider: 0,
  },
  selectedCircuit: null,
  factorySetup: null,
  drivers: createPlayerDrivers(),
  testTandas: { 1: [], 2: [] },
  testTandasUsed: { 1: 0, 2: 0 },
}

let track;
let raceActive = false;

function calcEcoTotal() {
  const engineTier = Number(document.getElementById('eco-engine-tier').value)
  const chassisTier = Number(document.getElementById('eco-chassis-tier').value)
  const d1Level = Number(document.getElementById('eco-driver1-level').value)
  const d2Level = Number(document.getElementById('eco-driver2-level').value)

  const cost = (ENGINE_TIERS[engineTier]?.cost || 0) + (CHASSIS_TIERS[chassisTier]?.cost || 0) + (DRIVER_LEVELS[d1Level]?.cost || 0) + (DRIVER_LEVELS[d2Level]?.cost || 0)
  const remaining = BUDGET - cost

  document.getElementById('eco-total').textContent = `${cost.toLocaleString()} €`
  document.getElementById('eco-remaining').textContent = `${remaining.toLocaleString()} €`
  document.getElementById('eco-continue-btn').disabled = remaining < 0
  return remaining >= 0
}

function syncEcoState() {
  state.car.engineTier = Number(document.getElementById('eco-engine-tier').value)
  state.car.engineSlider = Number(document.getElementById('eco-engine-slider').value)
  state.car.chassisTier = Number(document.getElementById('eco-chassis-tier').value)
  state.car.chassisSlider = Number(document.getElementById('eco-chassis-slider').value)
  state.drivers[0].level = Number(document.getElementById('eco-driver1-level').value)
  state.drivers[1].level = Number(document.getElementById('eco-driver2-level').value)

  state.drivers[0].attributes = generateDriverAttributes(state.drivers[0].level)
  state.drivers[1].attributes = generateDriverAttributes(state.drivers[1].level)
}

function init() {
  document.getElementById('start-setup-btn').addEventListener('click', () => {
    document.getElementById('title-screen').style.display = 'none'
    document.getElementById('economica-screen').style.display = 'flex'
    calcEcoTotal()
  })

  const ecoInputs = ['eco-engine-tier', 'eco-engine-slider', 'eco-chassis-tier', 'eco-chassis-slider', 'eco-driver1-level', 'eco-driver2-level']
  ecoInputs.forEach(id => {
    document.getElementById(id).addEventListener('change', calcEcoTotal)
    document.getElementById(id).addEventListener('input', () => {
      const el = document.getElementById(id)
      if (el.type === 'range') {
        const val = Number(el.value)
        const label = val === 0 ? '±0' : val > 0 ? `+${val}` : `${val}`
        document.getElementById(`${id}-value`).textContent = label
      }
      calcEcoTotal()
    })
  })

  document.getElementById('eco-continue-btn').addEventListener('click', () => {
    if (!calcEcoTotal()) return

    syncEcoState()

    state.drivers[0].attributes = generateDriverAttributes(state.drivers[0].level)
    state.drivers[1].attributes = generateDriverAttributes(state.drivers[1].level)
    state.testTandas = { 1: [], 2: [] }
    state.testTandasUsed = { 1: 0, 2: 0 }

    document.getElementById('economica-screen').style.display = 'none'
    document.getElementById('preparatoria-screen').style.display = 'flex'

    showPrepDriverInfo()

    document.getElementById('prep-start-race-btn').disabled = true
  })

  document.getElementById('prep-circuit').addEventListener('change', (e) => {
    const circuitId = e.target.value
    if (!circuitId) {
      state.selectedCircuit = null
      state.factorySetup = null
      document.getElementById('prep-d1-factory').textContent = '—'
      document.getElementById('prep-d2-factory').textContent = '—'
      document.getElementById('test-d1-btn').disabled = true
      document.getElementById('test-d2-btn').disabled = true
      document.getElementById('prep-start-race-btn').disabled = true
      return
    }

    state.selectedCircuit = circuitId
    state.factorySetup = computeFactorySetup(circuitId)

    const f = state.factorySetup
    const txt = `${f.alar} · ${f.ratio} · ${f.altura}`
    document.getElementById('prep-d1-factory').textContent = txt
    document.getElementById('prep-d2-factory').textContent = txt

    for (let d = 1; d <= 2; d++) {
      document.getElementById(`prep-d${d}-alar`).value = f.alar
      document.getElementById(`prep-d${d}-ratio`).value = f.ratio
      document.getElementById(`prep-d${d}-altura`).value = f.altura
      state.testTandas[d] = []
      state.testTandasUsed[d] = 0
      renderTestResults(d)
    }
    updateTestButtons()

    document.getElementById('test-d1-btn').disabled = false
    document.getElementById('test-d2-btn').disabled = false
    document.getElementById('prep-start-race-btn').disabled = false
  })

  function runTestTanda(driverIdx) {
    const driver = state.drivers[driverIdx]
    const di = driverIdx + 1
    const tandas = state.testTandas[di]
    const used = state.testTandasUsed[di]
    const circuitId = state.selectedCircuit

    if (!circuitId || used >= 5) return

    const alar = document.getElementById(`prep-d${di}-alar`).value
    const ratio = document.getElementById(`prep-d${di}-ratio`).value
    const altura = document.getElementById(`prep-d${di}-altura`).value
    const setup = { alar, ratio, altura }

    const laps = []
    for (let i = 0; i < 5; i++) {
      laps.push(simulateTestLap(setup, driver, circuitId))
    }

    const avg = laps.reduce((a, b) => a + b, 0) / laps.length
    const best = Math.min(...laps)
    const tanda = { laps, avg, best, n: used + 1, setup: { ...setup } }
    tandas.push(tanda)
    state.testTandas[di] = tandas
    state.testTandasUsed[di] = used + 1

    renderTestResults(di)
    updateTestButtons()
  }

  function simulateTestLap(setup, driver, circuitId) {
    const baseScore = SETUP_SCORE[circuitId]
    let lapTime = 90

    for (const p of ['alar', 'ratio', 'altura']) {
      lapTime *= baseScore[setup[p]][p]
    }

    const hab = driver.attributes.habilidad / 100
    const exp = driver.attributes.experiencia / 100
    const ref = driver.attributes.reflejos / 100
    const cons = driver.attributes.consistencia / 100

    const driverFactor = 0.6 + (hab * 0.15 + exp * 0.1 + ref * 0.1 + cons * 0.05) * 0.4
    lapTime /= driverFactor

    const carFactor = 1 - (state.car.engineTier * 0.02 + state.car.chassisTier * 0.015)
    lapTime *= carFactor

    const noise = 1 + (Math.random() - 0.5) * 0.01
    lapTime *= noise

    return Math.round(lapTime * 100) / 100
  }

  function renderTestResults(driverIdx) {
    const container = document.getElementById(`test-d${driverIdx}-results`)
    const tandas = state.testTandas[driverIdx]
    if (tandas.length === 0) {
      container.innerHTML = '<p class="test-pending">Selecciona un circuito y pulsa "INICIAR TANDA".</p>'
      return
    }

    container.innerHTML = tandas.map(t => {
      const lapsStr = t.laps.map(l => `${l.toFixed(2)}s`).join(' · ')
      const precision = state.drivers[driverIdx - 1].level >= 4 ? '100%' : '±0.3s'
      return `<div class="test-tanda">
        <strong>Tanda ${t.n}:</strong> ${lapsStr}
        <br>∅ <span class="tanda-avg">${t.avg.toFixed(2)}s</span>
        · ★ <span class="tanda-best">${t.best.toFixed(2)}s</span>
        <span class="tanda-precision"> [precisión: ${precision}]</span>
      </div>`
    }).join('')

    container.scrollTop = container.scrollHeight
  }

  function updateTestButtons() {
    for (let i = 0; i < 2; i++) {
      const di = i + 1
      const used = state.testTandasUsed[di]
      const btn = document.getElementById(`test-d${di}-btn`)
      const countSpan = document.querySelector(`#test-d${di} .tandas-count`)
      btn.disabled = used >= 5 || !state.selectedCircuit
      btn.textContent = used >= 5 ? 'TANDAS AGOTADAS' : `INICIAR TANDA (5 vtas) [${5 - used} rest]`
      countSpan.textContent = `Tandas: ${used}/5`
    }
  }

  document.getElementById('test-d1-btn').addEventListener('click', () => runTestTanda(0))
  document.getElementById('test-d2-btn').addEventListener('click', () => runTestTanda(1))

  const prepSetupIds = ['prep-d1-alar', 'prep-d1-ratio', 'prep-d1-altura', 'prep-d2-alar', 'prep-d2-ratio', 'prep-d2-altura']
  prepSetupIds.forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      const di = id[5]
      const used = state.testTandasUsed[di]
      if (used > 0) {
        const btn = document.getElementById(`test-d${di}-btn`)
        btn.disabled = false
        btn.textContent = `INICIAR TANDA (5 vtas) [${5 - used} rest]`
      }
    })
  })

  document.getElementById('prep-start-fuel').addEventListener('input', (e) => {
    document.getElementById('prep-start-fuel-value').textContent = e.target.value
  })

  document.getElementById('prep-start-race-btn').addEventListener('click', () => {
    document.getElementById('preparatoria-screen').style.display = 'none'
    document.getElementById('race-screen').style.display = 'flex'

    const startTyre = document.getElementById('prep-start-tyre').value
    const startFuel = Number(document.getElementById('prep-start-fuel').value)

    state.drivers[0].selectedTyre = startTyre
    state.drivers[0].fuel = startFuel
    state.drivers[0].targetFuel = startFuel
    state.drivers[1].selectedTyre = startTyre
    state.drivers[1].fuel = startFuel
    state.drivers[1].targetFuel = startFuel

    const allDrivers = [
      ...state.drivers.slice(0, 2),
      ...createAIDrivers(),
    ]

    allDrivers.forEach(d => {
      if (!d.progress) d.progress = 0
      if (!d.lapsCompleted) d.lapsCompleted = 0
      if (!d.lapsOnTyre) d.lapsOnTyre = 0
      if (!d.tyreWear) d.tyreWear = 0
      if (!d.stress) d.stress = 15 + Math.random() * 15
      if (!d.fatigue) d.fatigue = 5 + Math.random() * 10
    })

    state.drivers = allDrivers

    const canvas = document.getElementById('track-canvas')
    track = new Track(canvas)

    bindUI()
    renderCarDiagrams()
    renderStatus()
    raceActive = true
    startGameLoop()
  })
}

function showPrepDriverInfo() {
  for (let i = 0; i < 2; i++) {
    const di = i + 1
    const d = state.drivers[i]
    document.querySelector(`#setup-d${di} .setup-level`).textContent = `(N${d.level})`
  }
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
    const color = d.isPlayer ? '#00aaff' : (TEAM_COLORS[d.team] || '#ff6644')
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>P${i + 1}</td>
      <td><span class="team-dot" style="background:${color}"></span> ${d.name}</td>
      <td>${d.lapsCompleted}</td>
      <td>${TYRE_CONFIG[d.selectedTyre]?.label || '-'}</td>
      <td>-</td>
    `
    tbody.appendChild(tr)
  })
}

document.getElementById('back-to-menu-btn').addEventListener('click', () => {
  document.getElementById('results-screen').style.display = 'none'
  document.getElementById('race-screen').style.display = 'none'
  document.getElementById('preparatoria-screen').style.display = 'none'
  document.getElementById('title-screen').style.display = 'flex'
  state.currentLap = 1
  state.phase = 'economica'
  state.budget = BUDGET
  state.car = { engineTier: 2, engineSlider: 0, chassisTier: 2, chassisSlider: 0 }
  state.selectedCircuit = null
  state.factorySetup = null
  state.testTandas = { 1: [], 2: [] }
  state.testTandasUsed = { 1: 0, 2: 0 }
  state.drivers = createPlayerDrivers()
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

    const color = d.isPlayer ? '#00aaff' : (TEAM_COLORS[d.team] || '#ff6644')
    const row = document.createElement('div')
    row.className = 'timing-row'
    row.innerHTML = `
      <span class="pos">P${pos}</span>
      <span class="driver-name"><span class="team-dot" style="background:${color}"></span> ${d.name}</span>
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
