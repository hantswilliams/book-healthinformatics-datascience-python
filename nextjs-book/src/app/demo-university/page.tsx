"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PythonEditor from "@/components/PythonEditor";
import LogoMark from "@/components/LogoMark";
import { motion } from "framer-motion";

/*
  Stripe-inspired principles implemented here:
  - Dark, high-contrast base with subtle borders (#FFFFFF1A) and layered "aurora" gradients
  - Compact, information-dense hero; succinct headline + supporting subcopy
  - Sticky, translucent navbar; pill CTAs
  - Code example tabs with animated active background (single moving element)
  - Simple logo marquee and value grid with minimal iconography
  - Tight vertical rhythm; generous max-w for readability
*/

const examples = [
  {
    id: "basic",
    title: "Assignment: Text analyzer",
    blurb: "Week 3 assignment: build a simple text processing tool.",
    file: "text_analyzer.py", 
    code: `# CS 101 - Assignment 3: Text Analysis Tool
# Student: Sarah Chen | Due: Oct 15, 2024

def analyze_text(text):
    """
    Analyze a piece of text and return statistics.
    This assignment teaches string methods, loops, and basic algorithms.
    """
    # Convert to lowercase for case-insensitive analysis
    text = text.lower()
    
    # Remove punctuation and split into words
    import string
    translator = str.maketrans('', '', string.punctuation)
    clean_text = text.translate(translator)
    words = clean_text.split()
    
    # Count characters, words, and sentences
    char_count = len(text)
    word_count = len(words)
    sentence_count = text.count('.') + text.count('!') + text.count('?')
    
    # Find most common word
    word_freq = {}
    for word in words:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    most_common = max(word_freq, key=word_freq.get) if word_freq else ""
    
    # Calculate reading metrics
    avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
    
    return {
        'characters': char_count,
        'words': word_count,
        'sentences': sentence_count,
        'most_common_word': most_common,
        'avg_word_length': round(avg_word_length, 1)
    }

# Test the function
sample_text = """
Python is a powerful programming language. It's used for web development,
data science, and artificial intelligence. Python is beginner-friendly!
"""

result = analyze_text(sample_text)
print("📊 TEXT ANALYSIS RESULTS:")
print(f"Characters: {result['characters']}")
print(f"Words: {result['words']}")
print(f"Sentences: {result['sentences']}")
print(f"Most common word: '{result['most_common_word']}'")
print(f"Average word length: {result['avg_word_length']} letters")

# Bonus: Reading difficulty estimate
if result['avg_word_length'] < 4:
    difficulty = "Easy"
elif result['avg_word_length'] < 6:
    difficulty = "Medium"
else:
    difficulty = "Advanced"

print(f"Reading difficulty: {difficulty}")`,
  },
  {
    id: "intermediate", 
    title: "Assignment: Movie recommender",
    blurb: "Week 8 assignment: intro to machine learning with scikit-learn.",
    file: "movie_recommender.py",
    code: `# CS 101 - Assignment 8: Movie Recommendation System
# Student: Marcus Johnson | Due: Nov 12, 2024

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class MovieRecommender:
    """
    A simple movie recommendation system using machine learning.
    Demonstrates: data processing, feature extraction, similarity metrics, and ML concepts.
    """
    
    def __init__(self):
        self.movies_data = []
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.similarity_matrix = None
        self.create_sample_data()
    
    def create_sample_data(self):
        """Create sample movie dataset for demonstration."""
        self.movies_data = [
            {"id": 0, "title": "The Matrix", "genre": "action sci-fi thriller", "description": "A computer programmer discovers reality is a simulation"},
            {"id": 1, "title": "Inception", "genre": "action sci-fi thriller", "description": "Dream thieves plant ideas in people's minds"},
            {"id": 2, "title": "The Shawshank Redemption", "genre": "drama", "description": "Two imprisoned men bond over years finding solace and redemption"},
            {"id": 3, "title": "Pulp Fiction", "genre": "crime drama", "description": "Interconnected stories of crime and redemption in Los Angeles"},
            {"id": 4, "title": "The Dark Knight", "genre": "action crime drama", "description": "Batman faces the Joker in a battle for Gotham's soul"},
            {"id": 5, "title": "Forrest Gump", "genre": "drama comedy", "description": "Man with low IQ accomplishes great things and influences historical events"},
            {"id": 6, "title": "Interstellar", "genre": "sci-fi drama", "description": "Farmers journey through wormhole to save humanity from dying Earth"},
            {"id": 7, "title": "The Godfather", "genre": "crime drama", "description": "Aging patriarch transfers control of crime empire to reluctant son"},
            {"id": 8, "title": "Avengers: Endgame", "genre": "action adventure sci-fi", "description": "Superheroes assemble to defeat Thanos and restore the universe"},
            {"id": 9, "title": "Titanic", "genre": "romance drama", "description": "Star-crossed lovers meet aboard the doomed ocean liner"}
        ]
        
        print(f"🎬 Loaded {len(self.movies_data)} movies into recommendation system")
    
    def build_recommendation_model(self):
        """Build the ML model using TF-IDF and cosine similarity."""
        print("\\n🤖 Building machine learning recommendation model...")
        
        # Combine genre and description for feature extraction
        movie_features = []
        for movie in self.movies_data:
            combined_features = f"{movie['genre']} {movie['description']}"
            movie_features.append(combined_features)
        
        # Create TF-IDF matrix (converts text to numerical features)
        tfidf_matrix = self.vectorizer.fit_transform(movie_features)
        print(f"✅ Created feature matrix: {tfidf_matrix.shape[0]} movies × {tfidf_matrix.shape[1]} features")
        
        # Calculate similarity between all movies using cosine similarity
        self.similarity_matrix = cosine_similarity(tfidf_matrix)
        print("✅ Calculated similarity scores between all movie pairs")
        
        return self.similarity_matrix
    
    def get_recommendations(self, movie_title, num_recommendations=3):
        """Get movie recommendations based on a given movie."""
        # Find the movie ID
        movie_id = None
        for movie in self.movies_data:
            if movie['title'].lower() == movie_title.lower():
                movie_id = movie['id']
                break
        
        if movie_id is None:
            return f"❌ Movie '{movie_title}' not found in database"
        
        # Get similarity scores for this movie with all others
        movie_similarities = self.similarity_matrix[movie_id]
        
        # Create list of (movie_index, similarity_score) pairs
        similar_movies = []
        for i, score in enumerate(movie_similarities):
            if i != movie_id:  # Don't recommend the same movie
                similar_movies.append((i, score))
        
        # Sort by similarity score (highest first)
        similar_movies.sort(key=lambda x: x[1], reverse=True)
        
        # Get top recommendations
        recommendations = []
        for i in range(min(num_recommendations, len(similar_movies))):
            movie_idx, similarity_score = similar_movies[i]
            movie = self.movies_data[movie_idx]
            recommendations.append({
                'title': movie['title'],
                'genre': movie['genre'],
                'similarity': round(similarity_score, 3),
                'description': movie['description']
            })
        
        return recommendations
    
    def display_recommendations(self, movie_title):
        """Display formatted recommendations for a movie."""
        print(f"\\n🎯 RECOMMENDATIONS FOR: '{movie_title}'")
        print("=" * 60)
        
        recommendations = self.get_recommendations(movie_title)
        
        if isinstance(recommendations, str):  # Error message
            print(recommendations)
            return
        
        for i, rec in enumerate(recommendations, 1):
            print(f"\\n{i}. {rec['title']}")
            print(f"   Genre: {rec['genre']}")
            print(f"   Similarity: {rec['similarity']} (0=different, 1=identical)")
            print(f"   Plot: {rec['description']}")
        
        print(f"\\n💡 How it works:")
        print("   • Converts movie descriptions to numerical features (TF-IDF)")
        print("   • Calculates similarity using cosine similarity algorithm")
        print("   • Recommends movies with highest similarity scores")

# Create and test the recommendation system
print("🚀 MOVIE RECOMMENDATION SYSTEM")
print("=" * 50)

recommender = MovieRecommender()

# Build the machine learning model
similarity_scores = recommender.build_recommendation_model()

# Test recommendations for different movies
test_movies = ["The Matrix", "Forrest Gump", "The Dark Knight"]

for movie in test_movies:
    recommender.display_recommendations(movie)

# Show some interesting ML insights
print("\\n📊 MACHINE LEARNING INSIGHTS:")
print("-" * 40)
print(f"Feature vocabulary size: {len(recommender.vectorizer.vocabulary_)} unique words")
print(f"Most similar movie pair: {np.max(similarity_scores[similarity_scores < 1]):.3f}")
print(f"Least similar movie pair: {np.min(similarity_scores):.3f}")

print("\\n🎓 CONCEPTS LEARNED:")
print("• Text preprocessing and feature extraction")
print("• TF-IDF (Term Frequency-Inverse Document Frequency)")
print("• Cosine similarity for measuring text similarity")
print("• Content-based recommendation algorithms")
print("• Working with scikit-learn machine learning library")`,
  },
  {
    id: "advanced",
    title: "Assignment: Data visualizer",
    blurb: "Final project: create interactive data analysis with libraries.",
    file: "data_visualizer.py",
    code: `# CS 101 - Final Project: Weather Data Analyzer
# Student: Emma Rodriguez | Due: Dec 10, 2024

import random
from datetime import datetime, timedelta

class WeatherAnalyzer:
    """
    Final project demonstrating: file I/O, data structures, algorithms,
    statistical analysis, and basic data visualization concepts.
    """
    
    def __init__(self):
        self.weather_data = []
        self.generate_sample_data()
    
    def generate_sample_data(self):
        """Generate sample weather data for the analysis."""
        print("🌤️  Generating sample weather data...")
        
        # Generate 30 days of weather data
        start_date = datetime.now() - timedelta(days=30)
        
        for i in range(30):
            date = start_date + timedelta(days=i)
            
            # Simulate realistic weather patterns
            base_temp = 70 + random.randint(-15, 15)  # Base around 70°F
            humidity = random.randint(30, 90)
            rainfall = random.choice([0, 0, 0, 0.1, 0.3, 0.8, 1.2])  # Mostly dry days
            
            self.weather_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'temperature': base_temp,
                'humidity': humidity,
                'rainfall': rainfall
            })
        
        print(f"✅ Generated {len(self.weather_data)} days of weather data")
    
    def calculate_statistics(self):
        """Calculate comprehensive weather statistics."""
        temps = [day['temperature'] for day in self.weather_data]
        humidity = [day['humidity'] for day in self.weather_data]
        rainfall = [day['rainfall'] for day in self.weather_data]
        
        stats = {
            'temperature': {
                'avg': round(sum(temps) / len(temps), 1),
                'min': min(temps),
                'max': max(temps),
                'range': max(temps) - min(temps)
            },
            'humidity': {
                'avg': round(sum(humidity) / len(humidity), 1),
                'min': min(humidity),
                'max': max(humidity)
            },
            'rainfall': {
                'total': round(sum(rainfall), 2),
                'avg': round(sum(rainfall) / len(rainfall), 2),
                'rainy_days': sum(1 for r in rainfall if r > 0)
            }
        }
        
        return stats
    
    def find_weather_patterns(self):
        """Identify interesting weather patterns."""
        patterns = []
        
        # Find consecutive hot days (temp > 80)
        hot_streak = 0
        max_hot_streak = 0
        
        for day in self.weather_data:
            if day['temperature'] > 80:
                hot_streak += 1
                max_hot_streak = max(max_hot_streak, hot_streak)
            else:
                hot_streak = 0
        
        patterns.append(f"Longest hot streak: {max_hot_streak} days")
        
        # Find wettest day
        wettest = max(self.weather_data, key=lambda x: x['rainfall'])
        patterns.append(f"Wettest day: {wettest['date']} ({wettest['rainfall']}\")")
        
        return patterns
    
    def create_simple_chart(self, data_type='temperature'):
        """Create a simple ASCII chart of the data."""
        if data_type == 'temperature':
            values = [day['temperature'] for day in self.weather_data[-14:]]  # Last 14 days
            title = "🌡️  TEMPERATURE TREND (Last 14 Days)"
        elif data_type == 'rainfall':
            values = [day['rainfall'] for day in self.weather_data[-14:]]
            title = "🌧️  RAINFALL CHART (Last 14 Days)"
        else:
            return "Invalid data type"
        
        print(f"\\n{title}")
        print("-" * 50)
        
        # Normalize values for ASCII chart (scale to 0-20)
        if max(values) > 0:
            normalized = [int((v / max(values)) * 20) for v in values]
        else:
            normalized = [0] * len(values)
        
        # Create chart
        for i in range(20, -1, -1):
            line = f"{i:2d} |"
            for val in normalized:
                if val >= i:
                    line += "██"
                else:
                    line += "  "
            print(line)
        
        # X-axis labels
        print("   +" + "-" * (len(values) * 2))
        dates = [self.weather_data[-(14-i)]['date'][-5:] for i in range(min(14, len(values)))]
        x_labels = "    " + "".join(f"{date[:5]:>4}" for date in dates)
        print(x_labels)
    
    def generate_report(self):
        """Generate comprehensive weather analysis report."""
        print("\\n" + "="*60)
        print("📊 WEATHER DATA ANALYSIS REPORT")
        print("="*60)
        
        # Statistics
        stats = self.calculate_statistics()
        
        print("\\n🌡️  TEMPERATURE ANALYSIS:")
        temp_stats = stats['temperature']
        print(f"  Average: {temp_stats['avg']}°F")
        print(f"  Range: {temp_stats['min']}°F to {temp_stats['max']}°F")
        print(f"  Temperature variation: {temp_stats['range']}°F")
        
        print("\\n💧 HUMIDITY ANALYSIS:")
        hum_stats = stats['humidity']
        print(f"  Average: {hum_stats['avg']}%")
        print(f"  Range: {hum_stats['min']}% to {hum_stats['max']}%")
        
        print("\\n🌧️  RAINFALL ANALYSIS:")
        rain_stats = stats['rainfall']
        print(f"  Total rainfall: {rain_stats['total']}\"")
        print(f"  Average daily: {rain_stats['avg']}\"")
        print(f"  Rainy days: {rain_stats['rainy_days']}/30")
        
        # Patterns
        print("\\n🔍 WEATHER PATTERNS:")
        patterns = self.find_weather_patterns()
        for pattern in patterns:
            print(f"  • {pattern}")
        
        # Charts
        self.create_simple_chart('temperature')
        
        print("\\n✅ Analysis complete! This project demonstrates:")
        print("   • Data structure design and manipulation")
        print("   • Statistical calculations and analysis")
        print("   • Pattern recognition algorithms")
        print("   • Data visualization techniques")
        print("   • Object-oriented programming principles")

# Run the weather analysis
analyzer = WeatherAnalyzer()
analyzer.generate_report()`,
  },
];

