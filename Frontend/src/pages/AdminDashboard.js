import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [movies, setMovies] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, [activeTab]);

    const fetchAdminData = async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);

            if (activeTab === 'users') {
                const response = await fetch('http://localhost:5000/api/admin/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data.users || []);
                } else {
                    console.error('Failed to fetch users');
                }
            } else if (activeTab === 'movies') {
                const response = await fetch('http://localhost:5000/api/admin/movies/analytics', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setMovies(data.movies || []);
                } else {
                    console.error('Failed to fetch movies');
                }
            } else if (activeTab === 'stats') {
                const response = await fetch('http://localhost:5000/api/admin/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setStats(data || {});
                } else {
                    console.error('Failed to fetch stats');
                }
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuspendUser = async (userId, isSuspended) => {
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/suspend`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ suspended: !isSuspended })
            });
            
            if (response.ok) {
                alert(`User ${!isSuspended ? 'suspended' : 'unsuspended'} successfully`);
                fetchAdminData();
            } else {
                alert('Failed to update user status');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error updating user status');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                alert('User deleted successfully');
                fetchAdminData();
            } else {
                alert('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user');
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="container">
                <h1>Admin Dashboard</h1>
                
                <div className="admin-tabs">
                    <button 
                        className={activeTab === 'users' ? 'active' : ''} 
                        onClick={() => setActiveTab('users')}
                    >
                        Users Management
                    </button>
                    <button 
                        className={activeTab === 'movies' ? 'active' : ''} 
                        onClick={() => setActiveTab('movies')}
                    >
                        Movies Analytics
                    </button>
                    <button 
                        className={activeTab === 'stats' ? 'active' : ''} 
                        onClick={() => setActiveTab('stats')}
                    >
                        Statistics
                    </button>
                </div>

                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <>
                        {activeTab === 'users' && (
                            <div className="users-section">
                                <h2>Users ({users.length})</h2>
                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Joined</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Reviews</th>
                                                <th>Watchlist</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.user_id}>
                                                    <td>{user.user_id}</td>
                                                    <td>{user.first_name} {user.last_name}</td>
                                                    <td>{user.email}</td>
                                                    <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                                                    <td><span className={`badge ${user.role}`}>{user.role}</span></td>
                                                    <td>
                                                        <span className={`status ${user.is_suspended ? 'suspended' : 'active'}`}>
                                                            {user.is_suspended ? 'Suspended' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td>{user.review_count}</td>
                                                    <td>{user.watchlist_count}</td>
                                                    <td>
                                                        <button 
                                                            className="btn-small btn-warning"
                                                            onClick={() => handleSuspendUser(user.user_id, user.is_suspended)}
                                                        >
                                                            {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                                                        </button>
                                                        <button 
                                                            className="btn-small btn-danger"
                                                            onClick={() => handleDeleteUser(user.user_id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'movies' && (
                            <div className="movies-section">
                                <h2>Movies Analytics</h2>
                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Title</th>
                                                <th>Year</th>
                                                <th>Rating</th>
                                                <th>Views</th>
                                                <th>Reviews</th>
                                                <th>Watchlists</th>
                                                <th>Discussions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movies.map(movie => (
                                                <tr key={movie.movie_id}>
                                                    <td>{movie.movie_id}</td>
                                                    <td>{movie.title}</td>
                                                    <td>{movie.release_year}</td>
                                                    <td>{movie.average_rating}/10</td>
                                                    <td>{movie.view_count}</td>
                                                    <td>{movie.review_count}</td>
                                                    <td>{movie.watchlist_count}</td>
                                                    <td>{movie.discussion_count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div className="stats-section">
                                <h2>Platform Statistics</h2>
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <h3>Total Users</h3>
                                        <p className="stat-number">{stats.totalUsers || 0}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Total Movies</h3>
                                        <p className="stat-number">{stats.totalMovies || 0}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Total Reviews</h3>
                                        <p className="stat-number">{stats.totalReviews || 0}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Total Events</h3>
                                        <p className="stat-number">{stats.totalEvents || 0}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Active Users (7d)</h3>
                                        <p className="stat-number">{stats.activeUsers || 0}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Suspended Users</h3>
                                        <p className="stat-number">{stats.suspendedUsers || 0}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
