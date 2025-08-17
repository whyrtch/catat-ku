import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Import pages
import Login from './pages/Login';
import Home from './pages/Home';
import AddIncome from './pages/AddIncome';
import AddExpense from './pages/AddExpense';
import AddDebt from './pages/AddDebt';
import { useProtectedRoute } from './hooks/useAuth';

// Protected Route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useProtectedRoute();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login, but save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route component
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useProtectedRoute();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If user is authenticated and trying to access login/register, redirect to home
  if (isAuthenticated && location.pathname === '/login') {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-income"
        element={
          <ProtectedRoute>
            <AddIncome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-expense"
        element={
          <ProtectedRoute>
            <AddExpense />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-debt"
        element={
          <ProtectedRoute>
            <AddDebt />
          </ProtectedRoute>
        }
      />
      {/* Redirect any unknown paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
