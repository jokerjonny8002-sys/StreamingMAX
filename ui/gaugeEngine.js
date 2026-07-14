class Gauge {
  constructor(id, color = "#19d8ff") {
    this.canvas = document.getElementById(id);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");
    this.color = color;
    this.value = 0;
    this.target = 0;

    this.animate();
  }

  setValue(value) {
    this.target = Math.max(0, Math.min(100, Number(value) || 0));
  }

  animate() {
    this.value += (this.target - this.value) * 0.08;

    if (Math.abs(this.target - this.value) < 0.1) {
      this.value = this.target;
    }

    this.draw();

    requestAnimationFrame(() => this.animate());
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const radius = Math.min(width, height) / 2 - 18;
    const startAngle = Math.PI * 0.75;
    const totalAngle = Math.PI * 1.5;
    const endAngle = startAngle + totalAngle * (this.value / 100);

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);

    ctx.lineCap = "round";
    ctx.lineWidth = 12;

    ctx.strokeStyle = "#1b2436";
    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle, startAngle + totalAngle);
    ctx.stroke();

    ctx.shadowBlur = 22;
    ctx.shadowColor = this.color;
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 30px Segoe UI";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(this.value)}%`, 0, 4);

    ctx.restore();
  }
}

window.Gauge = Gauge;
