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
      <img src="${poster}" alt="${movie.Title}" class="w-full h-80 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-80 transition">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-purple-200 cursor-pointer hover:text-purple-400 transition">${movie.Title}</h3>
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
    
    // Add click to open modal
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('watchlist-btn')) {
        showMovieDetails(movie);
      }
    });
    const btn = card.querySelector('.watchlist-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const added = addToWatchlist(movie.imdbID, movie.Title, poster, movie.Year, runtime, rating);
      if (added) {
        btn.textContent = 'Added to Watchlist';
        btn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
        btn.classList.add('bg-green-600', 'hover:bg-green-700');
      }
    });resultsDiv.appendChild(card);
  });
}

// Movie Details Modal
function showMovieDetails(movie) {
  const poster = movie.Poster !== 'N/A' ? movie.Poster : 'assets/no-poster.png';
  const rating = movie.imdbRating !== 'N/A' ? movie.imdbRating : '—';
  const genre = movie.Genre !== 'N/A' ? movie.Genre : '';
  const runtime = movie.Runtime !== 'N/A' ? movie.Runtime : '';
  const plot = movie.Plot !== 'N/A' ? movie.Plot : 'No plot available';
  const director = movie.Director !== 'N/A' ? movie.Director : 'Unknown';
  const actors = movie.Actors !== 'N/A' ? movie.Actors : 'Unknown';
  const writer = movie.Writer !== 'N/A' ? movie.Writer : 'Unknown';
  const awards = movie.Awards !== 'N/A' ? movie.Awards : 'None';
  const language = movie.Language !== 'N/A' ? movie.Language : 'Unknown';
  const country = movie.Country !== 'N/A' ? movie.Country : 'Unknown';
  const boxOffice = movie.BoxOffice !== 'N/A' ? movie.BoxOffice : 'N/A';
  const metascore = movie.Metascore !== 'N/A' ? movie.Metascore : '—';
  
  modalContent.innerHTML = `
    <div class="flex flex-col md:flex-row gap-6">
      <div class="md:w-1/3">
        <img src="${poster}" alt="${movie.Title}" class="w-full rounded-xl shadow-2xl border-2 border-purple-500/30">
      </div>
      <div class="md:w-2/3 space-y-4">
        <div>
          <h2 class="font-[heading] text-3xl md:text-4xl font-bold text-purple-300 mb-2">${movie.Title}</h2>
          <p class="text-gray-400 text-sm">${movie.Year} • ${runtime} • ${movie.Rated || 'Not Rated'}</p>
        </div>
        
        <div class="flex gap-4 items-center flex-wrap">
          <div class="bg-yellow-500/20 px-4 py-2 rounded-lg">
            <p class="text-yellow-300 font-bold text-lg">⭐ ${rating}</p>
            <p class="text-xs text-gray-400">IMDb Rating</p>
          </div>
          <div class="bg-purple-500/20 px-4 py-2 rounded-lg">
            <p class="text-purple-300 font-bold text-lg">${metascore}</p>
            <p class="text-xs text-gray-400">Metascore</p>
          </div>
        </div>
        
        <div>
          <p class="text-purple-400 text-sm font-semibold mb-1">Genre</p>
          <p class="text-gray-300">${genre}</p>
        </div>
        
        <div>
          <p class="text-purple-400 text-sm font-semibold mb-1">Plot</p>
          <p class="text-gray-300 leading-relaxed">${plot}</p>
        </div>
        
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <p class="text-purple-400 text-sm font-semibold mb-1">Director</p>
            <p class="text-gray-300">${director}</p>
          </div>
          <div>
            <p class="text-purple-400 text-sm font-semibold mb-1">Writer</p>
            <p class="text-gray-300">${writer}</p>
          </div>
        </div>
        
        <div>
          <p class="text-purple-400 text-sm font-semibold mb-1">Cast</p>
          <p class="text-gray-300">${actors}</p>
        </div>
        
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <p class="text-purple-400 text-sm font-semibold mb-1">Language</p>
            <p class="text-gray-300">${language}</p>
          </div>
          <div>
            <p class="text-purple-400 text-sm font-semibold mb-1">Country</p>
            <p class="text-gray-300">${country}</p>
          </div>
        </div>
        
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <p class="text-purple-400 text-sm font-semibold mb-1">Awards</p>
            <p class="text-gray-300">${awards}</p>
          </div>
          <div>
            <p class="text-purple-400 text-sm font-semibold mb-1">Box Office</p>
            <p class="text-gray-300">${boxOffice}</p>
          </div>
        </div>
        
        <button class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition font-semibold text-lg modal-watchlist-btn">
          Add to Watchlist
        </button>
      </div>
    </div>
  `;
  


  const modalBtn = modalContent.querySelector('.modal-watchlist-btn');
  modalBtn.addEventListener('click', () => {
    const added = addToWatchlist(movie.imdbID, movie.Title, poster, movie.Year, runtime, rating);
    if (added) {
      modalBtn.textContent = 'Added to Watchlist ✓';
      modalBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
      modalBtn.classList.add('bg-green-600', 'hover:bg-green-700');
    }
  });
  
  movieModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

async function displayRecommended(movies) {
  recommendedDiv.innerHTML = '';
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
            <h3 class="font-[text] font-bold text-2xl mb-1 line-clamp-2">${data.Title}</h3>
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
searchBtn.addEventListener('click', searchMovies);

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchMovies();
  }
});