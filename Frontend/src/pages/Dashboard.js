import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { movieService, watchlistService } from '../services';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [trending, setTrending] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [watchlistStats, setWatchlistStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [trendingData, recommendationsData] = await Promise.all([
        movieService.getTrending(),
        movieService.getRecommendations()
      ]);

      setTrending(Array.isArray(trendingData) ? trendingData.slice(0, 6) : []);
      setRecommendations(Array.isArray(recommendationsData) ? recommendationsData.slice(0, 6) : []);

      const userId = user?.user_id || user?.userId;
      if (userId) {
        const watchlist = await watchlistService.getWatchlist(userId);
        const stats = {
          total: watchlist.length,
          watching: watchlist.filter(w => w.status === 'watching').length,
          completed: watchlist.filter(w => w.status === 'completed').length,
          planToWatch: watchlist.filter(w => w.status === 'to-watch').length,
        };
        setWatchlistStats(stats);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.first_name}!</h1>
          <p>Your personalized movie dashboard</p>
        </div>

        {watchlistStats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{watchlistStats.total}</h3>
              <p>Total Movies</p>
            </div>
            <div className="stat-card">
              <h3>{watchlistStats.watching}</h3>
              <p>Watching</p>
            </div>
            <div className="stat-card">
              <h3>{watchlistStats.completed}</h3>
              <p>Completed</p>
            </div>
            <div className="stat-card">
              <h3>{watchlistStats.planToWatch}</h3>
              <p>Plan to Watch</p>
            </div>
          </div>
        )}

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Trending Movies</h2>
            <Link to="/movies" className="view-all">View All →</Link>
          </div>
          <div className="movies-grid">
            {trending.map(movie => (
              <div key={movie.movie_id} className="movie-card">
                <img 
                  src={`https://via.placeholder.com/300x450/6366f1/ffffff?text=${encodeURIComponent(movie.title)}`}
                  alt={movie.title} 
                />
                <h3>{movie.title}</h3>
                <p>{movie.release_year}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Recommended for You</h2>
            <Link to="/movies" className="view-all">View All →</Link>
          </div>
          <div className="movies-grid">
            {recommendations.map(movie => (
              <div key={movie.movie_id} className="movie-card">
                <img 
                  src={`https://via.placeholder.com/300x450/6366f1/ffffff?text=${encodeURIComponent(movie.title)}`}
                  alt={movie.title} 
                />
                <h3>{movie.title}</h3>
                <p>{movie.release_year}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="quick-links">
          <Link to="/movies" className="quick-link-card">
            <h3>Browse Movies</h3>
            <p>Explore our collection</p>
          </Link>
          <Link to="/watchlist" className="quick-link-card">
            <h3>My Watchlist</h3>
            <p>Manage your movies</p>
          </Link>
          <Link to="/events" className="quick-link-card">
            <h3>Events</h3>
            <p>Join watch parties</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
