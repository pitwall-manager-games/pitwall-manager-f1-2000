const PIECE_LENGTH = 20

const CORNER_TYPES = {
  R1: { radius: 15, label: 'R1' },
  R2: { radius: 25, label: 'R2' },
  R3: { radius: 35, label: 'R3' },
  R4: { radius: 45, label: 'R4' },
}

function cornerAngle(radius) {
  return PIECE_LENGTH / radius
}

export const CIRCUIT_PROFILES = {
  alpe: {
    id: 'alpe',
    name: "Alpe d'Azur",
    type: 'Mixto',
    targetLength: 4800,
    corners: [
      { type: 'R3', dir: 'right' }, { type: 'R2', dir: 'right' },
      { type: 'R1', dir: 'left' },
      { type: 'R3', dir: 'right' }, { type: 'R4', dir: 'right' },
      { type: 'R2', dir: 'left' },
      { type: 'R4', dir: 'right' },
      { type: 'R1', dir: 'left' }, { type: 'R2', dir: 'left' },
      { type: 'R3', dir: 'right' },
      { type: 'R4', dir: 'right' }, { type: 'R2', dir: 'right' },
      { type: 'R1', dir: 'left' },
      { type: 'R3', dir: 'right' },
    ],
  },
  bosque: {
    id: 'bosque',
    name: 'Bosque de la Plata',
    type: 'Lento',
    targetLength: 4600,
    corners: [
      { type: 'R1', dir: 'right' }, { type: 'R2', dir: 'right' },
      { type: 'R1', dir: 'left' }, { type: 'R1', dir: 'left' },
      { type: 'R2', dir: 'right' },
      { type: 'R1', dir: 'right' },
      { type: 'R2', dir: 'left' }, { type: 'R1', dir: 'left' },
      { type: 'R1', dir: 'right' }, { type: 'R2', dir: 'right' },
      { type: 'R1', dir: 'left' },
      { type: 'R2', dir: 'right' }, { type: 'R2', dir: 'right' },
      { type: 'R1', dir: 'left' },
      { type: 'R1', dir: 'right' },
    ],
  },
  puerto: {
    id: 'puerto',
    name: 'Puerto Coronado',
    type: 'Velocidad',
    targetLength: 5200,
    corners: [
      { type: 'R4', dir: 'right' }, { type: 'R3', dir: 'right' },
      { type: 'R4', dir: 'left' },
      { type: 'R4', dir: 'right' }, { type: 'R4', dir: 'right' },
      { type: 'R3', dir: 'left' },
      { type: 'R3', dir: 'right' }, { type: 'R4', dir: 'right' },
      { type: 'R4', dir: 'left' },
      { type: 'R3', dir: 'right' },
      { type: 'R4', dir: 'right' }, { type: 'R4', dir: 'right' },
    ],
  },
  lago: {
    id: 'lago',
    name: 'Lago Esmeralda',
    type: 'Técnico',
    targetLength: 4600,
    corners: [
      { type: 'R2', dir: 'right' }, { type: 'R3', dir: 'right' },
      { type: 'R2', dir: 'left' }, { type: 'R1', dir: 'left' },
      { type: 'R3', dir: 'right' },
      { type: 'R1', dir: 'right' },
      { type: 'R2', dir: 'left' }, { type: 'R3', dir: 'left' },
      { type: 'R4', dir: 'right' }, { type: 'R2', dir: 'right' },
      { type: 'R3', dir: 'left' },
      { type: 'R2', dir: 'right' },
      { type: 'R1', dir: 'left' },
      { type: 'R4', dir: 'right' }, { type: 'R3', dir: 'right' },
      { type: 'R2', dir: 'left' },
      { type: 'R1', dir: 'right' },
    ],
  },
  valle: {
    id: 'valle',
    name: 'Valle del Trueno',
    type: 'Revoltoso',
    targetLength: 4500,
    corners: [
      { type: 'R1', dir: 'right' },
      { type: 'R2', dir: 'left' },
      { type: 'R1', dir: 'right' }, { type: 'R1', dir: 'right' },
      { type: 'R2', dir: 'left' }, { type: 'R2', dir: 'left' },
      { type: 'R3', dir: 'right' },
      { type: 'R1', dir: 'left' },
      { type: 'R2', dir: 'right' }, { type: 'R1', dir: 'right' },
      { type: 'R1', dir: 'left' }, { type: 'R1', dir: 'left' },
      { type: 'R3', dir: 'right' },
      { type: 'R1', dir: 'right' },
      { type: 'R2', dir: 'left' },
      { type: 'R3', dir: 'right' }, { type: 'R2', dir: 'right' },
      { type: 'R1', dir: 'left' },
    ],
  },
}

