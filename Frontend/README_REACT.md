# Movie Community - React Frontend

A modern React.js frontend for the Movie Community Management System.

## Setup

1. Navigate to the frontend-react directory:
```bash
cd frontend-react
```

2. Install dependencies (already done):
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Backend Connection

Make sure your Node.js backend is running on `http://localhost:3000` before using the app.

## Features Implemented

✅ User Authentication (Login/Register)
✅ Home Page with features showcase
✅ Protected Routes
✅ API Service Layer with Axios
✅ Auth Context for state management
✅ Responsive Header Navigation

## Pages

- **Home** (`/`) - Landing page with features
- **Login** (`/login`) - User login
- **Register** (`/register`) - User registration

## Next Steps

Additional pages to create for full functionality:
- Dashboard
- Movies Catalog
- Movie Details
- Watchlist
- Events/Watch Parties
- User Profile
- Admin Panel

## Project Structure

```
frontend-react/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Header.js
│   │   └── PrivateRoute.js
│   ├── context/         # React Context
│   │   └── AuthContext.js
│   ├── pages/           # Page components
│   │   ├── Home.js
│   │   ├── Login.js
│   │   └── Register.js
│   ├── services/        # API services
│   │   ├── api.js
│   │   └── index.js
│   ├── App.js           # Main app component
│   └── index.js         # Entry point
└── public/
```

## Technologies

- React 18
- React Router DOM
- Axios
- Context API for state management
