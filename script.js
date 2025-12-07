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

// API keys imported from config.js
const OMDB_API_KEY = CONFIG.OMDB_API_KEY;
const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;

// Get elements
const searchInput = document.getElementById('searchbar');
const searchBtn = document.getElementById('search-btn');
const resultsDiv = document.getElementById('results');
const watchlistBtn = document.getElementById('watchlist-btn');
const watchlistDropdown = document.getElementById('watchlist-dropdown');
const watchlistItems = document.getElementById('watchlist-items');
const recommendedDiv = document.getElementById('recommended-results');
const optimizerSection = document.getElementById('watchlist-optimizer');
const optimizerList = document.getElementById('optimizer-list');
const availableTimeInput = document.getElementById('available-time');
const optimizeBtn = document.getElementById('optimize-btn');
const timeInfo = document.getElementById('time-info');

let searchHistory = [];
let draggedElement = null;

// Function to get movie suggestions from Gemini AI
async function getMovieSuggestionsFromAI(query) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a movie recommendation expert. Based on this user input: "${query}", suggest exactly 8 popular movie titles that match this mood, feeling, situation, theme, actor, or description. Output ONLY the movie titles separated by commas. No numbering, no explanations, just: Movie1, Movie2, Movie3, etc.`
          }]
        }]
      })
    });
    
    const data = await response.json();
    console.log('Gemini response:', data);
    
    // Check for API errors
    if (data.error) {
      console.error('Gemini API error:', data.error);
      throw new Error(`API Error: ${data.error.message || 'Unknown error'}`);
    }
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      let suggestions = data.candidates[0].content.parts[0].text.trim();
      
      // Clean up the response - remove numbers, dots, extra spaces
      suggestions = suggestions.replace(/\d+\.\s*/g, '').replace(/\n/g, ',');
      
      const movieList = suggestions.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      if (movieList.length > 0) {
        console.log('AI suggested movies:', movieList);
        return movieList;
      }
    }
    
    throw new Error('AI did not return valid movie suggestions');
    
  } catch (error) {
    console.error('Gemini AI error:', error);
    throw error;
  }
}

// Main search function
async function searchMovies() {
  const query = searchInput.value.trim();
  
  if (!query) {
    resultsDiv.innerHTML = '<p class="text-gray-400 col-span-full text-center">Please enter a movie name, mood, or description</p>';
    return;
  }
  
  try {
    resultsDiv.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-10">
        <div class="banter-loader">
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
        </div>
        <p class="text-purple-300 mt-20 text-lg">Finding perfect movies for your mood...</p>
      </div>
    `;

    const movieTitles = await getMovieSuggestionsFromAI(query);
    searchHistory.push(...movieTitles);
    
    resultsDiv.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-10">
        <div class="banter-loader">
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
          <div class="banter-loader__box"></div>
        </div>
        <p class="text-purple-300 mt-20 text-lg">Fetching movie details...</p>
      </div>
    `;
    
    // Get detailed info for each movie
    const movieDetails = [];
    for (let title of movieTitles.slice(0, 8)) {
      try {
        const response = await fetch(`http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`);
        const data = await response.json();
        if (data.Response === 'True') {
          movieDetails.push(data);
        }
      } catch (error) {
        console.error('OMDB error for', title, error);
      }
    }
    
    if (movieDetails.length > 0) {
      displayResults(movieDetails);
      loadRecommended();
    } else {
      resultsDiv.innerHTML = '<p class="text-gray-400 col-span-full text-center">No movies found from AI suggestions</p>';
    }
  } catch (error) {
    console.error('Search error:', error);
    resultsDiv.innerHTML = `<p class="text-red-400 col-span-full text-center">Error: ${error.message}<br><small class="text-gray-400">Check browser console (F12) for details</small></p>`;
  }
}

// Display movie cards with detailed info
function displayResults(movies) {
  resultsDiv.innerHTML = '';
  
  // Sort movies by ROI (Return On Investment - higher rating with lower runtime is better)
  const sortedMovies = movies.sort((a, b) => {
    const ratingA = parseFloat(a.imdbRating) || 0;
    const ratingB = parseFloat(b.imdbRating) || 0;
    const runtimeA = parseInt(a.Runtime) || 120;
    const runtimeB = parseInt(b.Runtime) || 120;
    
    const roiA = runtimeA > 0 ? ratingA / (runtimeA / 100) : 0;
    const roiB = runtimeB > 0 ? ratingB / (runtimeB / 100) : 0;
    
    return roiB - roiA;
  });
  
  sortedMovies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20 hover:scale-105 transition duration-300';
    
    const poster = movie.Poster !== 'N/A' ? movie.Poster : 'assets/no-poster.png';
    const rating = movie.imdbRating !== 'N/A' ? movie.imdbRating : '—';
    const genre = movie.Genre !== 'N/A' ? movie.Genre : '';
    const runtime = movie.Runtime !== 'N/A' ? movie.Runtime : '';
    const plot = movie.Plot !== 'N/A' ? movie.Plot : '';
    const director = movie.Director !== 'N/A' ? movie.Director : '';
    const actors = movie.Actors !== 'N/A' ? movie.Actors : '';
    
    card.innerHTML = `
      <img src="${poster}" alt="${movie.Title}" class="w-full h-80 object-cover rounded-lg mb-3">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-purple-200">${movie.Title}</h3>
        <span class="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded text-yellow-300 text-sm font-bold">
          ⭐ ${rating}
        </span>
      </div>
      <p class="text-xs text-gray-400 mb-2">${movie.Year} • ${runtime}</p>
      <p class="text-xs text-purple-300 mb-2">${genre}</p>
      <p class="text-xs text-gray-400 mb-2 line-clamp-2">${plot}</p>
      <p class="text-xs text-gray-500 mb-1"><strong>Director:</strong> ${director}</p>
      <p class="text-xs text-gray-500 mb-3"><strong>Cast:</strong> ${actors}</p>
      <button class="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition watchlist-btn">Add to Watchlist</button>
    `;
    const btn = card.querySelector('.watchlist-btn');
    btn.addEventListener('click', () => {
      const added = addToWatchlist(movie.imdbID, movie.Title, poster, movie.Year, runtime, rating);
      if (added) {
        btn.textContent = 'Added to Watchlist';
        btn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
        btn.classList.add('bg-green-600', 'hover:bg-green-700');
      }
    });
    
    resultsDiv.appendChild(card);
  });
}

// Watchlist functions
function getWatchlist() {
  return JSON.parse(localStorage.getItem('watchlist') || '[]');
}

function addToWatchlist(id, title, poster, year, runtime, rating) {
  let watchlist = getWatchlist();
  
  if (!watchlist.find(m => m.id === id)) {
    watchlist.push({ id, title, poster, year, runtime, rating });
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    updateWatchlistUI();
    updateOptimizerUI();
    return true;
  }
  return false;
}

function removeFromWatchlist(id) {
  let watchlist = getWatchlist();
  watchlist = watchlist.filter(m => m.id !== id);
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  updateWatchlistUI();
  updateOptimizerUI();
}

function updateWatchlistUI() {
  const watchlist = getWatchlist();
  
  if (watchlist.length === 0) {
    watchlistItems.innerHTML = '<p class="text-gray-400 text-sm">No items yet</p>';
    return;
  }
  
  // Calculate total runtime
  let totalMinutes = 0;
  watchlist.forEach(movie => {
    const runtime = parseInt(movie.runtime) || 0;
    totalMinutes += runtime;
  });
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  watchlistItems.innerHTML = `<p class="text-purple-300 text-sm font-semibold mb-3">Total: ${hours}h ${minutes}m (${watchlist.length} movies)</p>`;
  
  // Sort by ROI (rating/runtime) descending
  const sortedWatchlist = watchlist.sort((a, b) => {
    const ratingA = parseFloat(a.rating) || 0;
    const ratingB = parseFloat(b.rating) || 0;
    const runtimeA = parseInt(a.runtime) || 120;
    const runtimeB = parseInt(b.runtime) || 120;
    const roiA = runtimeA > 0 ? ratingA / (runtimeA / 100) : 0;
    const roiB = runtimeB > 0 ? ratingB / (runtimeB / 100) : 0;
    return roiB - roiA;
  });
  
  sortedWatchlist.forEach(movie => {
    const rating = parseFloat(movie.rating) || 0;
    
    const item = document.createElement('div');
    item.className = 'flex gap-2 bg-purple-800/50 p-2 rounded-lg';
    item.innerHTML = `
      <img src="${movie.poster}" class="w-12 h-16 object-cover rounded">
      <div class="flex-1">
        <p class="text-sm font-semibold text-purple-100">${movie.title}</p>
        <p class="text-xs text-gray-400">${movie.year} • ⭐${rating}</p>
      </div>
      <button onclick="removeFromWatchlist('${movie.id}')" class="text-red-400 hover:text-red-300 text-xl">×</button>
    `;
    watchlistItems.appendChild(item);
  });
}

// Watchlist Optimizer Functions
function updateOptimizerUI() {
  const watchlist = getWatchlist();
  
  if (watchlist.length === 0) {
    optimizerSection.classList.add('hidden');
    return;
  }
  
  optimizerSection.classList.remove('hidden');
  renderOptimizerList(watchlist);
}

function renderOptimizerList(movies, availableMinutes = null) {
  optimizerList.innerHTML = '';
  
  let totalMinutes = 0;
  const sortedMovies = [...movies];
  
  sortedMovies.forEach((movie, index) => {
    const runtimeMatch = String(movie.runtime).match(/\d+/);
    const runtime = runtimeMatch ? parseInt(runtimeMatch[0]) : 120;
    const rating = parseFloat(movie.rating) || 0;
    
    totalMinutes += runtime;
    const willDrop = availableMinutes !== null && totalMinutes > availableMinutes;
    
    const item = document.createElement('div');
    item.className = `optimizer-item flex items-center gap-3 bg-purple-800/50 p-3 rounded-lg border-2 ${willDrop ? 'border-red-500/50 opacity-60' : 'border-purple-500/30'} transition-all duration-300 cursor-move`;
    item.draggable = true;
    item.dataset.id = movie.id;
    
    item.innerHTML = `
      <div class="drag-handle text-purple-400 text-xl cursor-grab active:cursor-grabbing">⋮⋮</div>
      <img src="${movie.poster}" class="w-16 h-20 object-cover rounded">
      <div class="flex-1">
        <p class="text-sm font-semibold text-purple-100">${movie.title}</p>
        <p class="text-xs text-gray-400">${movie.year} • ⭐${rating}</p>
        <p class="text-xs text-purple-300 mt-1">${movie.runtime}</p>
      </div>
      ${willDrop ? '<span class="text-xs text-red-400 font-semibold">⚠️ May Drop</span>' : ''}
      <button class="remove-optimizer-btn text-red-400 hover:text-red-300 text-2xl px-2 transition">×</button>
    `;
    
    // Drag events
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    
    // Remove button with balloon animation
    const removeBtn = item.querySelector('.remove-optimizer-btn');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      createBalloonAnimation(item);
      setTimeout(() => {
        removeFromWatchlist(movie.id);
      }, 500);
    });
    
    optimizerList.appendChild(item);
  });
}

function handleDragStart(e) {
  draggedElement = e.currentTarget;
  e.currentTarget.style.opacity = '0.4';
}

function handleDragEnd(e) {
  e.currentTarget.style.opacity = '1';
  
  // Update order in localStorage
  const items = optimizerList.querySelectorAll('.optimizer-item');
  const newOrder = Array.from(items).map(item => item.dataset.id);
  
  let watchlist = getWatchlist();
  const reorderedWatchlist = newOrder.map(id => watchlist.find(m => m.id === id)).filter(Boolean);
  localStorage.setItem('watchlist', JSON.stringify(reorderedWatchlist));
  updateWatchlistUI();
}

function handleDragOver(e) {
  e.preventDefault();
  const afterElement = getDragAfterElement(optimizerList, e.clientY);
  if (afterElement == null) {
    optimizerList.appendChild(draggedElement);
  } else {
    optimizerList.insertBefore(draggedElement, afterElement);
  }
}

function handleDrop(e) {
  e.preventDefault();
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.optimizer-item:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function createBalloonAnimation(element) {
  const rect = element.getBoundingClientRect();
  
  // Create gentle smoke/dust puffs
  for (let i = 0; i < 5; i++) {
    const puff = document.createElement('div');
    const angle = (Math.PI * 2 * i) / 5;
    const distance = 30 + Math.random() * 20;
    
    puff.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      width: ${25 + Math.random() * 15}px;
      height: ${25 + Math.random() * 15}px;
      background: radial-gradient(circle, rgba(107, 114, 128, 0.5) 0%, rgba(75, 85, 99, 0.3) 50%, transparent 100%);
      border-radius: 50%;
      z-index: 9999;
      pointer-events: none;
      transform: translate(-50%, -50%);
      animation: gentlePuff 0.6s ease-out forwards;
      --tx: ${Math.cos(angle) * distance}px;
      --ty: ${Math.sin(angle) * distance - 20}px;
      --rotation: ${Math.random() * 180}deg;
    `;
    document.body.appendChild(puff);
    setTimeout(() => puff.remove(), 600);
  }
  
  // Small fade particles (like dust)
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 30;
    
    particle.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      width: 3px;
      height: 3px;
      background: rgba(156, 163, 175, 0.6);
      border-radius: 50%;
      z-index: 9999;
      pointer-events: none;
      animation: dustFade 0.5s ease-out forwards;
      --tx: ${Math.cos(angle) * speed}px;
      --ty: ${Math.sin(angle) * speed - 15}px;
    `;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
  
  element.style.animation = 'poofOut 0.4s ease-out forwards';
}

// Optimize button handler
optimizeBtn.addEventListener('click', () => {
  const hours = parseFloat(availableTimeInput.value);
  if (!hours || hours <= 0) {
    timeInfo.textContent = '⚠️ Please enter valid hours';
    timeInfo.className = 'text-sm text-red-400 mt-2';
    return;
  }
  
  const availableMinutes = hours * 60;
  const watchlist = getWatchlist();
  
  let totalMinutes = 0;
  watchlist.forEach(movie => {
    const runtimeMatch = String(movie.runtime).match(/\d+/);
    const runtime = runtimeMatch ? parseInt(runtimeMatch[0]) : 120;
    totalMinutes += runtime;
  });
  
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  
  if (totalMinutes <= availableMinutes) {
    timeInfo.textContent = `✅ Perfect! Total runtime: ${totalHours}h ${totalMins}m. You're all set!`;
    timeInfo.className = 'text-sm text-green-400 mt-2';
  } else {
    const overflow = totalMinutes - availableMinutes;
    const overflowHours = Math.floor(overflow / 60);
    const overflowMins = overflow % 60;
    timeInfo.textContent = `⚠️ Total: ${totalHours}h ${totalMins}m. You need ${overflowHours}h ${overflowMins}m more or remove some movies.`;
    timeInfo.className = 'text-sm text-yellow-400 mt-2';
  }
  
  renderOptimizerList(watchlist, availableMinutes);
});

