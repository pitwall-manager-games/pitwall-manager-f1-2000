const PIECE_LENGTH = 20
const TRACK_WIDTH = 10
const CAR_RADIUS = 4

const CORNER_RADII = { R1: 15, R2: 25, R3: 35, R4: 45 }

const CIRCUIT_COLORS = {
  track: '#1a1a2e',
  border: '#2a2a3e',
  dry: '#2a2a3e',
  damp: '#1a2838',
  wet: '#182038',
}

const TEAM_COLORS = {
  rojo: '#ff4444',
  amarillo: '#ffdd00',
  verde: '#00ee66',
  azul: '#4499ff',
  naranja: '#ff8800',
}

export class Track {
  constructor(containerId, circuitData) {
    this.container = document.getElementById(containerId)
    this.circuit = circuitData
    this.cars = []
    this.svg = null
    this.trackPathEl = null
    this.borderPathEl = null
    this.carsGroup = null
    this.metaLineEl = null

    this.build()
  }

  build() {
    const pieces = this.circuit.pieces
    const pitPieces = pieces.filter(p => p.type === 'Y_entrada' || p.type === 'recta_boxes' || p.type === 'recta_aceleracion')

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of pieces) {
      const pts = this.getPieceBBox(p)
      for (const [bx, by] of pts) {
        minX = Math.min(minX, bx)
        maxX = Math.max(maxX, bx)
        minY = Math.min(minY, by)
        maxY = Math.max(maxY, by)
      }
    }

    const pad = 20
    minX -= pad
    minY -= pad
    maxX += pad
    maxY += pad
    const vw = maxX - minX
    const vh = maxY - minY

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', `${minX} ${minY} ${vw} ${vh}`)
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.display = 'block'
    this.container.innerHTML = ''
    this.container.appendChild(svg)
    this.svg = svg

    this.scale = { minX, minY, vw, vh }

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    svg.appendChild(defs)

    const trackPath = this.buildTrackPath(pieces)
    const pitPath = this.buildTrackPath(pitPieces)

    this.borderPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    this.borderPathEl.setAttribute('d', trackPath)
    this.borderPathEl.setAttribute('fill', 'none')
    this.borderPathEl.setAttribute('stroke', CIRCUIT_COLORS.border)
    this.borderPathEl.setAttribute('stroke-width', String(TRACK_WIDTH + 0.8))
    this.borderPathEl.setAttribute('stroke-linecap', 'round')
    this.borderPathEl.setAttribute('stroke-linejoin', 'round')
    svg.appendChild(this.borderPathEl)

    this.trackPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    this.trackPathEl.setAttribute('d', trackPath)
    this.trackPathEl.setAttribute('fill', 'none')
    this.trackPathEl.setAttribute('stroke', CIRCUIT_COLORS.dry)
    this.trackPathEl.setAttribute('stroke-width', String(TRACK_WIDTH))
    this.trackPathEl.setAttribute('stroke-linecap', 'round')
    this.trackPathEl.setAttribute('stroke-linejoin', 'round')
    svg.appendChild(this.trackPathEl)

    if (pitPath) {
      const pitTrack = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      pitTrack.setAttribute('d', pitPath)
      pitTrack.setAttribute('fill', 'none')
      pitTrack.setAttribute('stroke', '#3a3a5e')
      pitTrack.setAttribute('stroke-width', String(TRACK_WIDTH * 0.6))
      pitTrack.setAttribute('stroke-linecap', 'round')
      pitTrack.setAttribute('stroke-linejoin', 'round')
      pitTrack.setAttribute('stroke-dasharray', '3,2')
      svg.appendChild(pitTrack)
    }

    this.metaLineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    this.metaLineEl.setAttribute('stroke', '#ffffff')
    this.metaLineEl.setAttribute('stroke-width', '0.5')
    this.metaLineEl.setAttribute('stroke-dasharray', '1,1')
    svg.appendChild(this.metaLineEl)
    this.updateMetaLine()

