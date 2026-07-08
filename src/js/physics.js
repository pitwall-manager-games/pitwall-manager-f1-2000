export const TYRE_CONFIG = {
  soft: { label: 'Blando', color: '#ff3344', durability: { min: 15, max: 20 }, speed: 1.05 },
  medium: { label: 'Medio', color: '#ffcc00', durability: { min: 25, max: 35 }, speed: 1.00 },
  hard: { label: 'Duro', color: '#ffffff', durability: { min: 35, max: 45 }, speed: 0.96 },
  inter: { label: 'Intermedio', color: '#33ff77', durability: { min: 5, max: 8 }, speed: 0.92 },
  wet: { label: 'Lluvia', color: '#4488ff', durability: { min: 3, max: 4 }, speed: 0.88 },
}

export const FUEL_CAPACITY = 100

export const FUEL_REFERENCES = [
  { kg: 100, label: '0 paradas (60 vtas)' },
  { kg: 30, label: '2 paradas (20 vtas c/u)' },
  { kg: 22, label: '3 paradas (15 vtas c/u)' },
]

export const FUEL_BURN_RATE = {
  high: 3.5,
  normal: 2.5,
  low: 1.5,
}

export const PIT_STOP = {
  tyreChangeMin: 2.5,
  tyreChangeMax: 3.5,
  fuelRate: 9,
  fixedDelay: 2,
}

export const BUDGET = 5000000

export const DRIVER_LEVELS = [
  null,
  { cost: 500000,  attrRange: { habilidad: [20, 35], experiencia: [10, 25], mojado: [20, 40], consistencia: [15, 30], reflejos: [15, 30] } },
  { cost: 1000000, attrRange: { habilidad: [35, 50], experiencia: [25, 45], mojado: [30, 50], consistencia: [30, 50], reflejos: [25, 45] } },
  { cost: 1500000, attrRange: { habilidad: [50, 65], experiencia: [40, 60], mojado: [40, 60], consistencia: [45, 65], reflejos: [40, 60] } },
  { cost: 2000000, attrRange: { habilidad: [65, 80], experiencia: [55, 75], mojado: [50, 75], consistencia: [60, 80], reflejos: [55, 75] } },
  { cost: 2500000, attrRange: { habilidad: [80, 95], experiencia: [70, 90], mojado: [60, 90], consistencia: [75, 90], reflejos: [70, 90] } },
]

export const ENGINE_TIERS = [
  null,
  { cost: 800000,  range: 0, label: 'Económico' },
  { cost: 950000,  range: 1, label: 'Intermedio' },
  { cost: 1100000, range: 2, label: 'Premium' },
]

export const CHASSIS_TIERS = [
  null,
  { cost: 500000, range: 0, label: 'Básico' },
  { cost: 625000, range: 1, label: 'Intermedio' },
  { cost: 750000, range: 2, label: 'Premium' },
]

const ATTR_KEYS = ['habilidad', 'experiencia', 'mojado', 'consistencia', 'reflejos']

export function generateDriverAttributes(level) {
  const range = DRIVER_LEVELS[level].attrRange
  const attrs = {}
  for (const key of ATTR_KEYS) {
    const [min, max] = range[key]
    attrs[key] = Math.floor(Math.random() * (max - min + 1)) + min
  }
  return attrs
}

export function resolveComponentLevels(tier, sliderOffset) {
  if (tier === 1) return [1, 1]
  if (tier === 2) {
    const combos = [[1, 3], [2, 2], [3, 1]]
    const idx = Math.max(0, Math.min(2, sliderOffset + 1))
    return combos[idx]
  }
  if (tier === 3) {
    const combos = [[1, 5], [2, 4], [3, 3], [4, 2], [5, 1]]
    const idx = Math.max(0, Math.min(4, sliderOffset + 2))
    return combos[idx]
  }
  return [1, 1]
}

export const CIRCUITS = [
  { id: 'alpe',  name: 'Alpe d\'Azur',        type: 'Mixto',     default: { alar: 'media', ratio: 'medio', altura: 'media' } },
  { id: 'bosque', name: 'Bosque de la Plata', type: 'Lento',     default: { alar: 'alta',  ratio: 'corto', altura: 'baja' } },
  { id: 'puerto', name: 'Puerto Coronado',    type: 'Velocidad', default: { alar: 'baja',  ratio: 'largo', altura: 'baja' } },
  { id: 'lago',   name: 'Lago Esmeralda',     type: 'Técnico',   default: { alar: 'alta',  ratio: 'corto', altura: 'media' } },
  { id: 'valle',  name: 'Valle del Trueno',   type: 'Revoltoso', default: { alar: 'media', ratio: 'medio', altura: 'alta' } },
]

export const SETUP_VALUES = { alar: ['baja', 'media', 'alta'], ratio: ['corto', 'medio', 'largo'], altura: ['baja', 'media', 'alta'] }

