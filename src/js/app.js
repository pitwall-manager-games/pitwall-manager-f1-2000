import { Track } from './track.js';
import { CIRCUIT_DATA } from './circuits.js';
import {
  calcFuelConsumption, calcPitStopTime,
  TYRE_CONFIG, FUEL_CAPACITY, BUDGET,
  DRIVER_LEVELS, ENGINE_TIERS, CHASSIS_TIERS,
  generateDriverAttributes,
  AI_PERSONALITY_CONFIG, pickWeighted,
  computeFactorySetup, SETUP_SCORE,
  getTyreWearMultipliers,
} from './physics.js';

const PIECE_LENGTH = 20
const CORNER_RADII = { R1: 15, R2: 25, R3: 35, R4: 45 }
const TICKS_PER_LAP_TARGET = 250
const BASE_WEAR_PER_TICK = 0.03

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
    tyreWearFL: 0,
    tyreWearFR: 0,
    tyreWearRL: 0,
    tyreWearRR: 0,
    fuel: 65,
    targetFuel: 65,
    stress: 10 + Math.random() * 20,
    fatigue: 5 + Math.random() * 10,
    engineTemp: 90,
    pitRequested: false,
    selectedTyre: 'medium',
        lapsOnTyre: 0,
    lapsCompleted: 0,
    pieceIndex: 0,
    pieceMeters: 0,
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
    { id: 1, name: 'JUG-1', team: 'jug', pace: 'normal', engine: 'normal', tyreWearFL: 0, tyreWearFR: 0, tyreWearRL: 0, tyreWearRR: 0, fuel: 65, targetFuel: 65, stress: 20, fatigue: 10, engineTemp: 90, pitRequested: false, selectedTyre: 'medium', lapsOnTyre: 0, lapsCompleted: 0, pieceIndex: 0, pieceMeters: 0, isPlayer: true, level: 3, attributes: generateDriverAttributes(3), personality: { agresividad: 5, lealtad: 5, confianza: 50 }, car: null },
    { id: 2, name: 'JUG-2', team: 'jug', pace: 'normal', engine: 'normal', tyreWearFL: 0, tyreWearFR: 0, tyreWearRL: 0, tyreWearRR: 0, fuel: 65, targetFuel: 65, stress: 10, fatigue: 5, engineTemp: 90, pitRequested: false, selectedTyre: 'medium', lapsOnTyre: 0, lapsCompleted: 0, pieceIndex: 0, pieceMeters: 0, isPlayer: true, level: 3, attributes: generateDriverAttributes(3), personality: { agresividad: 5, lealtad: 5, confianza: 50 }, car: null },
  ]
}

