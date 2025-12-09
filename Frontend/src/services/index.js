import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export const movieService = {
  getMovies: async (params) => {
    const response = await api.get('/movies', { params });
    return response.data;
  },

  getMovie: async (id) => {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  },

  getTrending: async () => {
    const response = await api.get('/movies/trending/top');
    return response.data;
  },

  getRecommendations: async () => {
    const response = await api.get('/movies/recommendations/top');
    return response.data;
  },
};

export const watchlistService = {
  getWatchlist: async (userId, status) => {
    const params = status ? { status } : {};
    const response = await api.get(`/watchlists/${userId}`, { params });
    return response.data;
  },

  addToWatchlist: async (movieId) => {
    const response = await api.post('/watchlists', { movie_id: movieId });
    return response.data;
  },

  updateStatus: async (watchlistId, status) => {
    const response = await api.put(`/watchlists/${watchlistId}`, { status });
    return response.data;
  },

  removeFromWatchlist: async (watchlistId) => {
    const response = await api.delete(`/watchlists/${watchlistId}`);
    return response.data;
  },
};

export const reviewService = {
  getMovieReviews: async (movieId) => {
    const response = await api.get(`/reviews/movie/${movieId}`);
    return response.data;
  },

  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  updateReview: async (reviewId, reviewData) => {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  likeReview: async (reviewId) => {
    const response = await api.post(`/reviews/${reviewId}/like`);
    return response.data;
  },
};

export const eventService = {
  getEvents: async (params) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getEvent: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  joinEvent: async (eventId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await api.post(`/events/${eventId}/join`, { userId: user.user_id });
    return response.data;
  },

  leaveEvent: async (eventId) => {
    const response = await api.delete(`/events/${eventId}/leave`);
    return response.data;
  },

  cancelEvent: async (eventId) => {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },
};

export const userService = {
  getProfile: async (userId) => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },

  updateProfile: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  getActivity: async (userId) => {
    const response = await api.get(`/users/${userId}/activity`);
    return response.data;
  },

  getNotifications: async (userId) => {
    const response = await api.get(`/users/${userId}/notifications`);
    return response.data;
  },
};
