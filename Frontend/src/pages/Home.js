import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="container">
        <div className="hero">
          <h1>Welcome to Movie Community</h1>
          <p>
            Join the ultimate social platform for movie enthusiasts! Connect with friends, 
            discover new movies, share reviews, and participate in watch parties.
          </p>
          
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">
              Join the Community
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">1,500+</div>
            <div className="stat-label">Movies in Catalog</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">5,000+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">15,000+</div>
            <div className="stat-label">Reviews Written</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">200+</div>
            <div className="stat-label">Watch Parties Hosted</div>
          </div>
        </div>

        <div className="features">
          <h2>Features</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <h3>📋 Personal Watchlists</h3>
              <p>Keep track of movies you want to watch, are currently watching, and have completed.</p>
            </div>
            <div className="feature-card">
              <h3>⭐ Reviews & Ratings</h3>
              <p>Share your thoughts and rate movies to help other community members discover great content.</p>
            </div>
            <div className="feature-card">
              <h3>💬 Discussion Forums</h3>
              <p>Join movie-specific discussions, share theories, and connect with fellow movie lovers.</p>
            </div>
            <div className="feature-card">
              <h3>🎉 Watch Parties</h3>
              <p>Host or join virtual watch parties to experience movies together with friends.</p>
            </div>
            <div className="feature-card">
              <h3>👥 Social Network</h3>
              <p>Connect with friends, send private messages, and see what they're watching.</p>
            </div>
            <div className="feature-card">
              <h3>🏆 Recommendations</h3>
              <p>Get personalized movie recommendations based on your preferences and friends' activity.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
