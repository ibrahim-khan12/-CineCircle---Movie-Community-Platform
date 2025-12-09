# CineCircle - Movie Community Platform

A full-stack social platform for movie enthusiasts to discover, review, discuss, and share their love for cinema with a vibrant community.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![React](https://img.shields.io/badge/react-19.2.1-blue.svg)
![MySQL](https://img.shields.io/badge/mysql-8.0-orange.svg)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Admin Panel](#admin-panel)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### User Features
- 🔐 **User Authentication** - Secure registration, login, and JWT-based authentication
- 🎬 **Movie Database** - Browse extensive movie collection with detailed information
- ⭐ **Reviews & Ratings** - Rate movies (1-10) and write comprehensive reviews
- 📝 **Watchlist Management** - Create personal watchlists with status tracking (to-watch, watching, completed)
- 💬 **Discussion Forums** - Engage in movie-specific discussions with the community
- 👥 **Social Features** - Add friends, send messages, and see what others are watching
- 🎉 **Watch Parties** - Host and join virtual watch party events
- 🎭 **Genre Preferences** - Set favorite genres for personalized recommendations
- 📊 **User Dashboard** - Track your activity, statistics, and movie journey
- 🔍 **Advanced Search** - Filter movies by genre, year, rating, and more
- ❤️ **Like System** - Like reviews and discussion posts

### Admin Features
- 👨‍💼 **Admin Dashboard** - Comprehensive overview of platform statistics
- 👥 **User Management** - View, suspend, unsuspend, and delete users
- 📊 **Analytics** - Monitor movie views, ratings, and user engagement
- 🛡️ **Content Moderation** - Review and manage user-generated content
- 📈 **Reports** - Generate reports on active users, popular movies, and genre trends
- 🚫 **Restricted Words** - Manage content filtering with restricted word lists
- 📋 **Audit Logs** - Track all administrative actions with detailed logging

## 🛠️ Tech Stack

### Frontend
- **React** 19.2.1 - Modern UI library for building interactive interfaces
- **React Router** 7.10.1 - Client-side routing
- **Axios** 1.13.2 - HTTP client for API requests
- **JWT Decode** 4.0.0 - Token decoding for authentication
- **CSS3** - Custom styling with responsive design

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** 4.18.2 - Web application framework
- **MySQL2** 3.6.5 - MySQL database driver with promise support
- **bcrypt** 5.1.1 - Password hashing and security
- **JSON Web Token** 9.0.2 - Authentication and authorization
- **CORS** 2.8.5 - Cross-Origin Resource Sharing
- **dotenv** 16.3.1 - Environment variable management

### Database
- **MySQL** 8.0+ - Relational database management system
- **Stored Procedures** - Business logic in database
- **Triggers** - Automated database operations
- **Views** - Complex query optimization

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts and authentication
- **movies** - Movie catalog with metadata
- **genres** - Movie genre taxonomy
- **reviews** - User reviews and ratings
- **watchlist** - Personal movie lists
- **discussion_posts** - Forum discussions
- **discussion_comments** - Discussion replies
- **events** - Watch party events
- **friendships** - User connections
- **messages** - Direct messaging
- **notifications** - User notifications
- **audit_log** - Administrative action tracking

### Key Features
- ✅ Foreign key constraints with CASCADE delete
- ✅ Indexed columns for optimized queries
- ✅ Automated rating calculations via triggers
- ✅ View count tracking
- ✅ Comprehensive audit logging

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/CineCircle.git
cd CineCircle
```

### Step 2: Database Setup
```bash
# Login to MySQL
mysql -u root -p

# Create and populate database
source movie_community_db.sql
```

### Step 3: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file (see Configuration section)
cp .env.example .env

# Start backend server
npm start
```

The backend server will run on `http://localhost:5000`

### Step 4: Frontend Setup
```bash
cd Frontend

# Install dependencies
npm install

# Start React development server
npm start
```

The frontend will run on `http://localhost:3000`

## ⚙️ Configuration

### Backend Environment Variables (.env)

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=movie_community_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your_session_secret_key

# Admin Configuration
ADMIN_ACCESS_CODE=admin123
```

### Database Configuration

The SQL script includes:
- Complete schema with 15+ tables
- Sample data (users, movies, reviews, events)
- Stored procedures for business logic
- Triggers for automated operations
- Views for complex queries

## 🚀 Usage

### User Registration & Login
1. Navigate to `http://localhost:3000/register`
2. Create an account with email and password
3. Login at `http://localhost:3000/login`

### Default Admin Credentials
```
Email: newadmin@email.com
Password: password123
Access Code: NEWADMIN2025
```

### Exploring Movies
- Browse the movie catalog from the dashboard
- Filter by genre, year, or rating
- Click on any movie for detailed information
- Add movies to your watchlist

### Social Features
- Write reviews and rate movies
- Participate in discussions
- Add friends and send messages
- Create or join watch party events

### Admin Access
- Login with admin credentials
- Access admin dashboard at `/admin`
- Manage users, content, and platform settings

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "favoriteGenres": [1, 5, 7]
}
```

#### POST `/api/auth/login`
User login
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST `/api/auth/admin/login`
Admin login with access code
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "accessCode": "ADMIN2024"
}
```

### Movie Endpoints

#### GET `/api/movies`
Get all movies with optional filters
- Query params: `genre`, `year`, `minRating`, `search`

#### GET `/api/movies/:id`
Get specific movie details

#### GET `/api/movies/trending/top`
Get trending movies

#### GET `/api/movies/recommendations/top`
Get personalized recommendations

### Watchlist Endpoints

#### GET `/api/watchlists/:userId`
Get user's watchlist
- Query params: `status` (to-watch, watching, completed)

#### POST `/api/watchlists`
Add movie to watchlist
```json
{
  "movie_id": 1,
  "status": "to-watch"
}
```

#### PUT `/api/watchlists/:id`
Update watchlist item status

#### DELETE `/api/watchlists/:id`
Remove from watchlist

### Review Endpoints

#### GET `/api/reviews/movie/:movieId`
Get all reviews for a movie

#### POST `/api/reviews`
Create a review
```json
{
  "movie_id": 1,
  "rating": 9,
  "review_text": "Amazing movie!"
}
```

#### POST `/api/reviews/:reviewId/like`
Like a review

### Admin Endpoints

#### GET `/api/admin/users`
Get all users with filters

#### PUT `/api/admin/users/:userId/suspend`
Suspend a user

#### DELETE `/api/admin/users/:userId`
Delete a user

#### GET `/api/admin/stats/overview`
Get platform statistics

#### GET `/api/admin/reports/top-movies`
Get top movies report

## 👨‍💼 Admin Panel

The admin panel provides comprehensive management tools:

### User Management
- View all registered users
- Search and filter users
- Suspend/unsuspend accounts
- Delete user accounts
- View user activity statistics

### Content Analytics
- Movie view counts and ratings
- Review and discussion statistics
- Genre popularity trends
- Active user reports

### Moderation Tools
- Review content moderation queue
- Delete inappropriate reviews/posts
- Manage restricted word list
- View audit logs

### Platform Statistics
- Total users, movies, reviews
- Active users (daily/weekly)
- Event participation metrics
- Engagement analytics

## 📸 Screenshots

*Screenshots can be added here*

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Write meaningful commit messages
- Add comments for complex logic
- Test thoroughly before submitting PR
- Update documentation as needed

## 🐛 Known Issues

- Admin dashboard statistics require page refresh after actions
- Real-time messaging not yet implemented
- Mobile responsiveness needs improvement in some views

## 🔮 Future Enhancements

- [ ] Real-time chat and notifications using WebSockets
- [ ] Advanced recommendation algorithm (ML-based)
- [ ] Social media integration (share reviews)
- [ ] Mobile application (React Native)
- [ ] Email notifications for events
- [ ] Movie trailer integration (YouTube API)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Export/import watchlist feature

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [GitHub Profile](https://github.com/ibrahim-khan12)

## 🙏 Acknowledgments

- Movie data structure inspired by IMDb and TMDb
- UI design inspired by Netflix and Letterboxd
- Built as a Database Management Systems course project
- Thanks to all contributors and testers

## 📞 Contact & Support

For questions, suggestions, or issues:
- Create an issue on GitHub
- Project Link: [https://github.com/ibrahim-khan12/CineCircle](https://github.com/ibrahim-khan12/CineCircle)

---

**Note**: This is an academic project developed for educational purposes. Movie data and images are for demonstration only.

## 🚀 Quick Start Guide

### For Users
1. Register an account
2. Set your favorite genres
3. Browse movies and add to watchlist
4. Write reviews and join discussions
5. Connect with friends
6. Join or host watch parties

### For Admins
1. Login with admin credentials
2. Access admin panel from header
3. Monitor platform activity
4. Manage users and content
5. Generate reports
6. Review audit logs

---


