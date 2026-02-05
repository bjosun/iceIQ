import React from 'react'; // Tog bort useState härifrån
import { Calendar, Users, FileText, Search, Edit } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTemplates } from '../../contexts/TemplateContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

interface PlayerFormProps {
  onShowHistory: () => void;
  onEditTemplate: () => void;
  
  // NYA PROPS: Vi tar emot state från föräldern (Dashboard)
  selectedPlayerName: string;
  onPlayerNameChange: (name: string) => void;
  teamName: string;
  onTeamNameChange: (name: string) => void;
  gameDate: string;
  onGameDateChange: (date: string) => void;
  onOpenPlayerSelect: () => void; // För förstoringsglaset
}

export default function PlayerForm({ 
  onShowHistory, 
  onEditTemplate,
  selectedPlayerName,
  onPlayerNameChange,
  teamName,
  onTeamNameChange,
  gameDate,
  onGameDateChange,
  onOpenPlayerSelect
}: PlayerFormProps) {
  
  const { t, language } = useLanguage();
  const { subscription } = useSubscription();
  const { templates, currentTemplateId, setCurrentTemplate, currentTemplate } = useTemplates();
  
  // Tog bort lokala useState. Vi använder props istället.

  const templateOptions = Object.entries(templates).map(([id, template]) => ({
    value: id,
    label: template.name[language]
  }));

  return (
    <Card elevated className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Player Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('playerName')}
          </label>
          <div className="flex">
            <Input
              value={selectedPlayerName} // Använder prop
              onChange={(e) => onPlayerNameChange(e.target.value)} // Uppdaterar föräldern
              placeholder="Enter player name"
              className="rounded-r-none"
            />
            <Button
              variant="secondary"
              className="rounded-l-none border-l-0"
              onClick={onOpenPlayerSelect} // Öppnar modalen i Dashboard
            >
              <Search size={18} />
            </Button>
          </div>
        </div>

        {/* Team Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('team')}
          </label>
          <Input
            value={teamName} // Använder prop
            onChange={(e) => onTeamNameChange(e.target.value)}
            placeholder="Team name"
            icon={Users}
          />
        </div>

        {/* Game Date */}
        <div className="w-full min-w-0"> {/* Tillagt: w-full min-w-0 för att säkra kolumnen */}
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('gameDate')}
          </label>
          <Input
            type="date"
            value={gameDate}
            onChange={(e) => onGameDateChange(e.target.value)}
            icon={Calendar}
            className="w-full" // Tillagt: Tvinga inputen att hålla sig inom ramen
          />
        </div>

        {/* Template Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('template')}
          </label>
          <div className="flex space-x-2">
            <select
              value={currentTemplateId}
              onChange={(e) => setCurrentTemplate(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
          {subscription.plan === 'free' && (
            <p className="mt-2 text-sm text-yellow-400">
              {t('upgradeCTA')}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <Button
          variant="secondary"
          onClick={onShowHistory}
          icon={FileText}
          fullWidth={window.innerWidth < 640}
        >
          {t('showPlayerHistory')}
        </Button>

        {subscription.plan === 'free' && (
          <Button
            variant="premium"
            onClick={() => { /* Open upgrade modal logic here or via prop if needed */ }}
            className="sm:ml-auto"
            fullWidth={window.innerWidth < 640}
          >
            {t('upgradeToPremium')}
          </Button>
        )}
      </div>
    </Card>
  );
}