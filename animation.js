// Background animation setup
const canvas = document.getElementById('bg-canvas');
const Context = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Dots array and defining their positions and velocities
const dots = [];
const dotCount = 50;
for (let i = 0; i < dotCount; i++) {
  dots.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    radius: Math.random() * 2 +1
  });
}

// Animation loop
function animate() {
  Context.clearRect(0, 0, canvas.width, canvas.height);
  dots.forEach(dot => {
    dot.x = dot.x + dot.vx;
    dot.y = dot.y + dot.vy;
    
    if (dot.x < 0) dot.x = canvas.width;
    if (dot.x > canvas.width) dot.x = 0;
    if (dot.y < 0) dot.y = canvas.height;
    if (dot.y > canvas.height) dot.y = 0;
    
    Context.fillStyle = 'rgba(133, 150, 247, 0.4)';
    Context.beginPath();
    Context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    Context.fill();
  });
  
  requestAnimationFrame(animate);
}

animate();

// Resize handler
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
