export class Track {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cars = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.draw();
  }

  setCars(cars) {
    this.cars = cars;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    this.drawTrack(ctx, w, h);
    this.drawCars(ctx, w, h);
  }

  drawTrack(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const rx = w * 0.38;
    const ry = h * 0.40;

    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + 15, ry + 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx - 15, ry - 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('META', cx + rx, cy);
  }

  drawCars(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const rx = w * 0.36;
    const ry = h * 0.38;

    const TEAM_COLORS = {
      rojo: '#ff4444',
      amarillo: '#ffdd00',
      verde: '#00ee66',
      azul: '#4499ff',
      naranja: '#ff8800',
    }

    function getTeamColor(car) {
      return car.isPlayer ? '#00aaff' : (TEAM_COLORS[car.team] || '#ff6644')
    }

    function isSecondDriver(car) {
      return car.name.endsWith('-2') || car.name === 'Piloto 2'
    }

    this.cars.forEach((car) => {
      const angle = (car.progress / 100) * Math.PI * 2 - Math.PI / 2;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      const color = getTeamColor(car)

      if (isSecondDriver(car)) {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, 4, -Math.PI / 2, Math.PI / 2)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(x, y, 4, Math.PI / 2, -Math.PI / 2)
        ctx.closePath()
        ctx.fill()
      } else {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      if (car.isPlayer) {
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.stroke()
      }
    });
  }
}
