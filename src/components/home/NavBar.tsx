import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ClockIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface NavBarProps {
  user: {
    displayName?: string | null;
    email?: string | null;
  } | null;
  onSignOut: () => void;
}

export const NavBar = ({ user, onSignOut }: NavBarProps) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'bg-gray-100 text-gray-900' 
      : 'text-gray-600 hover:bg-gray-50';
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">My Debts</h1>
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                to="/"
                className={`${isActive('/')} px-3 py-2 rounded-md text-sm font-medium flex items-center`}
              >
                <HomeIcon className="h-5 w-5 mr-2" />
                Home
              </Link>
              <Link
                to="/history"
                className={`${isActive('/history')} px-3 py-2 rounded-md text-sm font-medium flex items-center`}
              >
                <ClockIcon className="h-5 w-5 mr-2" />
                History
              </Link>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="block h-6 w-6" />
            </button>
          </div>

          {/* Desktop user menu */}
          <div className="hidden sm:flex sm:items-center space-x-4">
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

      {/* Mobile menu */}
      <div className={`sm:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className={`${isActive('/')} block px-3 py-2 rounded-md text-base font-medium`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex items-center">
              <HomeIcon className="h-5 w-5 mr-2" />
              Home
            </div>
          </Link>
          <Link
            to="/history"
            className={`${isActive('/history')} block px-3 py-2 rounded-md text-base font-medium`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              History
            </div>
          </Link>
          <div className="border-t border-gray-200 pt-4 mt-2">
            <div className="px-3 py-2 text-sm text-gray-500">
              {user?.displayName || user?.email}
            </div>
            <button
              onClick={() => {
                onSignOut();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
