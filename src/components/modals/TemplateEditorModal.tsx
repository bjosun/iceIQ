import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, MoveUp, MoveDown, Type, Hash, Star } from 'lucide-react'; // Lade till Star-ikon
import { useLanguage } from '../../contexts/LanguageContext';
import { useTemplates } from '../../contexts/TemplateContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import toast from 'react-hot-toast';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateEditorModal({ isOpen, onClose }: TemplateEditorModalProps) {
  const { t } = useLanguage();
  const { currentTemplate, saveTemplate } = useTemplates();
  const [templateName, setTemplateName] = useState({ sv: '', en: '' });
  const [actions, setActions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Initialize with current template data
  useEffect(() => {
    if (currentTemplate && isOpen) {
      setTemplateName(currentTemplate.name);
      setActions([...currentTemplate.actions]);
    }
  }, [currentTemplate, isOpen]);

  const addAction = (type: 'positive' | 'negative') => {
    setActions([
      ...actions,
      {
        name: { sv: '', en: '' },
        points: type === 'positive' ? 1 : -1,
        type: type,
        isBonus: false // NYTT: Standard är false
      }
    ]);
  };

  const updateAction = (index: number, field: string, value: any) => {
    const updatedActions = [...actions];
    if (field.includes('.')) {
        const [parent, child] = field.split('.');
        updatedActions[index] = {
            ...updatedActions[index],
            [parent]: {
                ...updatedActions[index][parent],
                [child]: value
            }
        };
    } else {
        updatedActions[index] = {
            ...updatedActions[index],
            [field]: value
        };
    }
    setActions(updatedActions);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newActions = [...actions];
      [newActions[index], newActions[index - 1]] = [newActions[index - 1], newActions[index]];
      setActions(newActions);
    } else if (direction === 'down' && index < actions.length - 1) {
      const newActions = [...actions];
      [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
      setActions(newActions);
    }
  };

  const handleSave = async () => {
    if (!currentTemplate) return;
    
    if (!templateName.sv && !templateName.en) {
        toast.error("Ange ett namn på mallen");
        return;
    }

    setSaving(true);
    try {
      await saveTemplate(currentTemplate.id, {
        ...currentTemplate,
        name: templateName,
        actions
      });
      toast.success("Mall uppdaterad!");
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error("Kunde inte spara mallen");
    } finally {
      setSaving(false);
    }
  };

  // Mappa med original-index
  const indexedActions = actions.map((action, index) => ({ ...action, originalIndex: index }));
  const positiveActions = indexedActions.filter(a => a.type === 'positive');
  const negativeActions = indexedActions.filter(a => a.type === 'negative');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editTemplate')}
      size="xl"
    >
      <div className="p-6">
        {/* Template Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Input
            label={t('actionNameSv')}
            value={templateName.sv}
            onChange={(e) => setTemplateName({ ...templateName, sv: e.target.value })}
            placeholder="Mallsnamn (Svenska)"
            icon={Type}
          />
          <Input
            label={t('actionNameEn')}
            value={templateName.en}
            onChange={(e) => setTemplateName({ ...templateName, en: e.target.value })}
            placeholder="Template name (English)"
            icon={Type}
          />
        </div>

        {/* Actions Editor */}
        <div className="space-y-8">
          
          {/* Positive Actions */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-green-400">
                {t('positiveActions')} ({positiveActions.length})
              </h3>
              <Button
                variant="success"
                size="sm"
                onClick={() => addAction('positive')}
                icon={Plus}
              >
                Add Positive Action
              </Button>
            </div>
            <div className="space-y-4">
              {positiveActions.map((item) => (
                <ActionEditor
                  key={item.originalIndex}
                  action={item}
                  index={item.originalIndex}
                  onUpdate={updateAction}
                  onRemove={removeAction}
                  onMove={moveAction}
                  isFirst={item.originalIndex === 0}
                  isLast={item.originalIndex === actions.length - 1}
                />
              ))}
            </div>
          </Card>

          {/* Negative Actions */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-red-400">
                {t('negativeActions')} ({negativeActions.length})
              </h3>
              <Button
                variant="danger"
                size="sm"
                onClick={() => addAction('negative')}
                icon={Plus}
              >
                Add Negative Action
              </Button>
            </div>
            <div className="space-y-4">
              {negativeActions.map((item) => (
                <ActionEditor
                  key={item.originalIndex}
                  action={item}
                  index={item.originalIndex}
                  onUpdate={updateAction}
                  onRemove={removeAction}
                  onMove={moveAction}
                  isFirst={item.originalIndex === 0}
                  isLast={item.originalIndex === actions.length - 1}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            variant="success"
            onClick={handleSave}
            loading={saving}
            icon={Save}
          >
            {t('saveTemplate')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface ActionEditorProps {
  action: any;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

function ActionEditor({
  action,
  index,
  onUpdate,
  onRemove,
  onMove,
  isFirst,
  isLast
}: ActionEditorProps) {
  return (
    <div className="flex flex-col space-y-3 p-4 bg-gray-750 rounded-xl border border-gray-700">
      <div className="flex items-start space-x-4">
        {/* Move buttons */}
        <div className="flex flex-col space-y-1">
          <button onClick={() => onMove(index, 'up')} disabled={isFirst} className="p-1 rounded hover:bg-gray-700 disabled:opacity-30">
            <MoveUp size={16} className="text-gray-400" />
          </button>
          <button onClick={() => onMove(index, 'down')} disabled={isLast} className="p-1 rounded hover:bg-gray-700 disabled:opacity-30">
            <MoveDown size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Name inputs */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            value={action.name.sv}
            onChange={(e) => onUpdate(index, 'name.sv', e.target.value)}
            placeholder="Namn (SV)"
            className="text-sm"
          />
          <Input
            value={action.name.en}
            onChange={(e) => onUpdate(index, 'name.en', e.target.value)}
            placeholder="Name (EN)"
            className="text-sm"
          />
        </div>

        {/* Points input */}
        <div className="w-24">
          <Input
            type="number"
            value={action.points}
            onChange={(e) => onUpdate(index, 'points', Number(e.target.value))}
            placeholder="Pts"
            icon={Hash}
            className="text-sm"
          />
        </div>

        {/* Remove */}
        <button onClick={() => onRemove(index)} className="p-2 text-gray-500 hover:text-red-400 rounded-lg">
          <Trash2 size={18} />
        </button>
      </div>

      {/* --- NYTT: Bonus Toggle --- */}
      <div className="flex items-center justify-end border-t border-gray-700 pt-2 mt-1">
        <label className="flex items-center cursor-pointer space-x-2 group">
            <Star size={16} className={action.isBonus ? "text-yellow-400 fill-yellow-400" : "text-gray-500"} />
            <span className={`text-xs font-medium ${action.isBonus ? "text-yellow-400" : "text-gray-400"}`}>
                Markera som Bonus (Påverkas av viktning)
            </span>
            <input 
                type="checkbox" 
                className="sr-only"
                checked={action.isBonus || false} 
                onChange={(e) => onUpdate(index, 'isBonus', e.target.checked)}
            />
            <div className={`w-8 h-4 rounded-full transition-colors relative ${action.isBonus ? 'bg-yellow-500/50' : 'bg-gray-600'}`}>
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${action.isBonus ? 'translate-x-4' : ''}`} />
            </div>
        </label>
      </div>
    </div>
  );
}