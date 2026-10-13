import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { defaultTemplates } from '../../contexts/TemplateContext';
import { RINGS, awardsForPosition, earnedAwards, isPosition, Position, TemplateNames } from '../../utils/awards';
import AwardGem, { GemStyle, readGemStyle, saveGemStyle } from './AwardGem';

function namesFor(position: Position): TemplateNames {
  const actions = defaultTemplates[position]?.actions ?? [];
  return {
    negative: new Set(actions.filter((a) => a.type === 'negative').map((a) => a.name.en)),
    positive: new Set(actions.filter((a) => a.type !== 'negative').map((a) => a.name.en)),
  };
}

// Utmärkelsehylla: det man har i färg, resten dämpat. Visar bara det som
// gäller spelarens position, och jämför aldrig med andra spelare.
export default function AwardShelf({
  games,
  templateId,
}: {
  games: { template?: string; counts?: Record<string, number> }[];
  templateId: string;
}) {
  const { t } = useLanguage();
  const [style, setStyle] = useState<GemStyle>(readGemStyle);

  // Egna mallar har inga stabila aktionsnamn att matcha på — då visar vi inget.
  if (!isPosition(templateId)) return null;

  const earned = earnedAwards(games, namesFor);
  const awards = awardsForPosition(templateId);

  const pick = (next: GemStyle) => {
    setStyle(next);
    saveGemStyle(next);
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h3 className="text-sm font-semibold text-gray-300">{t('awards.title')}</h3>
        <div className="flex rounded-full border border-gray-700 overflow-hidden text-xs">
          {(['kid', 'pro'] as GemStyle[]).map((s) => (
            <button
              key={s}
              onClick={() => pick(s)}
              className={`px-3 py-1 ${style === s ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {t(`awards.style.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {RINGS.map((ring) => {
        const inRing = awards.filter((a) => a.ring === ring);
        if (inRing.length === 0) return null;
        return (
          <div key={ring} className="mb-5">
            <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">{t(`awards.rings.${ring}`)}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {inRing.map((a) => {
                const count = earned[a.id] ?? 0;
                const sub = t(`awards.${a.id}.sub`);
                return (
                  <div
                    key={a.id}
                    className={`rounded-xl p-3 text-center border ${
                      count > 0 ? 'bg-gray-800/60 border-gray-600' : 'bg-gray-900/40 border-gray-800'
                    }`}
                  >
                    <div className="flex justify-center relative">
                      <AwardGem id={a.id} ring={a.ring} style={style} locked={count === 0} size={64} />
                      {count === 0 && <Lock size={14} className="absolute bottom-1 right-1/3 text-gray-500" />}
                    </div>
                    <p className={`text-xs font-semibold mt-1 ${count > 0 ? 'text-white' : 'text-gray-500'}`}>
                      {t(`awards.${a.id}.name`)}
                      {count > 1 ? ` ×${count}` : ''}
                    </p>
                    {sub && sub !== `awards.${a.id}.sub` && (
                      <p className="text-[10px] italic text-gray-500">{sub}</p>
                    )}
                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">{t(`awards.${a.id}.desc`)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
