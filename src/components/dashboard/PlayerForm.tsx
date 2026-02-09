import React from 'react';
import { Calendar, Users, FileText, Search, Edit, Mail } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTemplates } from '../../contexts/TemplateContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

interface PlayerFormProps {
  onShowHistory: () => void;
  onEditTemplate: () => void;
  selectedPlayerName: string;
  onPlayerNameChange: (name: string) => void;
  teamName: string;
  onTeamNameChange: (name: string) => void;
  playerEmail: string; // Ny prop
  onPlayerEmailChange: (email: string) => void; // Ny prop
  gameDate: string;
  onGameDateChange: (date: string) => void;
  onOpenPlayerSelect: () => void;
}

export default function PlayerForm({ 
  onShowHistory, 
  onEditTemplate,
  selectedPlayerName,
  onPlayerNameChange,
  teamName,
  onTeamNameChange,
  playerEmail,
  onPlayerEmailChange,
  gameDate,
  onGameDateChange,
  onOpenPlayerSelect
}: PlayerFormProps) {
  
  const { t, language } = useLanguage();
  const { subscription } = useSubscription();
  const { templates, currentTemplateId, setCurrentTemplate } = useTemplates();

  const templateOptions = Object.entries(templates).map(([id, template]) => ({
    value: id,
    label: template.name[language]
  }));

  return (
    <Card elevated className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Player Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('playerName')}
          </label>
          <div className="flex">
            <Input
              value={selectedPlayerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder="Enter name"
              className="rounded-r-none"
            />
            <Button
              variant="secondary"
              className="rounded-l-none border-l-0 px-3"
              onClick={onOpenPlayerSelect}
            >
              <Search size={18} />
            </Button>
          </div>
        </div>

        {/* 2. Team Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('team')}
          </label>
          <Input
            value={teamName}
            onChange={(e) => onTeamNameChange(e.target.value)}
            placeholder="Team name"
            icon={Users}
          />
        </div>

        {/* 3. Player Email (Framtidssäkring) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('playerEmail') || 'Player Email'}
          </label>
          <Input
            type="email"
            value={playerEmail}
            onChange={(e) => onPlayerEmailChange(e.target.value)}
            placeholder="Email for login"
            icon={Mail}
          />
        </div>

        {/* 4. Game Date */}
        <div className="w-full min-w-0"> 
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('gameDate')}
          </label>
          <Input
            type="date"
            value={gameDate}
            onChange={(e) => onGameDateChange(e.target.value)}
            icon={Calendar}
            className="w-full"
          />
        </div>

        {/* 5. Template Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('template')}
          </label>
          <div className="flex space-x-2">
            <select
              value={currentTemplateId}
              onChange={(e) => setCurrentTemplate(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {templateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {subscription.plan === 'premium' && (
              <Button
                variant="secondary"
                onClick={onEditTemplate}
                className="px-3"
              >
                <Edit size={18} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <Button
          variant="secondary"
          onClick={onShowHistory}
          icon={FileText}
          className="sm:w-auto w-full"
        >
          {t('showPlayerHistory')}
        </Button>

        {subscription.plan === 'free' && (
          <Button
            variant="premium"
            onClick={() => {}}
            className="sm:ml-auto sm:w-auto w-full"
          >
            {t('upgradeToPremium')}
          </Button>
        )}
      </div>
    </Card>
  );
}