// Load recommended movies
async function loadRecommended() {
  if (searchHistory.length === 0) {
    // Load trending if no search history
    try {
      const response = await fetch(`http://www.omdbapi.com/?s=avengers&apikey=${OMDB_API_KEY}`);
      const data = await response.json();
      if (data.Response === 'True') {
        displayRecommended(data.Search.slice(0, 8));
      }
    } catch (error) {
      console.error('Error loading trending:', error);
    }
  } else {
    // Use last search
    const lastSearch = searchHistory[searchHistory.length - 1];
    try {
      const response = await fetch(`http://www.omdbapi.com/?s=${lastSearch}&apikey=${OMDB_API_KEY}`);
      const data = await response.json();
      if (data.Response === 'True') {
        displayRecommended(data.Search.slice(0, 4));
      }
    } catch (error) {
      console.error('Error loading recommended:', error);
    }
  }
}

async function displayRecommended(movies) {
  recommendedDiv.innerHTML = '';
  
  // Fetch detailed info for recommended movies
  for (let movie of movies.slice(0, 4)) {
    try {
      const response = await fetch(`http://www.omdbapi.com/?i=${movie.imdbID}&apikey=${OMDB_API_KEY}`);
      const data = await response.json();
      
      if (data.Response === 'True') {
        const card = document.createElement('div');
        card.className = 'relative scale-90 duration-500 hover:scale-100 hover:[transform:rotate3d(0,0,0,0deg)] [transform:rotate3d(1,-1,1,60deg)] group border border-purple-900 border-4 overflow-hidden rounded-2xl h-72 w-full bg-purple-800 p-4 flex flex-col justify-between';
        
        const poster = data.Poster !== 'N/A' ? data.Poster : 'assets/no-poster.png';
        const rating = data.imdbRating !== 'N/A' ? data.imdbRating : '—';
        const genre = data.Genre !== 'N/A' ? data.Genre : '';
        const runtime = data.Runtime !== 'N/A' ? data.Runtime : '';
        const year = data.Year !== 'N/A' ? data.Year : '';
        
        card.innerHTML = `
          <div class="text-gray-50 z-20">
            <h3 class="font-bold text-2xl mb-1 line-clamp-2">${data.Title}</h3>
            <p class="text-xs text-purple-200">${year} • ${runtime}</p>
            <p class="text-xs text-purple-300 mt-1 line-clamp-1">${genre}</p>
          </div>
          <div class="flex flex-col gap-2 z-20">
            <span class="flex items-center gap-1 bg-yellow-500/30 px-2 py-1 rounded-lg text-yellow-300 text-sm font-bold w-fit">
              ⭐ ${rating}
            </span>
            <button class="duration-300 hover:bg-purple-900 border-2 border-purple-300 hover:text-gray-50 bg-gray-50 font-semibold text-purple-800 px-3 py-2 rounded-lg flex flex-row items-center justify-center gap-2 rec-watchlist-btn text-sm">
              Add to Watchlist
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
              </svg>
            </button>
          </div>
          <img src="${poster}" alt="${data.Title}" class="group-hover:scale-125 group-hover:opacity-90 duration-500 absolute top-0 left-0 w-full h-full object-cover opacity-15 z-0">
          <div class="absolute inset-0 bg-gradient-to-t from-purple-900 via-purple-900/50 to-transparent group-hover:from-purple-900/80 group-hover:via-purple-900/30 duration-500 z-10"></div>
        `;
        const recBtn = card.querySelector('.rec-watchlist-btn');
        recBtn.addEventListener('click', () => {
          const added = addToWatchlist(data.imdbID, data.Title, poster, data.Year, runtime, rating);
          if (added) {
            recBtn.innerHTML = `
              Added to Watchlist
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            `;
            recBtn.classList.remove('bg-gray-50', 'text-purple-800', 'hover:bg-purple-900');
            recBtn.classList.add('bg-green-600', 'text-white', 'hover:bg-green-700', 'border-green-600');
          }
        });
        
        recommendedDiv.appendChild(card);
      }
    } catch (error) {
      console.error('Error fetching recommended movie details:', error);
    }
  }
}

// Event listeners
searchBtn.addEventListener('click', searchMovies);

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchMovies();
  }
});

// Watchlist dropdown toggle
watchlistBtn.addEventListener('click', (e) => {
  e.preventDefault();
  watchlistDropdown.classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!watchlistBtn.contains(e.target) && !watchlistDropdown.contains(e.target)) {
    watchlistDropdown.classList.add('hidden');
  }
});

// Initialize
updateWatchlistUI();
updateOptimizerUI();
loadRecommended();
