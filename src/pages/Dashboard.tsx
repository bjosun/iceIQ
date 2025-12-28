import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import PlayerForm from '../components/dashboard/PlayerForm';
import ActionGrid from '../components/dashboard/ActionGrid';
import SummarySection from '../components/dashboard/SummarySection';
import PlayerHistoryModal from '../components/modals/PlayerHistoryModal';
import SubscriptionModal from '../components/modals/SubscriptionModal';
import TemplateEditorModal from '../components/modals/TemplateEditorModal';
import PlayerSelectModal from '../components/modals/PlayerSelectModal';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import Card from '../components/ui/Card';
import { BarChart3, Users, Target, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({
    players: 0,
    matches: 0,
    avgPoints: 0,
    thisWeek: 0
  });

  // If not logged in, show auth forms
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          {showSignup ? (
            <SignupForm onSwitchToLogin={() => setShowSignup(false)} />
          ) : (
            <LoginForm
              onSwitchToSignup={() => setShowSignup(true)}
              onForgotPassword={() => {/* TODO: Implement forgot password */}}
            />
          )}
        </Card>
      </div>
    );
  }

  const handleSaveGame = () => {
    // TODO: Implement save game logic
    console.log('Saving game with counts:', actionCounts);
    // Reset action counts after save
    setActionCounts({});
  };

  const handleReset = () => {
    if (window.confirm(t('resetAllWarning'))) {
      setActionCounts({});
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
            Welcome back, {user.displayName || user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-400">
            Track player performance with real-time analytics
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4">
            <div className="flex items-center justify-center mb-2">
              <Users className="text-cyan-400 mr-2" size={20} />
              <h3 className="text-sm font-medium text-gray-300">Players</h3>
            </div>
            <p className="text-2xl font-bold text-white">{stats.players}</p>
          </Card>
          
          <Card className="text-center p-4">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="text-green-400 mr-2" size={20} />
              <h3 className="text-sm font-medium text-gray-300">Matches</h3>
            </div>
            <p className="text-2xl font-bold text-white">{stats.matches}</p>
          </Card>
          
          <Card className="text-center p-4">
            <div className="flex items-center justify-center mb-2">
              <Target className="text-yellow-400 mr-2" size={20} />
              <h3 className="text-sm font-medium text-gray-300">Avg Points</h3>
            </div>
            <p className="text-2xl font-bold text-white">{stats.avgPoints}</p>
          </Card>
          
          <Card className="text-center p-4">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="text-red-400 mr-2" size={20} />
              <h3 className="text-sm font-medium text-gray-300">This Week</h3>
            </div>
            <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <PlayerForm
            onShowHistory={() => setShowHistoryModal(true)}
            onEditTemplate={() => setShowTemplateEditor(true)}
          />
          
          {/* Action Grid - Update to pass actionCounts */}
          <ActionGrid 
            actionCounts={actionCounts}
            onCountChange={setActionCounts}
          />
          
          <SummarySection
            actionCounts={actionCounts}
            onSaveGame={handleSaveGame}
            onReset={handleReset}
          />
        </div>
      </div>

      {/* Modals */}
      <PlayerHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
      
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
      
      <TemplateEditorModal
        isOpen={showTemplateEditor}
        onClose={() => setShowTemplateEditor(false)}
      />
      
      <PlayerSelectModal
        isOpen={showPlayerSelect}
        onClose={() => setShowPlayerSelect(false)}
        onSelectPlayer={(playerName) => {
          console.log('Selected player:', playerName);
        }}
        onAddNewPlayer={() => {
          console.log('Add new player');
        }}
      />

      {/* Mobile Navigation */}
      <MobileBottomNav 
        onHistoryClick={() => setShowHistoryModal(true)}
        onPremiumClick={() => setShowSubscriptionModal(true)}
        onRecordGame={handleSaveGame}
      />
    </div>
  );
}