function generateCircuit(id, profile) {
  const cornerDef = profile.corners.map(c => ({
    ...c,
    angle: cornerAngle(CORNER_TYPES[c.type].radius) * (c.dir === 'right' ? 1 : -1),
    radius: CORNER_TYPES[c.type].radius,
  }))

  const baseAngle = cornerDef.reduce((sum, c) => sum + c.angle, 0)
  const reps = Math.max(1, Math.round(Math.abs((2 * Math.PI) / baseAngle)))
  const rawCorners = []
  for (let r = 0; r < reps; r++) {
    rawCorners.push(...cornerDef.map(c => ({ ...c })))
  }

  let rawAngle = rawCorners.reduce((sum, c) => sum + c.angle, 0)
  let angleDiff = 2 * Math.PI - rawAngle

  if (Math.abs(angleDiff) > 0.001 && rawCorners.length > 0) {
    const last = rawCorners[rawCorners.length - 1]
    const sign = last.dir === 'right' ? 1 : -1
    const newAngle = last.angle + angleDiff
    if (sign * newAngle > 0) {
      last.angle = newAngle
      last.radius = Math.abs(PIECE_LENGTH / newAngle)
      last.adjusted = true
      rawAngle = rawCorners.reduce((sum, c) => sum + c.angle, 0)
    }
  }

  const TRACK_PIECES = 5
  const trackLength = TRACK_PIECES * PIECE_LENGTH
  const pitLaneLength = 4 * PIECE_LENGTH
  const remainingForStraights = profile.targetLength - rawCorners.length * PIECE_LENGTH - trackLength - pitLaneLength

  const straightSegments = rawCorners.length + 1
  const baseStraightsPerSegment = Math.max(0, Math.floor(remainingForStraights / (straightSegments * PIECE_LENGTH)))
  const extraMeters = remainingForStraights - (baseStraightsPerSegment * straightSegments * PIECE_LENGTH)
  const extraStraightsNeeded = Math.floor(extraMeters / PIECE_LENGTH)

  const pieces = []

  pieces.push({ type: 'Y_salida', dir: null })
  pieces.push({ type: 'recta_parrilla', dir: null })
  pieces.push({ type: 'recta_parrilla', dir: null })
  pieces.push({ type: 'recta_parrilla', dir: null })
  pieces.push({ type: 'recta_salida', dir: null })

  for (let i = 0; i < rawCorners.length; i++) {
    for (let s = 0; s < baseStraightsPerSegment; s++) {
      pieces.push({ type: 'recta', dir: null })
    }
    if (i < extraStraightsNeeded) {
      pieces.push({ type: 'recta', dir: null })
    }
    pieces.push({
      type: rawCorners[i].type,
      dir: rawCorners[i].dir,
      radius: rawCorners[i].radius,
      adjusted: rawCorners[i].adjusted || false,
    })
  }
  for (let s = 0; s < baseStraightsPerSegment; s++) {
    pieces.push({ type: 'recta', dir: null })
  }
  if (extraStraightsNeeded >= rawCorners.length) {
    const extraAtEnd = Math.floor((extraStraightsNeeded - rawCorners.length) / 2)
    for (let s = 0; s < extraAtEnd; s++) {
      pieces.push({ type: 'recta', dir: null })
    }
  }

  pieces.push({ type: 'Y_entrada', dir: null })
  pieces.push({ type: 'recta_boxes', dir: null })
  pieces.push({ type: 'recta_boxes', dir: null })
  pieces.push({ type: 'recta_boxes', dir: null })
  pieces.push({ type: 'recta_aceleracion', dir: null })

  const result = placePieces(pieces)

  if (!result) return null

  return {
    id: profile.id,
    name: profile.name,
    type: profile.type,
    length: result.length,
    laps: Math.ceil(305000 / result.length),
    pieces: result.pieces,
    pitEntryIndex: result.pieces.findIndex(p => p.type === 'Y_entrada'),
    pitExitIndex: result.pieces.findIndex(p => p.type === 'Y_salida'),
    pitLaneEntry: result.pieces.findIndex(p => p.type === 'Y_entrada') + 1,
    pitLaneExit: result.pieces.findIndex(p => p.type === 'recta_aceleracion'),
  }
}

function placePieces(pieceTypes) {
  let x = 0, y = 0, angle = 0
  const placed = []
  let totalLength = 0

  for (const pt of pieceTypes) {
    const radius = pt.radius || 0
    const isCurve = ['R1', 'R2', 'R3', 'R4'].includes(pt.type)

    let endX = x, endY = y, endAngle = angle

    if (isCurve && pt.dir) {
      const dir = pt.dir === 'right' ? 1 : -1
      const alpha = dir * PIECE_LENGTH / radius
      const cx = x - radius * Math.sin(angle)
      const cy = y + radius * Math.cos(angle)
      endAngle = angle + alpha
      endX = cx + radius * Math.sin(endAngle)
      endY = cy - radius * Math.cos(endAngle)
    } else {
      endX = x + PIECE_LENGTH * Math.cos(angle)
      endY = y + PIECE_LENGTH * Math.sin(angle)
      endAngle = angle
    }

    placed.push({
      type: pt.type,
      dir: pt.dir || null,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      angle: Math.round(angle * 10000) / 10000,
      condition: 'dry',
    })

    x = endX
    y = endY
    angle = endAngle
    totalLength += PIECE_LENGTH
  }

  return { pieces: placed, length: totalLength }
}
export function buildAllCircuits() {
  const circuits = {}
  for (const [id, profile] of Object.entries(CIRCUIT_PROFILES)) {
    try {
      circuits[id] = generateCircuit(id, profile)
      const c = circuits[id]
      if (c) {
        console.log(`${c.name}: ${c.length}m, ${c.pieces.length}pcs, ${c.laps} laps`)
      } else {
        console.log(`${profile.name}: FAILED`)
      }
    } catch (e) {
      console.log(`${profile.name}: ERROR - ${e.message}`)
    }
  }
  return circuits
}

async function main() {
  const circuits = buildAllCircuits()
  const { writeFileSync } = await import('fs')
  const { fileURLToPath } = await import('url')
  const outPath = fileURLToPath(new URL('./circuits.js', import.meta.url))
  const output = `// Generated by circuit-generator.js — do not edit manually

export const CIRCUIT_DATA = ${JSON.stringify(circuits, null, 2)}
`
  writeFileSync(outPath, output, 'utf-8')
  console.log('\n✓ circuits.js written')
}

main()
