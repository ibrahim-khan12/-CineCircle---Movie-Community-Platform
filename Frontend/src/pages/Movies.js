import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { movieService } from '../services';
import './Movies.css';

const Movies = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovies();
  }, [search, genre]);

  const loadMovies = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (genre) params.genre = genre;
      
      const data = await movieService.getMovies(params);
      setMovies(data.movies || []);
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="movies-page">
      <div className="container">
        <h1>Browse Movies</h1>

        <div className="filters">
          <input
            type="text"
            placeholder="Search movies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="genre-select"
          >
            <option value="">All Genres</option>
            <option value="Action">Action</option>
            <option value="Comedy">Comedy</option>
            <option value="Drama">Drama</option>
            <option value="Horror">Horror</option>
            <option value="Sci-Fi">Sci-Fi</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading movies...</div>
        ) : (
          <div className="movies-grid">
            {movies.length > 0 ? (
              movies.map(movie => (
                <div key={movie.movie_id} className="movie-card">
                  <img 
                    src={movie.poster_url || `https://via.placeholder.com/300x450/6366f1/ffffff?text=${encodeURIComponent(movie.title)}`}
                    alt={movie.title} 
                    onError={(e) => e.target.src = `https://via.placeholder.com/300x450/6366f1/ffffff?text=${encodeURIComponent(movie.title)}`}
                  />
                  <div className="movie-info">
                    <h3>{movie.title}</h3>
                    <p className="year">{movie.release_year}</p>
                    <p className="description">{movie.description?.substring(0, 100)}...</p>
                    <button 
                      className="btn-primary" 
                      onClick={() => navigate(`/movies/${movie.movie_id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results">No movies found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Movies;
