import { Route, Routes, Navigate, useLocation, Outlet } from 'react-router-dom';

// Import pages
import Login from './pages/Login';
import Home from './pages/Home';
import AddIncome from './pages/AddIncome';
import AddExpense from './pages/AddExpense';
import AddDebt from './pages/AddDebt';
import { useAuth } from './hooks/useAuth';

// Protected Route wrapper
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// Public Route wrapper
const PublicRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (user) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>
      
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/add-income" element={<AddIncome />} />
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/add-debt" element={<AddDebt />} />
      </Route>
      
      {/* Redirect any unknown paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
