import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { watchlistService } from '../services';
import './Watchlist.css';

const Watchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = user?.user_id || user?.userId;
    if (userId) {
      console.log('Loading watchlist for user:', userId);
      loadWatchlist();
    } else {
      console.log('No user ID available', user);
      setLoading(false);
    }
  }, [user, filter]);

  const loadWatchlist = async () => {
    try {
      const userId = user?.user_id || user?.userId;
      const status = filter !== 'all' ? filter : null;
      const data = await watchlistService.getWatchlist(userId, status);
      console.log('Watchlist data:', data);
      setWatchlist(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (watchlistId, newStatus) => {
    try {
      await watchlistService.updateStatus(watchlistId, newStatus);
      loadWatchlist();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleRemove = async (watchlistId) => {
    if (window.confirm('Remove this movie from your watchlist?')) {
      try {
        await watchlistService.removeFromWatchlist(watchlistId);
        loadWatchlist();
      } catch (error) {
        console.error('Error removing from watchlist:', error);
      }
    }
  };

  return (
    <div className="watchlist-page">
      <div className="container">
        <h1>My Watchlist</h1>

        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'watching' ? 'active' : ''}
            onClick={() => setFilter('watching')}
          >
            Watching
          </button>
          <button
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button
            className={filter === 'plan_to_watch' ? 'active' : ''}
            onClick={() => setFilter('to-watch')}
          >
            Plan to Watch
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading watchlist...</div>
        ) : watchlist.length > 0 ? (
          <div className="watchlist-grid">
            {watchlist.map(item => (
              <div key={item.watchlist_id} className="watchlist-item">
                <img 
                  src={`https://via.placeholder.com/300x450/6366f1/ffffff?text=${encodeURIComponent(item.title)}`}
                  alt={item.title} 
                />
                <div className="item-info">
                  <h3>{item.title}</h3>
                  <p className="year">{item.release_year}</p>
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.watchlist_id, e.target.value)}
                    className="status-select"
                  >
                    <option value="to-watch">Plan to Watch</option>
                    <option value="watching">Watching</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={() => handleRemove(item.watchlist_id)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Your watchlist is empty</p>
            <a href="/movies" className="btn-primary">Browse Movies</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