export const SETUP_SCORE = {
  alpe: {
    baja: { alar: 1.02, ratio: 1.01, altura: 0.99 },
    media: { alar: 1.00, ratio: 1.00, altura: 1.00 },
    alta: { alar: 0.99, ratio: 1.00, altura: 1.02 },
  },
  bosque: {
    baja: { alar: 1.03, ratio: 1.02, altura: 1.01 },
    media: { alar: 1.01, ratio: 1.00, altura: 1.00 },
    alta: { alar: 0.98, ratio: 0.99, altura: 0.99 },
  },
  puerto: {
    baja: { alar: 0.97, ratio: 0.98, altura: 0.99 },
    media: { alar: 1.00, ratio: 1.00, altura: 1.00 },
    alta: { alar: 1.04, ratio: 1.01, altura: 1.02 },
  },
  lago: {
    baja: { alar: 1.03, ratio: 1.02, altura: 1.01 },
    media: { alar: 1.00, ratio: 1.00, altura: 1.00 },
    alta: { alar: 0.98, ratio: 0.99, altura: 0.99 },
  },
  valle: {
    baja: { alar: 1.02, ratio: 1.01, altura: 0.98 },
    media: { alar: 1.00, ratio: 1.00, altura: 1.00 },
    alta: { alar: 0.99, ratio: 1.00, altura: 1.01 },
  },
}

export function computeFactorySetup(circuitId) {
  const baseScore = SETUP_SCORE[circuitId]
  if (!baseScore) return { alar: 'media', ratio: 'medio', altura: 'media' }

  let bestSetup = null
  let bestTime = Infinity

  const params = ['alar', 'ratio', 'altura']

  function trial(values) {
    let lapTime = 85
    for (const p of params) {
      lapTime *= baseScore[values[p]][p]
    }
    const noise = 1 + (Math.random() - 0.5) * 0.002
    lapTime *= noise
    return lapTime
  }

  for (const a of SETUP_VALUES.alar) {
    for (const r of SETUP_VALUES.ratio) {
      for (const h of SETUP_VALUES.altura) {
        const setup = { alar: a, ratio: r, altura: h }
        let total = 0
        const samples = 5
        for (let s = 0; s < samples; s++) {
          total += trial(setup)
        }
        const avg = total / samples
        if (avg < bestTime) {
          bestTime = avg
          bestSetup = setup
        }
      }
    }
  }

  return bestSetup
}

export function calcPitStopTime(fuelKg) {
  const tyreTime = PIT_STOP.tyreChangeMin + Math.random() * (PIT_STOP.tyreChangeMax - PIT_STOP.tyreChangeMin)
  const fuelTime = fuelKg / PIT_STOP.fuelRate
  return Math.max(tyreTime, fuelTime) + PIT_STOP.fixedDelay
}

export function calcTyreWear(pace, lapsOnTyre, isWet) {
  const baseWear = {
    attack: 12,
    normal: 8,
    defend: 10,
    conserve: 5,
  }

  let wear = baseWear[pace] || 8
  if (isWet) wear *= 1.3
  return wear * lapsOnTyre
}

export function calcFuelConsumption(engineMode, laps) {
  return (FUEL_BURN_RATE[engineMode] || 2.5) * laps
}

export const AI_PERSONALITY_CONFIG = {
  agresiva: {
    label: 'Agresiva',
    driverLevelBias: { 5: 0.4, 4: 0.3, 3: 0.2, 2: 0.1, 1: 0 },
    engineTierBias: { 3: 0.5, 2: 0.3, 1: 0.2 },
    chassisTierBias: { 3: 0.2, 2: 0.3, 1: 0.5 },
    agresividad: [8, 10],
    lealtad: [1, 5],
  },
  conservadora: {
    label: 'Conservadora',
    driverLevelBias: { 5: 0.1, 4: 0.2, 3: 0.3, 2: 0.3, 1: 0.1 },
    engineTierBias: { 3: 0.2, 2: 0.4, 1: 0.4 },
    chassisTierBias: { 3: 0.3, 2: 0.4, 1: 0.3 },
    agresividad: [1, 4],
    lealtad: [6, 10],
  },
  equilibrada: {
    label: 'Equilibrada',
    driverLevelBias: { 5: 0.2, 4: 0.25, 3: 0.3, 2: 0.2, 1: 0.05 },
    engineTierBias: { 3: 0.3, 2: 0.4, 1: 0.3 },
    chassisTierBias: { 3: 0.3, 2: 0.4, 1: 0.3 },
    agresividad: [4, 7],
    lealtad: [4, 7],
  },
}

export function pickWeighted(biasMap) {
  const keys = Object.keys(biasMap).map(Number)
  const weights = keys.map(k => biasMap[k])
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < keys.length; i++) {
    r -= weights[i]
    if (r <= 0) return keys[i]
  }
  return keys[keys.length - 1]
}
