import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, History, Crown, User, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MobileBottomNavProps {
  onRecordGame?: () => void;
}

export default function MobileBottomNav({ onRecordGame }: MobileBottomNavProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50">
      <div className="flex justify-around items-center h-16 px-2">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 p-2 ${
            isActive('/dashboard') ? 'text-cyan-400' : 'text-gray-400'
          }`}
        >
          <Home size={24} />
          <span className="text-xs mt-1">Home</span>
        </Link>

        <Link
          to="/dashboard?history=true"
          className={`flex flex-col items-center justify-center flex-1 p-2 ${
            location.search.includes('history') ? 'text-cyan-400' : 'text-gray-400'
          }`}
        >
          <History size={24} />
          <span className="text-xs mt-1">History</span>
        </Link>

        {onRecordGame && (
          <button
            onClick={onRecordGame}
            className="flex flex-col items-center justify-center flex-1 p-2 text-cyan-400"
          >
            <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center -mt-4 shadow-lg">
              <Plus size={24} />
            </div>
            <span className="text-xs mt-1">Record</span>
          </button>
        )}

        <Link
          to="/dashboard?premium=true"
          className={`flex flex-col items-center justify-center flex-1 p-2 ${
            location.search.includes('premium') ? 'text-yellow-400' : 'text-gray-400'
          }`}
        >
          <Crown size={24} />
          <span className="text-xs mt-1">Premium</span>
        </Link>

        <Link
          to="/dashboard?profile=true"
          className={`flex flex-col items-center justify-center flex-1 p-2 ${
            location.search.includes('profile') ? 'text-cyan-400' : 'text-gray-400'
          }`}
        >
          <User size={24} />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
}