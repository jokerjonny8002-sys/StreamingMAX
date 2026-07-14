function createBackground() {

    const canvas = document.createElement("canvas");

    canvas.id = "bgCanvas";

    document.body.prepend(canvas);

    const ctx = canvas.getContext("2d");

    let w;
    let h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    resize();

    window.addEventListener("resize", resize);

    const stars = [];

    for (let i = 0; i < 30; i++){
        stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 2 + 1,
            dx: (Math.random() - 0.5) * 0.25,
            dy: (Math.random() - 0.5) * 0.25
        });
    }

    function animate() {

        ctx.clearRect(0,0,w,h);

        stars.forEach(s=>{

            s.x += s.dx;
            s.y += s.dy;

            if(s.x<0)s.x=w;
            if(s.x>w)s.x=0;
            if(s.y<0)s.y=h;
            if(s.y>h)s.y=0;

            ctx.beginPath();
            ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
            ctx.fillStyle="rgba(49,201,255,.35)";
            ctx.fill();

        });

        setTimeout(() => requestAnimationFrame(animate), 33);

    }

    animate();

}

window.createStreamingBackground=createBackground;