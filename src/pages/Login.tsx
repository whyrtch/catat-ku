import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { LoginCard } from "../components/LoginCard";
import { signInWithGoogle } from "../lib/firebaseConfig";

export const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
      // Redirect to the intended page or home
      const from = location.state?.from?.pathname || "/";

      navigate(from, { replace: true });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to sign in with Google",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50 sm:px-6 lg:px-8">
      <LoginCard
        error={error}
        isLoading={isLoading}
        onGoogleSignIn={handleGoogleSignIn}
      />
    </div>
  );
};

export default Login;
