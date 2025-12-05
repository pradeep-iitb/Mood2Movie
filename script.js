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

// API keys
const OMDB_API_KEY = 'cd5a5e47';
const GEMINI_API_KEY = 'AIzaSyBxyUK8hidL31Nm5mcx6vjqTQfT6Kuj4Tg';

// Get elements
const searchInput = document.getElementById('searchbar');
const searchBtn = document.getElementById('search-btn');
const resultsDiv = document.getElementById('results');
const watchlistBtn = document.getElementById('watchlist-btn');
const watchlistDropdown = document.getElementById('watchlist-dropdown');
const watchlistItems = document.getElementById('watchlist-items');
const recommendedDiv = document.getElementById('recommended-results');

let searchHistory = [];

// Function to get movie suggestions from Gemini AI
async function getMovieSuggestionsFromAI(query) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      let suggestions = data.candidates[0].content.parts[0].text.trim();
      
      // Clean up the response - remove numbers, dots, extra spaces
      suggestions = suggestions.replace(/\d+\.\s*/g, '').replace(/\n/g, ',');
      
      const movieList = suggestions.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      if (movieList.length > 0) {
        return movieList;
      }
    }
    
    // Fallback: extract keywords and search
    console.log('AI returned empty, using keyword extraction');
    return extractKeywordsForSearch(query);
    
  } catch (error) {
    console.error('Gemini AI error:', error);
    return extractKeywordsForSearch(query);
  }
}

// Fallback function to extract search keywords
function extractKeywordsForSearch(query) {
  const lowerQuery = query.toLowerCase();
  
  // Emotional state to movie genre mapping
  const emotionMap = {
    'breakup': ['eternal sunshine', '500 days of summer', 'blue valentine', 'her'],
    'sad': ['schindler', 'grave of fireflies', 'manchester by the sea'],
    'heartbreak': ['eternal sunshine', 'blue valentine', 'la la land'],
    'lonely': ['her', 'lost in translation', 'moon'],
    'happy': ['paddington', 'chef', 'sound of music'],
    'excited': ['mad max', 'john wick', 'avengers'],
    'scared': ['conjuring', 'hereditary', 'quiet place'],
    'romantic': ['notebook', 'pride and prejudice', 'la la land'],
    'inspired': ['pursuit of happyness', 'shawshank', 'rocky'],
    'nostalgic': ['back to future', 'goonies', 'stand by me']
  };
  
  // Check for emotion keywords
  for (let emotion in emotionMap) {
    if (lowerQuery.includes(emotion)) {
      return emotionMap[emotion];
    }
  }
  
  // Default search with the query itself
  return [query, 'drama', 'romance'];
}

// Main search function
async function searchMovies() {
  const query = searchInput.value.trim();
  
  if (!query) {
    resultsDiv.innerHTML = '<p class="text-gray-400 col-span-full text-center">Please enter a movie name, mood, or description</p>';
    return;
  }
  
  resultsDiv.innerHTML = '<p class="text-gray-400 col-span-full text-center">Thinking...</p>';
  
  // Get AI suggestions
  const movieTitles = await getMovieSuggestionsFromAI(query);
  searchHistory.push(...movieTitles);
  
  resultsDiv.innerHTML = '<p class="text-gray-400 col-span-full text-center">Searching movies...</p>';
  
  // Search each movie in OMDB
  const allMovies = [];
  for (let title of movieTitles) {
    try {
      const response = await fetch(`http://www.omdbapi.com/?s=${title}&apikey=${OMDB_API_KEY}`);
      const data = await response.json();
      if (data.Response === 'True') {
        allMovies.push(...data.Search);
      }
    } catch (error) {
      console.error('OMDB error:', error);
    }
  }
  
  if (allMovies.length > 0) {
    const uniqueMovies = Array.from(new Map(allMovies.map(m => [m.imdbID, m])).values());
    displayResults(uniqueMovies.slice(0, 8));
    loadRecommended();
  } else {
    resultsDiv.innerHTML = '<p class="text-gray-400 col-span-full text-center">No movies found</p>';
  }
}

// Display movie cards with wishlist button
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
      <button class="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition" onclick="addToWatchlist('${movie.imdbID}', '${movie.Title.replace(/'/g, "\\'")}'', '${poster}', '${movie.Year}')">Add to Watchlist</button>
    `;
    
    resultsDiv.appendChild(card);
  });
}

// Watchlist functions
function getWatchlist() {
  return JSON.parse(localStorage.getItem('watchlist') || '[]');
}

function addToWatchlist(id, title, poster, year) {
  let watchlist = getWatchlist();
  
  if (!watchlist.find(m => m.id === id)) {
    watchlist.push({ id, title, poster, year });
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    updateWatchlistUI();
    alert('Added to watchlist!');
  } else {
    alert('Already in watchlist!');
  }
}

function removeFromWatchlist(id) {
  let watchlist = getWatchlist();
  watchlist = watchlist.filter(m => m.id !== id);
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  updateWatchlistUI();
}

function updateWatchlistUI() {
  const watchlist = getWatchlist();
  
  if (watchlist.length === 0) {
    watchlistItems.innerHTML = '<p class="text-gray-400 text-sm">No items yet</p>';
    return;
  }
  
  watchlistItems.innerHTML = '';
  watchlist.forEach(movie => {
    const item = document.createElement('div');
    item.className = 'flex gap-2 bg-purple-800/50 p-2 rounded-lg';
    item.innerHTML = `
      <img src="${movie.poster}" class="w-12 h-16 object-cover rounded">
      <div class="flex-1">
        <p class="text-sm font-semibold text-purple-100">${movie.title}</p>
        <p class="text-xs text-gray-400">${movie.year}</p>
      </div>
      <button onclick="removeFromWatchlist('${movie.id}')" class="text-red-400 hover:text-red-300 text-xl">×</button>
    `;
    watchlistItems.appendChild(item);
  });
}

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
        displayRecommended(data.Search.slice(0, 8));
      }
    } catch (error) {
      console.error('Error loading recommended:', error);
    }
  }
}

function displayRecommended(movies) {
  recommendedDiv.innerHTML = '';
  
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20 hover:scale-105 transition duration-300';
    
    const poster = movie.Poster !== 'N/A' ? movie.Poster : 'assets/no-poster.png';
    
    card.innerHTML = `
      <img src="${poster}" alt="${movie.Title}" class="w-full h-80 object-cover rounded-lg mb-3">
      <h3 class="text-lg font-semibold text-purple-200 mb-1">${movie.Title}</h3>
      <p class="text-sm text-gray-400">${movie.Year}</p>
      <button class="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition" onclick="addToWatchlist('${movie.imdbID}', '${movie.Title.replace(/'/g, "\\'")}'', '${poster}', '${movie.Year}')">Add to Watchlist</button>
    `;
    
    recommendedDiv.appendChild(card);
  });
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
loadRecommended();
