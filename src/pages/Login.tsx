import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginCard } from '../components/LoginCard';
import { auth, googleProvider } from '../lib/firebaseConfig';
import { signInWithPopup } from 'firebase/auth';

export const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home if already logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/home');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
      // The onAuthStateChanged listener will handle the redirect
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
