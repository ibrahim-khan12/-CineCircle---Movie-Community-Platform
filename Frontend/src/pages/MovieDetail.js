import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieService, watchlistService, reviewService } from '../services';
import { useAuth } from '../context/AuthContext';
import './MovieDetail.css';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    loadMovieDetails();
  }, [id]);

  const loadMovieDetails = async () => {
    try {
      const data = await movieService.getMovie(id);
      setMovie(data.movie);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error loading movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async () => {
    try {
      await watchlistService.addToWatchlist(id);
      setInWatchlist(true);
      alert('Added to watchlist!');
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      alert('Failed to add to watchlist');
    }
  };

  if (loading) {
    return <div className="loading">Loading movie details...</div>;
  }

  if (!movie) {
    return <div className="error">Movie not found</div>;
  }

  return (
    <div className="movie-detail-page">
      <div className="container">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="movie-detail-header">
          <div className="movie-poster">
            <img 
              src={movie.poster_url || `https://via.placeholder.com/300x450/6366f1/ffffff?text=${encodeURIComponent(movie.title)}`}
              alt={movie.title}
              onError={(e) => e.target.src = `https://via.placeholder.com/300x450/6366f1/ffffff?text=${encodeURIComponent(movie.title)}`}
            />
          </div>
          
          <div className="movie-info">
            <h1>{movie.title}</h1>
            <div className="movie-meta">
              <span className="year">{movie.release_year}</span>
              <span className="duration">{movie.duration} min</span>
              <span className="rating">⭐ {movie.average_rating || 'N/A'}</span>
            </div>
            
            <p className="director">
              <strong>Director:</strong> {movie.director}
            </p>
            
            {movie.genres && (
              <div className="genres">
                {movie.genres.split(',').map((genre, idx) => (
                  <span key={idx} className="genre-tag">{genre.trim()}</span>
                ))}
              </div>
            )}
            
            <p className="description">{movie.description}</p>
            
            <div className="action-buttons">
              <button className="btn-primary" onClick={handleAddToWatchlist}>
                Add to Watchlist
              </button>
              {movie.trailer_url && (
                <a href={movie.trailer_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                  Watch Trailer
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="reviews-section">
          <h2>Reviews ({reviews.length})</h2>
          
          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.review_id} className="review-card">
                  <div className="review-header">
                    <strong>{review.first_name} {review.last_name}</strong>
                    <span className="rating">⭐ {review.rating}/10</span>
                  </div>
                  <p className="review-text">{review.review_text}</p>
                  <p className="review-date">
                    {new Date(review.review_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-reviews">No reviews yet. Be the first to review!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