export default function LandingV3() {
  const [tab, setTab] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return; const id = setInterval(() => setTab((t) => (t + 1) % examples.length), 7000);
    return () => clearInterval(id);
  }, [auto]);

  const active = examples[tab];

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white">
      {/* Layered aurora background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(93,100,255,0.35),transparent)] blur-2xl" />
        <div className="absolute top-1/3 -right-24 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(0,212,255,0.35),transparent)] blur-2xl" />
        <div className="absolute bottom-0 left-1/4 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(255,0,153,0.25),transparent)] blur-2xl" />
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.08]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0B0E]/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-6 w-6 text-white" variant="brackets" />
            <span className="text-sm font-semibold tracking-tight text-white/90">Interactive Python LMS</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex text-sm text-white/70">
            <Link href="#features" className="hover:text-white">Features</Link>
            <Link href="#examples" className="hover:text-white">Examples</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/90 hover:bg-white/5">Sign in</Link>
            <Link href="/register/organization" className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black hover:bg-white/90">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Colorful Stripe-like gradient background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_0%_0%,#60a5fa_0%,transparent_60%),radial-gradient(120%_80%_at_100%_0%,#a78bfa_0%,transparent_60%),radial-gradient(120%_80%_at_50%_100%,#fb7185_0%,transparent_60%)] opacity-90" />
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            {/* Left copy */}
            <div>
              <div className="mb-4 w-fit rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-semibold text-black/70 shadow-sm backdrop-blur">Purpose-Built for Computer Science Education</div>
              <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
                <span className="block">Modern LMS for</span>
                <span className="block">python education</span>
                <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">at university scale</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-black/70">
                Purpose-built for department chairs and program directors. Reduce faculty grading time by 80%, improve learning outcomes, and manage hundreds of students with confidence.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Link href="/register/organization" className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white hover:bg-black/90">Get started</Link>
                <Link href="/contact" className="rounded-full border border-black/10 bg-white/70 px-6 py-2 text-sm font-semibold text-black hover:bg-white/90 backdrop-blur">Contact sales</Link>
              </div>
            </div>

            {/* Right stacked product preview */}
            <div className="relative">
              {/* Back card (analytics) */}
              <div className="absolute -right-6 -top-6 hidden w-[340px] rotate-2 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-2xl backdrop-blur md:block">
                <div className="text-sm font-semibold text-black">Today</div>
                <div className="mt-2 h-28 w-full">
                  {/* simple mini-chart */}
                  <svg viewBox="0 0 300 100" className="h-full w-full">
                    <polyline fill="none" stroke="currentColor" strokeWidth="3" className="text-indigo-600" points="0,80 40,75 80,78 120,60 160,65 200,40 240,45 280,30" />
                  </svg>
                </div>
                <div className="mt-2 text-xs text-black/70">Net volume from enrollments <span className="text-emerald-600 font-semibold">+32.8%</span></div>
              </div>

              {/* Front card (editor) */}
              <div className="rounded-2xl border border-black/10 bg-white/90 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                  <div className="text-sm font-semibold text-black">Abstraction 101 • Interactive exercise</div>
                  <div className="text-xs text-black/60">Python</div>
                </div>
                <div className="h-[360px]">
                  <PythonEditor initialCode={examples[0].code} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code examples */}
      <section id="examples" className="px-4">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl">
            {/* Tab bar */}
            <div className="relative flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-sm">
              {/* Moving active background */}
              <motion.div
                layout
                className="absolute inset-y-1 left-1 rounded-lg bg-white/10"
                style={{ width: `${100 / examples.length}%` , translateX: `calc(${tab} * (100% + 4px))` }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
              {examples.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => setTab(i)}
                  className={`relative z-10 flex-1 rounded-lg px-3 py-2 text-left ${i===tab?"text-white":"text-white/70 hover:text-white"}`}
                >
                  <div className="text-[11px] uppercase tracking-wider">{e.file}</div>
                  <div className="text-[13px] font-medium">{e.title}</div>
                </button>
              ))}
            </div>

            {/* Panel */}
            <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr,1fr]">
              <div className="rounded-xl border border-white/10 bg-[#0B0C11]">
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/60">
                  <div className="truncate">{active.blurb}</div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5">python</span>
                    <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5">run</span>
                  </div>
                </div>
                <div className="h-[460px] rounded-b-xl">
                  <PythonEditor initialCode={active.code} />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0B0C11] p-4">
                <h3 className="text-sm font-semibold">What this demonstrates</h3>
                <ul className="mt-2 space-y-2 text-sm text-white/70">
                  {tab===0 && (
                    <>
                      <li>• String manipulation and processing</li>
                      <li>• Functions, loops, and dictionaries</li>
                      <li>• Algorithm design fundamentals</li>
                    </>
                  )}
                  {tab===1 && (
                    <>
                      <li>• Machine learning with scikit-learn</li>
                      <li>• Text processing and feature extraction</li>
                      <li>• Recommendation system algorithms</li>
                    </>
                  )}
                  {tab===2 && (
                    <>
                      <li>• Data analysis and visualization</li>
                      <li>• Working with external libraries</li>
                      <li>• Complex project architecture</li>
                    </>
                  )}
                </ul>
                <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                  Students progress from basic programming to advanced data science concepts—all with instant feedback and automated grading.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="px-4">
        <div className="mx-auto max-w-6xl py-16 md:py-20">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {h:"Standardize across sections", p:"Ensure consistent curriculum delivery across multiple instructors and TAs with shared assignments and rubrics."},
              {h:"Reduce administrative burden", p:"Automated grading, attendance tracking, and progress reports free up faculty time for research and teaching."},
              {h:"Demonstrate program effectiveness", p:"Real-time analytics and learning outcomes data to support accreditation and funding decisions."},
            ].map((f) => (
              <div key={f.h} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">{f.h}</div>
                <p className="mt-1 text-sm text-white/70">{f.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-gradient-to-r from-white/10 to-white/5 p-8 text-center">
          <h2 className="text-2xl font-semibold">Ready to transform your Python program?</h2>
          <p className="mt-2 text-white/70">Join department chairs nationwide who've reduced grading overhead while improving student outcomes. FERPA-compliant with enterprise security.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/register/organization" className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-black hover:bg-white/90">Start pilot program</Link>
            <Link href="/contact" className="rounded-full border border-white/15 bg-white/5 px-6 py-2 text-sm font-semibold text-white hover:bg-white/10">Request demo</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 px-4 py-10 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Interactive Python LMS · Privacy · Terms
      </footer>
    </div>
  );
}
