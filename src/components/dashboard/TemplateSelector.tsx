import React from 'react';
import { FileText, Edit } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTemplates } from '../../contexts/TemplateContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import Button from '../ui/Button';

interface TemplateSelectorProps {
  onEditTemplate: () => void;
}

export default function TemplateSelector({ onEditTemplate }: TemplateSelectorProps) {
  const { t, language } = useLanguage();
  const { templates, currentTemplateId, setCurrentTemplate, currentTemplate } = useTemplates();
  const { subscription } = useSubscription();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="text-cyan-400 mr-2" size={20} />
          <h3 className="text-lg font-semibold text-white">{t('template')}</h3>
        </div>
        
        {subscription.plan === 'premium' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onEditTemplate}
            icon={Edit}
          >
            {t('editTemplate')}
          </Button>
        )}
      </div>

      <div className="relative">
        <select
          value={currentTemplateId}
          onChange={(e) => setCurrentTemplate(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none"
        >
          {Object.entries(templates).map(([id, template]) => (
            <option key={id} value={id}>
              {template.name[language]}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Template Description */}
      {currentTemplate && (
        <div className="bg-gray-800/50 rounded-xl p-4">
          <p className="text-sm text-gray-300">
            <span className="font-medium text-cyan-400">{currentTemplate.name[language]}</span>{' '}
            template loaded with {currentTemplate.actions.length} actions
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs">
              {currentTemplate.actions.filter(a => a.type === 'positive').length} positive
            </span>
            <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs">
              {currentTemplate.actions.filter(a => a.type === 'negative').length} negative
            </span>
          </div>
        </div>
      )}

      {/* Upgrade Prompt */}
      {subscription.plan === 'free' && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-yellow-400 text-sm">
            🔒 {t('upgradeCTA')} {t('premiumFeature4')}
          </p>
        </div>
      )}
    </div>
  );
}