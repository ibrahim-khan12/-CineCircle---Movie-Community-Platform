import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Movies from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import Watchlist from './pages/Watchlist';
import Events from './pages/Events';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/movies" element={<PrivateRoute><Movies /></PrivateRoute>} />
              <Route path="/movies/:id" element={<PrivateRoute><MovieDetail /></PrivateRoute>} />
              <Route path="/watchlist" element={<PrivateRoute><Watchlist /></PrivateRoute>} />
              <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
            </Routes>
          </main>
          <footer className="footer">
            <div className="container">
              <p>&copy; 2025 Movie Community Management System. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
