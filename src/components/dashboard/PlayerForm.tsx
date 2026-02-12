import React from 'react';
import { 
  Calendar, 
  Shield, 
  User, 
  History, 
  LayoutTemplate, 
  ChevronRight,
  Mail,
  Edit
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTemplates } from '../../contexts/TemplateContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface PlayerFormProps {
  selectedPlayerName: string;
  onPlayerNameChange: (name: string) => void;
  teamName: string;
  onTeamNameChange: (name: string) => void;
  playerEmail: string;
  onPlayerEmailChange: (email: string) => void;
  gameDate: string;
  onGameDateChange: (date: string) => void;
  onOpenPlayerSelect: () => void;
  onShowHistory: () => void;
  onEditTemplate: () => void;
}

export default function PlayerForm({
  selectedPlayerName,
  onPlayerNameChange,
  teamName,
  onTeamNameChange,
  playerEmail,
  onPlayerEmailChange,
  gameDate,
  onGameDateChange,
  onOpenPlayerSelect,
  onShowHistory,
  onEditTemplate
}: PlayerFormProps) {
  const { t, language } = useLanguage();
  const { subscription } = useSubscription();
  const { templates, currentTemplateId, setCurrentTemplate } = useTemplates();

  const templateOptions = Object.entries(templates).map(([id, template]) => ({
    value: id,
    label: template.name[language]
  }));

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6">
      <div className="space-y-4">
        
        {/* --- SEKTION 1: SPELARE --- */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('selectPlayer') || "Player"}
          </label>
          <div className="relative group">
            {/* Osynlig klick-yta över inputen för att öppna modalen */}
            <div 
              onClick={onOpenPlayerSelect}
              className="absolute inset-0 z-10 cursor-pointer"
            ></div>
            <Input
              value={selectedPlayerName}
              readOnly
              placeholder={t('selectPlayer') || "Select Player"}
              icon={User}
              className="cursor-pointer group-hover:border-cyan-500/50 transition-colors bg-gray-900/50"
              rightIcon={ChevronRight}
            />
          </div>
        </div>

        {/* --- SEKTION 2: DETALJER (Lag, Email, Datum) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t('team') || "Team"}</label>
            <Input
              value={teamName}
              onChange={(e) => onTeamNameChange(e.target.value)}
              placeholder="Team Name"
              icon={Shield}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t('playerEmail') || "Email"}</label>
            <Input
              type="email"
              value={playerEmail}
              onChange={(e) => onPlayerEmailChange(e.target.value)}
              placeholder="Optional"
              icon={Mail}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t('gameDate') || "Date"}</label>
            <Input
              type="date"
              value={gameDate}
              onChange={(e) => onGameDateChange(e.target.value)}
              icon={Calendar}
              className="w-full"
            />
          </div>
        </div>

        {/* --- SEKTION 3: MALL & HISTORIK --- */}
        <div className="pt-4 border-t border-gray-700/50 flex flex-col md:flex-row gap-4 items-end">
          
          {/* Mall-väljare */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('template') || "Game Template"}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LayoutTemplate className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={currentTemplateId}
                  onChange={(e) => setCurrentTemplate(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
                >
                  {templateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {subscription.plan === 'premium' && (
                <button
                  onClick={onEditTemplate}
                  className="p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-yellow-500/50 rounded-xl transition-all text-gray-400 hover:text-yellow-400"
                  title={t('editTemplate')}
                >
                  <Edit size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Historik-knapp */}
          <Button
            variant="secondary"
            onClick={onShowHistory}
            icon={History}
            className="w-full md:w-auto"
          >
            {t('showPlayerHistory') || "History"}
          </Button>
        </div>

      </div>
    </Card>
  );
}