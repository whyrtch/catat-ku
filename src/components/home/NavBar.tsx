import { useNavigate } from 'react-router-dom';

interface NavBarProps {
  user: {
    displayName?: string | null;
    email?: string | null;
  } | null;
  onSignOut: () => void;
}

export const NavBar = ({ user, onSignOut }: NavBarProps) => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">CatatKu</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
            <button
              onClick={onSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
