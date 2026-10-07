import { useEffect, useState } from 'react';
import { Trophy, ArrowRight } from 'lucide-react';
import Modal from '../ui/Modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { prefersReducedMotion, tapFeedback } from '../../utils/feedback';

interface MatchSummaryRevealProps {
  isOpen: boolean;
  onContinue: () => void;
  onClose: () => void;
  playerName: string;
  points: number;
  actions: { label: string; count: number }[];
  /** Färdigöversatt en-radare, eller undefined. */
  highlight?: string;
  stats?: { games: number; avgPoints: number; bestGame: number };
}

// Spelar upp resultatet i stället för att visa en tabell: poängen räknas upp,
// höjdpunkterna glider in en i taget. Jämför bara med spelarens EGET snitt —
// aldrig med andra spelare (poängen sätts av föräldrar och är subjektiva).
const MILESTONES = new Set([1, 5, 10, 25, 50, 100]);

function useCountUp(target: number, run: boolean, durationMs = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion() || target <= 0) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      // ease-out: snabbt in, mjuk landning
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, durationMs]);
  return value;
}

export default function MatchSummaryReveal({
  isOpen, onContinue, onClose, playerName, points, actions, highlight, stats,
}: MatchSummaryRevealProps) {
  const { t } = useLanguage();
  const shown = useCountUp(points, isOpen);

  // Haptisk bekräftelse när poängen landat.
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => tapFeedback('big'), prefersReducedMotion() ? 0 : 950);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  const top = [...actions].sort((a, b) => b.count - a.count).slice(0, 3);

  // Snittet FÖRE den här matchen; stats gäller säsongen till och med matchen.
  let delta: number | null = null;
  if (stats && stats.games > 1) {
    const prevAvg = (stats.avgPoints * stats.games - points) / (stats.games - 1);
    const d = Math.round(points - prevAvg);
    if (d !== 0) delta = d;
  }
  const milestone = stats && MILESTONES.has(stats.games) ? stats.games : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('summary.title')} size="md">
      <div className="p-6 text-center">
        <p className="text-sm text-gray-400 mb-1">{playerName}</p>
        <p className="text-xs uppercase tracking-widest text-cyan-400 mb-2">{t('summary.points')}</p>
        <p className="text-7xl font-black text-white tabular-nums mb-3">{shown}</p>

        {delta !== null && (
          <p
            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 animate-slide-in motion-reduce:animate-none ${
              delta > 0 ? 'bg-green-500/15 text-green-300' : 'bg-gray-700/60 text-gray-300'
            }`}
            style={{ animationDelay: '0.9s' }}
          >
            {t('summary.vsAverage', { delta: `${delta > 0 ? '+' : ''}${delta}` })}
          </p>
        )}

        {highlight && (
          <p
            className="text-lg text-gray-100 font-medium mb-5 animate-slide-in motion-reduce:animate-none"
            style={{ animationDelay: '1.05s' }}
          >
            {highlight}
          </p>
        )}

        {top.length > 0 && (
          <div className="mb-5">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">{t('summary.highlights')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {top.map((a, i) => (
                <span
                  key={a.label}
                  className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-sm text-white animate-slide-in motion-reduce:animate-none"
                  style={{ animationDelay: `${1.2 + i * 0.15}s` }}
                >
                  {a.label} <span className="font-black text-cyan-300">×{a.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {milestone !== null && (
          <p
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/15 text-yellow-300 text-sm font-semibold mb-5 animate-slide-in motion-reduce:animate-none"
            style={{ animationDelay: '1.7s' }}
          >
            <Trophy size={14} /> {t('summary.milestone', { count: milestone })}
          </p>
        )}

        <button
          onClick={onContinue}
          className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {t('summary.continue')} <ArrowRight size={18} />
        </button>
      </div>
    </Modal>
  );
}
