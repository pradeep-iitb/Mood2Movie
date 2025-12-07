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
const movieModal = document.getElementById('movie-modal');
const modalContent = document.getElementById('modal-content');
const closeModal = document.getElementById('close-modal');

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


function closeMovieModal() {
  movieModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
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
    // Load trending if no search history like the Avengers
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

// Watchlist dropdown toggle
watchlistBtn.addEventListener('click', (e) => {
  e.preventDefault();
  watchlistDropdown.classList.toggle('hidden');
});

// Modal close handlers
closeModal.addEventListener('click', closeMovieModal);

movieModal.addEventListener('click', (e) => {
  if (e.target === movieModal) {
    closeMovieModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !movieModal.classList.contains('hidden')) {
    closeMovieModal();
  }
});

document.addEventListener('click', (e) => {
  if (!watchlistBtn.contains(e.target) && !watchlistDropdown.contains(e.target)) {
    watchlistDropdown.classList.add('hidden');
  }
});

// Initialize
updateWatchlistUI();
updateOptimizerUI();
loadRecommended();
