# 🎬 Mood2Movie

**Discover movies that match your mood!** An AI-powered movie recommendation web application that understands your emotions and suggests the perfect films to watch.

## ✨ Features

- 🤖 **AI-Powered Search** - Using Google Gemini AI to interpret moods, emotions, and descriptions
- 🎯 **Smart Recommendations** - Get personalized movie suggestions based on your search history
- ⭐ **Detailed Movie Info** - View IMDb ratings, runtime, genre, plot, director, and cast
- 📋 **Watchlist Management** - Save your favorite movies with automatic ROI-based sorting
- 🎨 **Beautiful UI** - Glassmorphism design with animated background
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🔄 **3D Card Effects** - Interactive tilted cards that flatten on hover

## 🚀 Demo

Simply type how you're feeling, what situation you're in, or what kind of movie you want:
- "feeling adventurous today"
- "want something romantic"
- "need a good laugh"
- "Christopher Nolan"
- "sci-fi thriller"

The AI will understand your intent and suggest relevant movies!

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Tailwind CSS v4
- **APIs**: 
  - Google Gemini AI (gemini-2.5-flash) for mood interpretation
  - OMDB API for movie data and ratings
- **Storage**: localStorage for watchlist persistence
- **Animation**: Canvas 2D API for background effects

## 📦 Installation & Setup

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- API Keys (see below)

### Step 1: Clone the Repository
```bash
git clone https://github.com/pradeep-iitb/Mood2Movie.git
cd Mood2Movie
```

### Step 2: Get API Keys

1. **OMDB API Key** (Free)
   - Visit [http://www.omdbapi.com/apikey.aspx](http://www.omdbapi.com/apikey.aspx)
   - Sign up for a free API key
   - Check your email to activate

2. **Gemini API Key** (Free)
   - Visit [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   - Sign in with Google account
   - Create a new API key

### Step 3: Configure API Keys

1. Make the config file as `config.js`


2. Open `config.js` and add your API keys:
```javascript
const CONFIG = {
  OMDB_API_KEY: 'your_omdb_api_key_here',
  GEMINI_API_KEY: 'your_gemini_api_key_here'
};
```

### Step 4: Run the Application

Simply open `index.html` in your browser:
```bash
open index.html
# or
firefox index.html
# or double-click index.html
```

**Note:** No server required! This is a pure client-side application.

## 📂 Project Structure

```
Mood2Movie/
├── index.html          # Main HTML file
├── style.css           # Custom styles and animations
├── script.js           # Main JavaScript logic
├── config.js           # API keys (gitignored)
├── .env                # Environment variables (gitignored)
├── .gitignore          # Git ignore rules
├── README.md           # This file
└── assets/
    ├── logo.png
    ├── search-icon.png
    ├── Imperial_Script/    # Custom font
    ├── MedievalSharp/      # Custom font
    └── Neuton/             # Custom font
```

## 🎮 How to Use

1. **Search for Movies**
   - Type your mood, feeling, or movie preference in the search bar
   - Press Enter or click the search icon
   - Wait for AI to process and fetch movie details

2. **View Movie Details**
   - See IMDb ratings, year, runtime, genre
   - Read plot summaries
   - Check director and cast information

3. **Manage Watchlist**
   - Click "Add to Watchlist" on any movie
   - Access your watchlist from the navbar
   - Movies are automatically sorted by ROI (rating/runtime ratio)
   - View total runtime of your watchlist
   - Remove movies with the × button

4. **Explore Recommendations**
   - Scroll down to see recommended movies
   - Recommendations are based on your search history
   - Hover over 3D cards to reveal movie posters

## 🎨 Features Breakdown

### AI-Powered Mood Detection
The app uses Google's Gemini AI to understand natural language queries and convert them into movie titles. It can interpret:
- Emotions (happy, sad, excited, bored)
- Situations (date night, family time, alone)
- Genres (action, comedy, horror)
- Themes (space, time travel, superheroes)
- Actor/Director names

### Glassmorphism Design
Modern UI with:
- Backdrop blur effects
- Semi-transparent elements
- Gradient backgrounds
- Smooth transitions

### ROI-Based Sorting
Movies in your watchlist are sorted by **Return on Investment (ROI)**:
```
ROI = Rating / (Runtime / 100)
```
Higher ROI means better rating with shorter runtime - perfect for maximizing entertainment value!

### Animated Background
The canvas background features 50 wandering dots with:
- Smooth particle animation
- Responsive to window resizing
- Purple color theme matching the UI


## 🔒 Privacy & Security

- **API Keys**: Never commit `config.js` or `.env` to version control
- **Client-Side Only**: All processing happens in your browser
- **No User Data**: No personal information is collected or stored
- **localStorage**: Watchlist data stays on your device only


## 👨‍💻 Developer

Created by **Pradeep** - [GitHub Profile](https://github.com/pradeep-iitb)

## 🙏 Acknowledgments

- [OMDB API](http://www.omdbapi.com/) for movie data
- [Google Gemini AI](https://ai.google.dev/) for natural language processing
- [Tailwind CSS](https://tailwindcss.com/) for styling framework
- [Uiverse.io](https://uiverse.io/) for UI components inspiration

---

**⭐ If you found this project helpful, please give it a star!**

**🎬 Happy Movie Watching!**
