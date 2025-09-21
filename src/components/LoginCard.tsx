import { Button } from "@heroui/button";

import { GoogleIcon } from "./icons/GoogleIcon";

interface LoginCardProps {
  onGoogleSignIn: () => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const LoginCard = ({
  onGoogleSignIn,
  isLoading,
  error,
}: LoginCardProps) => {
  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-24 h-24 mb-6 bg-blue-100 rounded-full">
          <span className="text-2xl font-bold text-blue-600">CatatKu</span>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Welcome to CatatKu
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to your account to continue
        </p>
      </div>
      <div className="mt-8 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">Continue with</span>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-6">
          <Button
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            disabled={isLoading}
            onClick={onGoogleSignIn}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </Button>
        </div>
      </div>
    </div>
  );
};