const state = {
  mode: 'classic',
  currentLap: 1,
  totalLaps: 60,
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
  circuitData: null,
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

    const circuitData = CIRCUIT_DATA[state.selectedCircuit]
    if (!circuitData) return
    state.circuitData = circuitData
    state.totalLaps = circuitData.laps

    allDrivers.forEach(d => {
      if (d.pieceIndex === undefined) d.pieceIndex = 0
      if (d.pieceMeters === undefined) d.pieceMeters = 0
      if (!d.lapsCompleted) d.lapsCompleted = 0
      if (!d.lapsOnTyre) d.lapsOnTyre = 0
      if (!d.tyreWearFL && d.tyreWearFL !== 0) { d.tyreWearFL = 0; d.tyreWearFR = 0; d.tyreWearRL = 0; d.tyreWearRR = 0 }
      if (!d.engineTemp) d.engineTemp = 90
      if (!d.stress) d.stress = 15 + Math.random() * 15
      if (!d.fatigue) d.fatigue = 5 + Math.random() * 10
    })

    state.drivers = allDrivers

    track = new Track('track-canvas', circuitData)

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

    const progressMeters = getProgressGain(driver, weather)
    driver.pieceMeters += progressMeters

    updateEngineTemp(driver)
    applyTyreWear(driver, weather)

    const circuit = state.circuitData
    const numPieces = circuit ? circuit.pieces.length : 1
    while (driver.pieceMeters >= PIECE_LENGTH) {
      driver.pieceMeters -= PIECE_LENGTH
      driver.pieceIndex++
      if (driver.pieceIndex >= numPieces) {
        driver.pieceIndex = 0
        driver.lapsCompleted++
        completeLap(driver)
      }
      if (driver.pitRequested && circuit && circuit.pieces[driver.pieceIndex]) {
        if (circuit.pieces[driver.pieceIndex].type === 'recta_boxes') {
          executePitStop(driver)
        }
      }
    }
  });

  state.currentLap = Math.max(...state.drivers.map(d => d.lapsCompleted)) + 1

  if (state.currentLap > (state.totalLaps || 60)) {
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
    const tyrePct = Math.max(d.tyreWearFL, d.tyreWearFR, d.tyreWearRL, d.tyreWearRR) / 100
    const lapsRemaining = (state.totalLaps || 60) - (d.lapsCompleted || 0)
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
  state.circuitData = null
  state.totalLaps = 60
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
  const circuit = state.circuitData
  const baseMetersPerTick = circuit ? circuit.length / TICKS_PER_LAP_TARGET : PIECE_LENGTH

  const baseSpeed = {
    attack: 1.2,
    normal: 1.0,
    defend: 0.9,
    conserve: 0.7,
  }

  const engineBoost = {
    high: 1.15,
    normal: 1.0,
    low: 0.85,
  }

  const pace = baseSpeed[driver.pace] || 1.0
  const engine = engineBoost[driver.engine] || 1.0
  const tyreSpeed = TYRE_CONFIG[driver.selectedTyre]?.speed || 1.0

  const tyreAdherence = calcAvgTyreAdherence(driver)

  const fuelFactor = 1 - (driver.fuel / FUEL_CAPACITY) * 0.08
  const stressFactor = 1 - (driver.stress / 100) * 0.15
  const fatigueFactor = 1 - (driver.fatigue / 100) * 0.1

  let weatherFactor = 1.0
  if (weather === 'rain') {
    weatherFactor = ['wet', 'inter'].includes(driver.selectedTyre) ? 0.92 : 0.55
  } else if (['wet', 'inter'].includes(driver.selectedTyre)) {
    weatherFactor = 0.85
  }

  let pieceFactor = 1.0
  if (circuit && circuit.pieces[driver.pieceIndex]) {
    const piece = circuit.pieces[driver.pieceIndex]
    if (['R1', 'R2', 'R3', 'R4'].includes(piece.type)) {
      const radius = CORNER_RADII[piece.type]
      pieceFactor = Math.min(1.0, 0.3 + (radius / 45) * 0.7)
    }
    if ((piece.type === 'Y_entrada' || piece.type === 'recta_boxes' || piece.type === 'recta_aceleracion') && driver.pitRequested) {
      pieceFactor = Math.min(pieceFactor, 0.25)
    }
  }

  return baseMetersPerTick * pace * engine * tyreSpeed * tyreAdherence * fuelFactor * stressFactor * fatigueFactor * weatherFactor * pieceFactor
}

function completeLap(driver) {
  driver.lapsOnTyre += 1;

  const fuelConsumed = calcFuelConsumption(driver.engine, 1);
  driver.fuel = Math.max(0, driver.fuel - fuelConsumed);

  updateDriverState(driver);
}

