import { useState } from 'react';
import { approvedCards } from 'virtual:iceiq-cards';
import { useLanguage } from '../../contexts/LanguageContext';
import RoutineStack from './RoutineStack';
import { pickNextPass } from '../../lib/cardEngine';
import { readCardProgress, writeCardProgress, markPassSeen } from '../../lib/cardProgress';
import { cardToStep } from '../../lib/cardSteps';

const knownIds = approvedCards.filter((c) => c.lang === 'sv' && c.surface !== 'app').map((c) => c.id);

interface PlayerRoutineProps {
  /** Spår som coachen föreslagit via spelarlänken. Saknas det gäller vanlig ordning. */
  suggestedTrack?: string | null;
}

export default function PlayerRoutine({ suggestedTrack = null }: PlayerRoutineProps) {
  const { language, t } = useLanguage();
  const [pass] = useState(() =>
    pickNextPass(
      approvedCards.filter((c) => c.lang === 'sv'),
      readCardProgress(knownIds),
      { focusTrack: suggestedTrack },
    ),
  );
  const cards = pass
    .map((card) => approvedCards.find((c) => c.id === card.id && c.lang === language))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const handleRoutineComplete = () => {
    writeCardProgress(markPassSeen(readCardProgress(knownIds), pass, new Date().toISOString()), knownIds);
  };

  if (!cards.length) return null;

  const steps = cards.map((card) =>
    cardToStep(card, () =>
      document.getElementById('breathing-section')?.scrollIntoView({ behavior: 'smooth' }),
    ),
  );

  return (
    <div className="bg-gray-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">{cards[0].sectionTitle}</h2>
      <RoutineStack
        steps={steps}
        backLabel={t('routines.nightBeforeGame.back')}
        nextLabel={t('routines.nightBeforeGame.next')}
        doneLabel={t('routines.nightBeforeGame.done')}
        onComplete={handleRoutineComplete}
      />
    </div>
  );
}