    this.carsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    svg.appendChild(this.carsGroup)
  }

  buildTrackPath(pieces) {
    if (!pieces || pieces.length === 0) return ''

    const commands = []
    const first = pieces[0]
    commands.push(`M ${first.x} ${first.y}`)

    for (let i = 0; i < pieces.length; i++) {
      const cur = pieces[i]
      const next = pieces[(i + 1) % pieces.length]

      if (['R1', 'R2', 'R3', 'R4'].includes(cur.type) && cur.dir) {
        const R = CORNER_RADII[cur.type]
        const sweepFlag = cur.dir === 'right' ? 1 : 0
        commands.push(`A ${R} ${R} 0 0 ${sweepFlag} ${next.x} ${next.y}`)
      } else {
        commands.push(`L ${next.x} ${next.y}`)
      }
    }

    return commands.join(' ')
  }

  updateMetaLine() {
    if (!this.metaLineEl) return
    const rectaSalida = this.circuit.pieces.find(p => p.type === 'recta_salida')
    if (!rectaSalida) return

    const perpX = Math.cos(rectaSalida.angle + Math.PI / 2)
    const perpY = Math.sin(rectaSalida.angle + Math.PI / 2)

    this.metaLineEl.setAttribute('x1', String(rectaSalida.x + 5 * perpX))
    this.metaLineEl.setAttribute('y1', String(rectaSalida.y + 5 * perpY))
    this.metaLineEl.setAttribute('x2', String(rectaSalida.x - 5 * perpX))
    this.metaLineEl.setAttribute('y2', String(rectaSalida.y - 5 * perpY))
  }

  getPieceBBox(p) {
    const halfW = TRACK_WIDTH / 2
    const perpX = Math.cos(p.angle + Math.PI / 2)
    const perpY = Math.sin(p.angle + Math.PI / 2)
    const dirX = Math.cos(p.angle)
    const dirY = Math.sin(p.angle)

    const corners = []
    if (['R1', 'R2', 'R3', 'R4'].includes(p.type) && p.dir) {
      const R = CORNER_RADII[p.type]
      const dir = p.dir === 'right' ? 1 : -1
      const alpha = PIECE_LENGTH / R
      const cx = p.x - R * dir * Math.sin(p.angle)
      const cy = p.y + R * dir * Math.cos(p.angle)
      const steps = 4
      for (let s = 0; s <= steps; s++) {
        const a = p.angle + dir * (s / steps) * alpha
        corners.push([cx + (R + halfW) * Math.cos(a - Math.PI / 2), cy + (R + halfW) * Math.sin(a - Math.PI / 2)])
        corners.push([cx + (R - halfW) * Math.cos(a - Math.PI / 2), cy + (R - halfW) * Math.sin(a - Math.PI / 2)])
      }
    } else {
      const endX = p.x + PIECE_LENGTH * dirX
      const endY = p.y + PIECE_LENGTH * dirY
      corners.push(
        [p.x + halfW * perpX, p.y + halfW * perpY],
        [p.x - halfW * perpX, p.y - halfW * perpY],
        [endX - halfW * perpX, endY - halfW * perpY],
        [endX + halfW * perpX, endY + halfW * perpY],
      )
    }
    return corners
  }

  getCarPosition(pieceIndex, pieceMeters) {
    const pieces = this.circuit.pieces
    if (!pieces || pieces.length === 0) return { x: 0, y: 0 }

    const idx = pieceIndex % pieces.length
    const cur = pieces[idx]
    const next = pieces[(idx + 1) % pieces.length]
    const t = Math.max(0, Math.min(1, pieceMeters / PIECE_LENGTH))

    if (['R1', 'R2', 'R3', 'R4'].includes(cur.type) && cur.dir) {
      const R = CORNER_RADII[cur.type]
      const dir = cur.dir === 'right' ? 1 : -1
      const alpha = pieceMeters / R
      const cx = cur.x - R * dir * Math.sin(cur.angle)
      const cy = cur.y + R * dir * Math.cos(cur.angle)
      const carAngle = cur.angle + dir * alpha
      return {
        x: cx + R * Math.cos(carAngle - Math.PI / 2),
        y: cy + R * Math.sin(carAngle - Math.PI / 2),
        angle: carAngle,
      }
    }

    return {
      x: cur.x + (next.x - cur.x) * t,
      y: cur.y + (next.y - cur.y) * t,
      angle: cur.angle,
    }
  }

  setCars(cars) {
    this.cars = Array.isArray(cars) ? cars : []
    this.render()
  }

  setCircuitData(circuitData) {
    this.circuit = circuitData
    this.build()
  }

  render() {
    if (!this.carsGroup) return
    this.carsGroup.innerHTML = ''

    this.cars.forEach((car) => {
      const pieceIdx = car.pieceIndex || 0
      const pieceM = car.pieceMeters || 0
      const pos = this.getCarPosition(pieceIdx, pieceM)

      const color = car.isPlayer ? '#00aaff' : (TEAM_COLORS[car.team] || '#ff6644')
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', String(pos.x))
      circle.setAttribute('cy', String(pos.y))
      circle.setAttribute('r', String(CAR_RADIUS))
      circle.setAttribute('fill', color)
      this.carsGroup.appendChild(circle)

      if (car.isPlayer) {
        const hl = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        hl.setAttribute('cx', String(pos.x))
        hl.setAttribute('cy', String(pos.y))
        hl.setAttribute('r', String(CAR_RADIUS + 1.5))
        hl.setAttribute('fill', 'none')
        hl.setAttribute('stroke', color)
        hl.setAttribute('stroke-width', '0.5')
        this.carsGroup.appendChild(hl)
      }
    })
  }
}
