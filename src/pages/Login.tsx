import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginCard } from '../components/LoginCard';
import { signInWithGoogle } from '../lib/firebaseConfig';

export const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // Redirect to the intended page or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Error signing in with Google:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50 sm:px-6 lg:px-8">
      <LoginCard onGoogleSignIn={handleGoogleSignIn} isLoading={isLoading} />
    </div>
  );
};

export default Login;
