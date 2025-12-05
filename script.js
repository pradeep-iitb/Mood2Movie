// Canvas setup
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

// Resize canvas to full screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Dots array
const dots = [];
const dotCount = 30;

// Create dots with random positions and velocities
for (let i = 0; i < dotCount; i++) {
  dots.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    radius: Math.random() * 2 + 1
  });
}

// Animation loop
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update and draw each dot
  dots.forEach(dot => {
    dot.x += dot.vx;
    dot.y += dot.vy;
    
    // Wrap around screen edges
    if (dot.x < 0) dot.x = canvas.width;
    if (dot.x > canvas.width) dot.x = 0;
    if (dot.y < 0) dot.y = canvas.height;
    if (dot.y > canvas.height) dot.y = 0;
    
    // Draw dot
    ctx.fillStyle = 'rgba(133, 150, 247, 0.4)';
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  
  requestAnimationFrame(animate);
}

animate();

// Resize handler
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

