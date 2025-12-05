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

// API key from env
const API_KEY = 'cd5a5e47';

// Get search elements
const searchInput = document.getElementById('searchbar');
const searchBtn = document.getElementById('search-btn');
const resultsDiv = document.getElementById('results');

// Function to search movies
function searchMovies() {
  const query = searchInput.value.trim();
  
  if (!query) {
    resultsDiv.innerHTML = '<p class="text-gray-400 col-span-full text-center">Please enter a movie name</p>';
    return;
  }
  
  resultsDiv.innerHTML = '<p class="text-gray-400 col-span-full text-center">Searching...</p>';
  
  // Make API request
  fetch(`http://www.omdbapi.com/?s=${query}&apikey=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.Response === 'True') {
        displayResults(data.Search.slice(0, 8));
      } else {
        resultsDiv.innerHTML = '<p class="text-gray-400 col-span-full text-center">No movies found</p>';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      resultsDiv.innerHTML = '<p class="text-red-400 col-span-full text-center">Something went wrong</p>';
    });
}

// Function to display movie cards
function displayResults(movies) {
  resultsDiv.innerHTML = '';
  
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20 hover:scale-105 transition duration-300';
    
    const poster = movie.Poster !== 'N/A' ? movie.Poster : 'assets/no-poster.png';
    
    card.innerHTML = `
      <img src="${poster}" alt="${movie.Title}" class="w-full h-80 object-cover rounded-lg mb-3">
      <h3 class="text-lg font-semibold text-purple-200 mb-1">${movie.Title}</h3>
      <p class="text-sm text-gray-400">${movie.Year}</p>
      <p class="text-xs text-gray-500 mt-1">${movie.Type}</p>
    `;
    
    resultsDiv.appendChild(card);
  });
}

// Event listeners for search
searchBtn.addEventListener('click', searchMovies);

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchMovies();
  }
});
