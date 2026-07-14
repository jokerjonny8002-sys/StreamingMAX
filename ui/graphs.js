function createGraph(canvasId, label) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const values = new Array(60).fill(0);

  function draw(value) {
    values.push(value);
    if (values.length > 60) values.shift();

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;

    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--primary").trim();
    ctx.lineWidth = 3;
    ctx.beginPath();

    values.forEach((point, index) => {
      const x = (index / 59) * width;
      const y = height - (point / 100) * height;

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "14px Segoe UI";
    ctx.fillText(`${label}: ${Math.round(value)}%`, 12, 22);
  }

  return { draw };
}

window.StreamingMaxGraphs = {
  createGraph
};