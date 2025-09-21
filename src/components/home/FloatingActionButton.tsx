import { PlusIcon } from '@heroicons/react/24/outline';
import { ReactNode, useRef, useEffect } from 'react';

interface FloatingActionButtonProps {
  showMenu: boolean;
  onToggleMenu: () => void;
  onAddDebt: () => void;
}

export const FloatingActionButton = ({
  showMenu,
  onToggleMenu,
  onAddDebt,
}: FloatingActionButtonProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggleMenu();
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, onToggleMenu]);

  const ActionButton = ({
    children,
    onClick,
    className = '',
    delay = '0ms',
  }: {
    children: ReactNode;
    onClick: () => void;
    className?: string;
    delay?: string;
  }) => (
    <div
      className={`transition-all duration-200 transform ${
        showMenu ? 'translate-y-0' : 'translate-y-4 opacity-0'
      }`}
      style={{ transitionDelay: showMenu ? delay : '0ms' }}
    >
      <button
        onClick={onClick}
        className={`group flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${className}`}
        aria-label="Add transaction"
      >
        {children}
      </button>
    </div>
  );

  return (
    <div ref={menuRef} className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-50">
      <div
        className={`flex flex-col items-end space-y-3 transition-all duration-300 transform origin-bottom-right ${
          showMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
        }`}
      >
        <ActionButton
          onClick={() => {
            onToggleMenu();
            onAddDebt();
          }}
          className="bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400"
        >
          <div className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 group-hover:scale-110 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="text-xs font-medium mt-1">Debt</span>
          </div>
        </ActionButton>
      </div>

      <button
        onClick={onToggleMenu}
        className={`mt-4 flex items-center justify-center w-16 h-16 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform ${
          showMenu ? 'rotate-45' : ''
        }`}
        aria-label={showMenu ? 'Close menu' : 'Add transaction'}
      >
        <PlusIcon className="h-8 w-8" />
      </button>
    </div>
  );
};