function executePitStop(driver) {
  const fuelToAdd = Math.max(0, driver.targetFuel - driver.fuel)

  driver.tyreWearFL = 0
  driver.tyreWearFR = 0
  driver.tyreWearRL = 0
  driver.tyreWearRR = 0
  driver.lapsOnTyre = 0
  driver.fuel = driver.targetFuel
  driver.pitRequested = false

  const baseMetersPerTick = state.circuitData ? state.circuitData.length / TICKS_PER_LAP_TARGET : PIECE_LENGTH
  const metersLost = calcPitStopTime(fuelToAdd) * baseMetersPerTick * 10
  driver.pieceMeters = Math.max(0, driver.pieceMeters - metersLost)
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

function updateEngineTemp(driver) {
  const dirtyAir = detectDirtyAir(driver)

  if (driver.pace === 'attack') {
    driver.engineTemp = Math.min(150, driver.engineTemp + 2)
  } else if (driver.pace === 'conserve') {
    driver.engineTemp = Math.max(60, driver.engineTemp - 3)
  } else {
    driver.engineTemp = Math.max(60, driver.engineTemp - 1)
  }

  if (dirtyAir) {
    driver.engineTemp = Math.min(150, driver.engineTemp + 1)
  }

  if (driver.engineTemp > 120 && driver.car && driver.car.reliability) {
    driver.car.reliability.motor = Math.max(0, driver.car.reliability.motor - 0.5)
  }
}

function detectDirtyAir(driver) {
  const circuit = state.circuitData
  if (!circuit) return false
  return state.drivers.some(other => {
    if (other.id === driver.id) return false
    const myMeters = driver.pieceMeters + driver.pieceIndex * PIECE_LENGTH + driver.lapsCompleted * circuit.length
    const otherMeters = other.pieceMeters + other.pieceIndex * PIECE_LENGTH + other.lapsCompleted * circuit.length
    const diff = Math.abs(myMeters - otherMeters)
    return diff > 0 && diff < 50
  })
}

function applyTyreWear(driver, weather) {
  const circuit = state.circuitData
  if (!circuit) return

  const piece = circuit.pieces[driver.pieceIndex]
  if (!piece) return

  const mult = getTyreWearMultipliers(piece)

  const paceMult = { attack: 1.5, normal: 1.0, defend: 1.2, conserve: 0.7 }[driver.pace] || 1.0
  const wetMult = weather === 'rain' ? 1.3 : 1.0
  const ageMult = 1 + (driver.lapsOnTyre || 0) * 0.05
  const totalMult = paceMult * wetMult * ageMult

  driver.tyreWearFL = Math.min(100, driver.tyreWearFL + BASE_WEAR_PER_TICK * mult.fl * totalMult)
  driver.tyreWearFR = Math.min(100, driver.tyreWearFR + BASE_WEAR_PER_TICK * mult.fr * totalMult)
  driver.tyreWearRL = Math.min(100, driver.tyreWearRL + BASE_WEAR_PER_TICK * mult.rl * totalMult)
  driver.tyreWearRR = Math.min(100, driver.tyreWearRR + BASE_WEAR_PER_TICK * mult.rr * totalMult)
}

function renderTiming() {
  document.getElementById('current-lap').textContent = Math.min(state.currentLap, state.totalLaps || 60)
  document.getElementById('total-laps').textContent = state.totalLaps || 60

  const circuit = state.circuitData
  const len = circuit ? circuit.length : PIECE_LENGTH * 240

  const sorted = [...state.drivers].sort((a, b) => {
    const aTotal = a.lapsCompleted * len + a.pieceIndex * PIECE_LENGTH + a.pieceMeters
    const bTotal = b.lapsCompleted * len + b.pieceIndex * PIECE_LENGTH + b.pieceMeters
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
  for (let i = 0; i < 2; i++) {
    const driver = state.drivers[i]
    if (!driver) continue
    const prefix = `d${i + 1}`
    const stressBar = document.getElementById(`${prefix}-stress`)
    const stressLabel = document.getElementById(`${prefix}-stress-value`)
    const fatigueBar = document.getElementById(`${prefix}-fatigue`)
    const fatigueLabel = document.getElementById(`${prefix}-fatigue-value`)
    if (stressBar) stressBar.style.width = `${driver.stress}%`
    if (stressLabel) stressLabel.textContent = `${Math.round(driver.stress)}%`
    if (fatigueBar) fatigueBar.style.width = `${driver.fatigue}%`
    if (fatigueLabel) fatigueLabel.textContent = `${Math.round(driver.fatigue)}%`
  }
}

function renderCarSVG() {
  for (let i = 0; i < 2; i++) {
    const driver = state.drivers[i]
    if (!driver) continue
    const idx = i + 1

    const parts = [
      { id: `d${idx}-front-wing`, wear: getCarPartHealth(driver, 'frontWing') },
      { id: `d${idx}-rear-wing`, wear: getCarPartHealth(driver, 'rearWing') },
      { id: `d${idx}-engine`, wear: getCarPartHealth(driver, 'engine') },
      { id: `d${idx}-gearbox`, wear: getCarPartHealth(driver, 'gearbox') },
      { id: `d${idx}-tyre-fl`, wear: driver.tyreWearFL },
      { id: `d${idx}-tyre-fr`, wear: driver.tyreWearFR },
      { id: `d${idx}-tyre-rl`, wear: driver.tyreWearRL },
      { id: `d${idx}-tyre-rr`, wear: driver.tyreWearRR },
    ]

    parts.forEach(({ id, wear }) => {
      const el = document.getElementById(id)
      if (!el) return
      if (id.includes('tyre')) {
        el.setAttribute('fill', getTyreColor(wear))
      } else {
        el.setAttribute('fill', getPartColor(wear))
      }
    })

    const tempPct = Math.min(100, ((driver.engineTemp - 60) / 90) * 100)
    const tempBar = document.getElementById(`d${idx}-engine-temp`)
    const tempLabel = document.getElementById(`d${idx}-engine-temp-value`)
    if (tempBar && tempLabel) {
      tempBar.style.width = `${Math.max(0, tempPct)}%`
      tempLabel.textContent = `${Math.round(driver.engineTemp)}°C`

      if (driver.engineTemp > 120) {
        tempBar.style.background = 'var(--accent-red)'
      } else if (driver.engineTemp > 100) {
        tempBar.style.background = 'var(--accent-yellow)'
      } else {
        tempBar.style.background = 'var(--accent-green)'
      }
    }

    const heading = document.querySelector(`#driver${idx}-status .driver-name-heading`)
    if (heading) {
      heading.textContent = driver.name
    }
  }
}

function getCarPartHealth(driver, part) {
  if (!driver.car || !driver.car.reliability) return 100
  switch (part) {
    case 'frontWing':
    case 'rearWing':
      return driver.car.reliability.aero
    case 'engine':
      return driver.car.reliability.motor
    case 'gearbox':
      return driver.car.reliability.caja
    default:
      return 100
  }
}

function renderCarDiagrams() {
  renderCarSVG()
}

function getTyreColor(wear) {
  if (wear >= 92) {
    const t = (wear - 92) / 8
    return lerpColor('#bbbbcc', '#33ff77', 1 - t)
  }
  if (wear >= 32) return '#33ff77'
  if (wear >= 28) {
    const t = (wear - 28) / 4
    return lerpColor('#33ff77', '#ffcc00', 1 - t)
  }
  if (wear >= 12) return '#ffcc00'
  if (wear >= 8) {
    const t = (wear - 8) / 4
    return lerpColor('#ffcc00', '#ff3344', 1 - t)
  }
  return '#ff3344'
}

function getPartColor(health) {
  if (health >= 60) return 'rgba(0,170,255,0.2)'
  if (health >= 20) return '#ffcc00'
  return '#ff3344'
}

function calcAvgTyreAdherence(driver) {
  const wears = [driver.tyreWearFL, driver.tyreWearFR, driver.tyreWearRL, driver.tyreWearRR]

  const adherence = wears.map(w => {
    if (w >= 92) return 0.85 + (0.15 * (w - 92) / 8)
    if (w >= 32) return 1.0
    if (w >= 28) return 1.0 - (0.15 * (32 - w) / 4)
    if (w >= 12) return 0.85
    if (w >= 8) return 0.85 - (0.25 * (12 - w) / 4)
    return 0.6
  })

  const avg = adherence.reduce((a, b) => a + b, 0) / adherence.length
  const worst = Math.min(...adherence)
  return avg * 0.4 + worst * 0.6
}

function lerpColor(c1, c2, t) {
  const parse = c => c.match(/[\da-f]{2}/gi).map(x => parseInt(x, 16))
  const [r1, g1, b1] = parse(c1)
  const [r2, g2, b2] = parse(c2)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

function initCarTooltips() {
  const svgs = [document.getElementById('car-svg-d1'), document.getElementById('car-svg-d2')]
  const tooltip = document.getElementById('car-tooltip')

  svgs.forEach((svg, idx) => {
    if (!svg) return
    const driver = state.drivers[idx]
    if (!driver) return

    const pieceInfo = {
      'tyre-fl': { name: 'Rueda FL', getStatus: (d) => tyreStatusText(d.tyreWearFL), getEffect: (d) => tyreEffectText(d.tyreWearFL) },
      'tyre-fr': { name: 'Rueda FR', getStatus: (d) => tyreStatusText(d.tyreWearFR), getEffect: (d) => tyreEffectText(d.tyreWearFR) },
      'tyre-rl': { name: 'Rueda RL', getStatus: (d) => tyreStatusText(d.tyreWearRL), getEffect: (d) => tyreEffectText(d.tyreWearRL) },
      'tyre-rr': { name: 'Rueda RR', getStatus: (d) => tyreStatusText(d.tyreWearRR), getEffect: (d) => tyreEffectText(d.tyreWearRR) },
      'front-wing': { name: 'Alerón Delantero', getStatus: (d) => partStatusText(getCarPartHealth(d, 'frontWing')), getEffect: (d) => partEffectText('frontWing', getCarPartHealth(d, 'frontWing')) },
      'rear-wing': { name: 'Alerón Trasero', getStatus: (d) => partStatusText(getCarPartHealth(d, 'rearWing')), getEffect: (d) => partEffectText('rearWing', getCarPartHealth(d, 'rearWing')) },
      'engine': { name: 'Motor V10', getStatus: (d) => `${Math.round(d.engineTemp)}°C · ${partStatusText(getCarPartHealth(d, 'engine'))}`, getEffect: (d) => d.engineTemp > 120 ? 'Sobrecalentamiento — salud del motor cayendo' : partEffectText('engine', getCarPartHealth(d, 'engine')) },
      'gearbox': { name: 'Caja de cambios', getStatus: (d) => partStatusText(getCarPartHealth(d, 'gearbox')), getEffect: (d) => partEffectText('gearbox', getCarPartHealth(d, 'gearbox')) },
    }

    const di = idx + 1
    Object.entries(pieceInfo).forEach(([pieceIdSuffix, info]) => {
      const el = document.getElementById(`d${di}-${pieceIdSuffix}`)
      if (!el) return

      el.addEventListener('mouseenter', (e) => {
        const d = state.drivers[idx]
        if (!d) return
        tooltip.querySelector('.tooltip-name').textContent = info.name
        tooltip.querySelector('.tooltip-status').textContent = info.getStatus(d)
        tooltip.querySelector('.tooltip-effect').textContent = info.getEffect(d)
        tooltip.classList.remove('hidden')
        positionTooltip(e)
      })

      el.addEventListener('mousemove', (e) => {
        positionTooltip(e)
      })

      el.addEventListener('mouseleave', () => {
        tooltip.classList.add('hidden')
      })
    })
  })
}

function positionTooltip(e) {
  const tooltip = document.getElementById('car-tooltip')
  const x = e.clientX + 12
  const y = e.clientY + 12
  const maxX = window.innerWidth - tooltip.offsetWidth - 10
  const maxY = window.innerHeight - tooltip.offsetHeight - 10
  tooltip.style.left = `${Math.min(x, maxX)}px`
  tooltip.style.top = `${Math.min(y, maxY)}px`
}

function tyreStatusText(wear) {
  if (wear >= 92) return 'Nuevo'
  if (wear >= 32) return 'Óptimo'
  if (wear >= 12) return 'Degradado'
  return 'Crítico'
}

function tyreEffectText(wear) {
  if (wear >= 92) return 'Adherencia: 85% — neumático frío'
  if (wear >= 32) return 'Adherencia: 100% — ventana óptima'
  if (wear >= 12) return 'Adherencia: 85% — pérdida de agarre'
  if (wear >= 8) return 'Adherencia: 85%→60% — degradación severa'
  return 'Adherencia: 60% — neumático destruido'
}

function partStatusText(health) {
  if (health >= 60) return 'Bien'
  if (health >= 20) return 'Dañado'
  return 'Crítico'
}

function partEffectText(part, health) {
  if (health >= 60) return 'Funcionamiento normal'
  if (part === 'frontWing') return 'Subviraje severo — neumáticos delanteros se destruyen'
  if (part === 'rearWing') return 'Inestabilidad en curvas — riesgo de trompo'
  if (part === 'engine') return 'Pérdida de potencia'
  if (part === 'gearbox') return 'Pérdida de marchas — velocidad punta reducida'
  return ''
}

document.addEventListener('DOMContentLoaded', () => {
  init()
  initCarTooltips()
});
