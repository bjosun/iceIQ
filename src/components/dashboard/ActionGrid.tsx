import React, { useEffect, useRef, useState } from 'react';
import { Minus, Sun, Sparkles, Star, Plus, Trash2, Lock } from 'lucide-react';
import NoSleep from 'nosleep.js';
import toast from 'react-hot-toast';
import { useTemplates, defaultTemplates } from '../../contexts/TemplateContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { isNativeApp } from '../../utils/platform';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { loadExtras, loadFocus, loadHidden, resolveGrid, saveExtras, saveFocus, saveHidden, shortName } from '../../utils/gridLayout';
import { BIG_POINTS, effectsEnabled, setEffectsEnabled, tapFeedback } from '../../utils/feedback';

interface ActionGridProps {
  actionCounts: Record<string, number>;
  onCountChange: (counts: Record<string, number>) => void;
  onUpgrade?: () => void;
}

// Fasta konfettibitar (inget slumpande vid render, så effekten är densamma
// varje gång och inte hoppar vid omritning).
const CONFETTI = [
  { dx: -46, dy: -52, rot: -160, color: '#4ade80' }, { dx: 8, dy: -64, rot: 120, color: '#22d3ee' },
  { dx: 52, dy: -44, rot: 200, color: '#facc15' }, { dx: -58, dy: -10, rot: -90, color: '#22d3ee' },
  { dx: 60, dy: -8, rot: 140, color: '#4ade80' }, { dx: -34, dy: 34, rot: 220, color: '#facc15' },
  { dx: 30, dy: 40, rot: -200, color: '#fff' }, { dx: -12, dy: -40, rot: 80, color: '#fff' },
  { dx: 22, dy: -30, rot: -120, color: '#4ade80' }, { dx: -50, dy: 16, rot: 160, color: '#22d3ee' },
];

// Byggd för användning vid rinken: hela kortet är tryckytan (+1),
// minus-knappen i hörnet ångrar. Stora ytor, direkt feedback, ingen
// scroll mitt i registreringen.
export default function ActionGrid({ actionCounts, onCountChange, onUpgrade }: ActionGridProps) {
  const { currentTemplate, ownActions, addOwnAction, removeOwnAction } = useTemplates();
  const { isPremium } = useSubscription();
  const { t, language } = useLanguage();

  // "Håll skärmen tänd" — avstängd som standard (samma mönster som
  // receptsajter). Webbläsare utan Wake Lock-API (äldre iOS, hemskärms-appar,
  // in-app-webbläsare) får NoSleep.js-fallbacken: en osynlig video som spelas
  // upp. Den måste startas direkt i klick-handlern, därför skapas instansen
  // vid mount och enable() anropas i handleToggle.
  const nativeWakeLock = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const [keepAwake, setKeepAwake] = useState(false);
  const wakeLockRef = useRef<any>(null);
  const noSleepRef = useRef<NoSleep | null>(null);

  // Effekter vid tryck: en flytande "+N" och för stora händelser (mål) även
  // konfetti. Rensas efter en stund så de inte staplas i DOM:en.
  // Dagens fokus: vilka aktioner som ligger på de lediga platserna i rutnätet.
  // Sparas per mall på enheten (se utils/gridLayout.ts).
  const [focusNames, setFocusNames] = useState<string[] | null>(null);
  const [showMore, setShowMore] = useState(false);
  const templateId = currentTemplate?.id;
  const [extraNames, setExtraNames] = useState<string[]>([]);
  const [hiddenNames, setHiddenNames] = useState<string[]>([]);
  const [ownName, setOwnName] = useState('');
  const [ownType, setOwnType] = useState<'positive' | 'negative'>('positive');
  const [ownPoints, setOwnPoints] = useState(1);
  const [savingOwn, setSavingOwn] = useState(false);
  useEffect(() => {
    setFocusNames(templateId ? loadFocus(templateId) : null);
    setExtraNames(templateId ? loadExtras(templateId) : []);
    setHiddenNames(templateId ? loadHidden(templateId) : []);
  }, [templateId]);

  const [effects, setEffects] = useState<boolean>(() => effectsEnabled());
  const [fx, setFx] = useState<Record<string, { id: number; big: boolean; text: string }>>({});
  const fxCounter = useRef(0);

  useEffect(() => {
    if (nativeWakeLock) return;
    noSleepRef.current = new NoSleep();
    return () => {
      noSleepRef.current?.disable();
      noSleepRef.current = null;
    };
  }, [nativeWakeLock]);

  useEffect(() => {
    if (!nativeWakeLock || !keepAwake) return;
    const nav = navigator as any;
    let released = false;

    const requestLock = () => {
      nav.wakeLock
        .request('screen')
        .then((lock: any) => {
          if (released) lock.release?.();
          else wakeLockRef.current = lock;
        })
        .catch(() => {
          /* Nekas i bakgrundsflik eller av batterisparläge — registreringen fungerar ändå. */
        });
    };

    requestLock();

    // Låset släpps automatiskt när fliken göms — måste begäras igen när
    // man kommer tillbaka (t.ex. efter att ha svarat i telefonen mitt i matchen).
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestLock();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      wakeLockRef.current?.release?.();
      wakeLockRef.current = null;
    };
  }, [keepAwake, nativeWakeLock]);

  const handleToggle = async () => {
    if (keepAwake) {
      noSleepRef.current?.disable();
      setKeepAwake(false);
      return;
    }
    if (!nativeWakeLock) {
      try {
        await noSleepRef.current?.enable();
      } catch {
        toast.error(t('keepScreenOnFailed'));
        return;
      }
    }
    setKeepAwake(true);
  };

  if (!currentTemplate) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-400">Loading template...</p>
          </div>
        </Card>
      </div>
    );
  }

  const positiveActions = currentTemplate.actions.filter(a => a.type === 'positive');
  const negativeActions = currentTemplate.actions.filter(a => a.type === 'negative');

  // Fast rutnät (tolv pluss, sex minus) när mallen har en layout, annars hela
  // listan som förut (egna mallar).
  const layout = currentTemplate.layout ?? defaultTemplates[currentTemplate.id]?.layout;
  const grid = resolveGrid(currentTemplate, layout, focusNames, extraNames, hiddenNames);

  const writeExtras = (next: string[]) => {
    setExtraNames(next);
    saveExtras(currentTemplate.id, next);
  };
  const writeHidden = (next: string[]) => {
    setHiddenNames(next);
    saveHidden(currentTemplate.id, next);
  };

  // Visa eller dölj en knapp. Standardknappar döljs (och visas igen) via
  // hiddenNames, övriga läggs till eller tas bort via extraNames. Det här är
  // bara en vy: aktionerna finns kvar i mallen och sparad statistik rörs inte.
  const toggleButton = (en: string, shown: boolean) => {
    if (!grid) return;
    const inBase = grid.baseNames.has(en);
    if (shown) {
      if (inBase) writeHidden([...hiddenNames, en]);
      else writeExtras(extraNames.filter((n) => n !== en));
    } else if (inBase) {
      writeHidden(hiddenNames.filter((n) => n !== en));
    } else {
      writeExtras([...extraNames, en]);
    }
  };

  const resetButtons = () => {
    writeHidden([]);
    writeExtras([]);
  };

  const ownList = ownActions[currentTemplate.id] || [];
  const MAX_OWN = 12;

  const createOwn = async () => {
    const name = ownName.trim().slice(0, 40);
    if (!name) return;
    const taken = currentTemplate.actions.some((a) => a.name.en.toLowerCase() === name.toLowerCase());
    if (taken) {
      toast.error(t('actionGrid.ownDuplicate'));
      return;
    }
    if (ownList.length >= MAX_OWN) {
      toast.error(t('actionGrid.ownLimit', { max: MAX_OWN }));
      return;
    }
    const size = Math.min(99, Math.max(1, Math.round(Math.abs(ownPoints)) || 1));
    setSavingOwn(true);
    try {
      await addOwnAction({ name: { sv: name, en: name }, points: ownType === 'positive' ? size : -size, type: ownType });
      writeExtras([...extraNames, name]);
      setOwnName('');
      setOwnPoints(1);
    } catch {
      toast.error(t('actionGrid.ownFailed'));
    } finally {
      setSavingOwn(false);
    }
  };

  const deleteOwn = async (en: string) => {
    try {
      await removeOwnAction(en);
      writeExtras(extraNames.filter((n) => n !== en));
      writeHidden(hiddenNames.filter((n) => n !== en));
    } catch {
      toast.error(t('actionGrid.ownFailed'));
    }
  };

  const chooseFocus = (slot: number, en: string) => {
    if (!grid) return;
    const next: string[] = Array.from({ length: grid.slots }, (_, i) => grid.focusChosen[i] ?? '');
    next[slot] = en;
    const cleaned = next.filter(Boolean);
    setFocusNames(cleaned);
    saveFocus(currentTemplate.id, cleaned);
  };

  const handleEffectsToggle = () => {
    setEffectsEnabled(!effects);
    setEffects(!effects);
  };

  const playFx = (key: string, points: number, positive: boolean) => {
    const big = positive && points >= BIG_POINTS;
    const { visual } = tapFeedback(big ? 'big' : positive ? 'plus' : 'negative');
    if (!visual) return;
    const id = ++fxCounter.current;
    setFx(prev => ({ ...prev, [key]: { id, big, text: `${points > 0 ? '+' : ''}${points}` } }));
    window.setTimeout(() => {
      setFx(prev => (prev[key]?.id === id ? (({ [key]: _gone, ...rest }) => rest)(prev) : prev));
    }, 950);
  };

  const updateCount = (actionName: { sv: string; en: string }, change: number) => {
    const key = JSON.stringify(actionName);
    const current = actionCounts[key] || 0;
    const newCount = Math.max(0, current + change);

    const newCounts = { ...actionCounts };
    if (newCount === 0) {
      delete newCounts[key];
    } else {
      newCounts[key] = newCount;
    }

    onCountChange(newCounts);
  };

  const calculatePoints = (actions: typeof positiveActions) => {
    return actions.reduce((total, action) => {
      const key = JSON.stringify(action.name);
      const count = actionCounts[key] || 0;
      return total + (count * action.points);
    }, 0);
  };

  const renderTiles = (
    actions: typeof positiveActions,
    isPositive: boolean,
    opts: { compact?: boolean; gridClass?: string; extra?: React.ReactNode; focusStar?: Set<string> } = {},
  ) => (
    <div className={opts.gridClass ?? (opts.compact
      ? 'grid grid-cols-3 gap-2'
      : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3')}>
      {actions.map((action, index) => {
        const key = JSON.stringify(action.name);
        const count = actionCounts[key] || 0;
        const fullName = action.name[language] || action.name.en;
        const actionName = opts.compact ? shortName(action, language) : fullName;
        const isFocus = !!opts.focusStar?.has(action.name.en);
        const activeClasses = isPositive
          ? 'border-green-500/60 bg-green-500/10'
          : 'border-red-500/60 bg-red-500/10';
        const countColor = isPositive ? 'text-green-400' : 'text-red-400';

        return (
          <div key={index} className="relative">
            <button
              onClick={() => {
                updateCount(action.name, 1);
                playFx(key, action.points, isPositive);
              }}
              title={fullName}
              className={`w-full ${opts.compact ? 'min-h-[84px] p-2' : 'min-h-[96px] p-3'} rounded-xl border text-left flex flex-col justify-between gap-2 transition-all active:scale-[0.96] touch-manipulation select-none ${
                count > 0
                  ? activeClasses
                  : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
              }`}
            >
              <p className={`font-semibold text-white leading-tight pr-6 ${opts.compact ? 'text-xs' : 'text-sm leading-snug pr-7'}`}>
                {isFocus && <Star size={10} className="inline -mt-0.5 mr-1 text-yellow-400 fill-yellow-400" aria-label={t('actionGrid.focusTitle')} />}
                {actionName}
              </p>
              <div className="flex items-end justify-between">
                <span className="text-xs text-gray-400">
                  {action.points > 0 ? '+' : ''}{action.points} p
                </span>
                <span className={`${opts.compact ? 'text-2xl' : 'text-3xl'} font-black leading-none ${count > 0 ? countColor : 'text-gray-600'}`}>
                  <span key={count} className="inline-block animate-count-pop motion-reduce:animate-none">{count}</span>
                </span>
              </div>
            </button>

            {fx[key] && (
              <div key={fx[key].id} className="pointer-events-none absolute inset-0" aria-hidden="true">
                {fx[key].big && (
                  <div className="absolute inset-0 rounded-xl animate-goal-flash motion-reduce:animate-none" />
                )}
                <span
                  className={`absolute left-1/2 top-2 -translate-x-1/2 font-black text-lg animate-float-up ${
                    isPositive ? 'text-green-300' : 'text-red-300'
                  }`}
                >
                  {fx[key].text}
                </span>
                {fx[key].big && CONFETTI.map((c, i) => (
                  <span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-2 w-1.5 rounded-sm animate-confetti"
                    style={{
                      backgroundColor: c.color,
                      ['--dx' as string]: `${c.dx}px`,
                      ['--dy' as string]: `${c.dy}px`,
                      ['--rot' as string]: `${c.rot}deg`,
                    }}
                  />
                ))}
              </div>
            )}

            {count > 0 && (
              <button
                onClick={() => updateCount(action.name, -1)}
                aria-label={`${fullName} -1`}
                className={`absolute ${opts.compact ? 'top-1 right-1 w-7 h-7' : 'top-2 right-2 w-8 h-8'} bg-gray-800/90 hover:bg-gray-700 border border-gray-600 rounded-full flex items-center justify-center text-gray-300 transition-colors touch-manipulation`}
              >
                <Minus size={15} />
              </button>
            )}
          </div>
        );
      })}
      {opts.extra}
    </div>
  );

  // Tom fokusplats: öppnar valet.
  const emptySlotTiles = grid
    ? Array.from({ length: grid.emptySlots }, (_, i) => (
        <button
          key={`empty-${i}`}
          onClick={() => setShowMore(true)}
          className="min-h-[84px] p-2 rounded-xl border border-dashed border-gray-600 text-gray-400 text-xs flex flex-col items-center justify-center gap-1 touch-manipulation"
        >
          <Plus size={16} />
          {t('actionGrid.pickFocus')}
        </button>
      ))
    : null;

  // "Lägg till knapp": öppnar valet där spelaren själv väljer fler aktioner.
  const addTile = grid ? (
    <button
      key="add-button"
      onClick={() => setShowMore(true)}
      className="min-h-[84px] p-2 rounded-xl border border-dashed border-gray-600 text-gray-400 text-xs flex flex-col items-center justify-center gap-1 touch-manipulation"
    >
      <Plus size={16} />
      {t('actionGrid.addButton')}
    </button>
  ) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="lg:col-span-2 flex items-center justify-between gap-3 px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl">
        <div className="flex items-center gap-2 min-w-0">
          <Sun size={18} className={keepAwake ? 'text-yellow-400' : 'text-gray-500'} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">{t('keepScreenOn')}</p>
            <p className="text-xs text-gray-400 truncate">{t('keepScreenOnHint')}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={keepAwake}
          aria-label={t('keepScreenOn')}
          onClick={handleToggle}
          className={`relative shrink-0 w-12 h-7 rounded-full transition-colors touch-manipulation ${
            keepAwake ? 'bg-cyan-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
              keepAwake ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="lg:col-span-2 flex items-center justify-between gap-3 px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={18} className={effects ? 'text-cyan-400' : 'text-gray-500'} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">{t('effects.label')}</p>
            <p className="text-xs text-gray-400 truncate">{t('effects.hint')}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={effects}
          aria-label={t('effects.label')}
          onClick={handleEffectsToggle}
          className={`relative shrink-0 w-12 h-7 rounded-full transition-colors touch-manipulation ${
            effects ? 'bg-cyan-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
              effects ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Positive Actions */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-green-400">
            {t('positiveActions')}
          </h2>
          <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm">
            +{calculatePoints(positiveActions)} pts
          </span>
        </div>
        {grid
          ? renderTiles(grid.positive, true, {
              compact: true,
              extra: <>{emptySlotTiles}{addTile}</>,
              focusStar: new Set(grid.focusChosen),
            })
          : renderTiles(positiveActions, true)}
      </Card>

      {/* Negative Actions */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-red-400">
            {t('negativeActions')}
          </h2>
          <span className="px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-sm">
            {calculatePoints(negativeActions)} pts
          </span>
        </div>
        {grid ? renderTiles(grid.negative, false, { compact: true, extra: addTile }) : renderTiles(negativeActions, false)}
      </Card>

      {grid && (
        <Modal
          isOpen={showMore}
          onClose={() => setShowMore(false)}
          title={t('actionGrid.moreTitle')}
          size="lg"
        >
          <div className="space-y-6">
            {grid.slots > 0 && (
              <div>
                <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-1.5 mb-1">
                  <Star size={14} className="fill-yellow-400" /> {t('actionGrid.focusTitle')}
                </h3>
                <p className="text-xs text-gray-400 mb-3">{t('actionGrid.focusHint')}</p>
                <div className="space-y-2">
                  {Array.from({ length: grid.slots }, (_, i) => (
                    <select
                      key={i}
                      value={grid.focusChosen[i] ?? ''}
                      onChange={(e) => chooseFocus(i, e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white"
                    >
                      <option value="">{t('actionGrid.noFocus')}</option>
                      {grid.focusCandidates.map((a) => (
                        <option key={a.name.en} value={a.name.en}>
                          {a.name[language] || a.name.en} ({a.points > 0 ? '+' : ''}{a.points})
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400">{t('actionGrid.customizeHint')}</p>

            {(['positive', 'negative'] as const).map((type) => {
              const shownNames = new Set([...grid.positive, ...grid.negative].map((a) => a.name.en));
              const rows = currentTemplate.actions.filter((a) => a.type === type);
              if (rows.length === 0) return null;
              return (
                <div key={type}>
                  <h3 className={`text-sm font-bold mb-2 ${type === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                    {type === 'positive' ? t('positiveActions') : t('negativeActions')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rows.map((a) => {
                      const on = shownNames.has(a.name.en);
                      const own = ownList.some((o) => o.name.en === a.name.en);
                      return (
                        <div key={a.name.en} className="flex gap-1">
                          <button
                            onClick={() => toggleButton(a.name.en, on)}
                            aria-pressed={on}
                            className={`flex-1 flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-left text-sm touch-manipulation ${
                              on ? 'border-cyan-500/60 bg-cyan-500/10 text-white' : 'border-gray-700 bg-gray-800/60 text-gray-400'
                            }`}
                          >
                            <span>
                              {a.name[language] || a.name.en} ({a.points > 0 ? '+' : ''}{a.points})
                              {own && <span className="ml-1.5 text-[10px] uppercase text-yellow-400">{t('actionGrid.ownBadge')}</span>}
                            </span>
                            <span className={`shrink-0 text-xs font-bold ${on ? 'text-cyan-300' : 'text-gray-500'}`}>
                              {on ? t('actionGrid.added') : t('actionGrid.add')}
                            </span>
                          </button>
                          {own && (
                            <button
                              onClick={() => deleteOwn(a.name.en)}
                              aria-label={`${t('actionGrid.ownDelete')}: ${a.name[language] || a.name.en}`}
                              className="px-3 rounded-lg border border-gray-700 bg-gray-800/60 text-gray-400 hover:text-red-400 touch-manipulation"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {(hiddenNames.length > 0 || extraNames.length > 0) && (
              <button
                onClick={resetButtons}
                className="w-full py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm font-semibold touch-manipulation hover:border-gray-500"
              >
                {t('actionGrid.reset')}
              </button>
            )}

            {/* Egna knappar: Premium (Elite och säsongspass ingår). I iPhone-appen finns inget köpflöde, så gratiskonton ser ingen låst ruta där. */}
            {(isPremium || !isNativeApp) && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3">
                <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                  {isPremium ? <Plus size={14} /> : <Lock size={14} />} {t('actionGrid.ownTitle')}
                </h3>
                {isPremium ? (
                  <>
                    <input
                      value={ownName}
                      onChange={(e) => setOwnName(e.target.value)}
                      maxLength={40}
                      placeholder={t('actionGrid.ownName')}
                      aria-label={t('actionGrid.ownName')}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white"
                    />
                    <div className="flex gap-2">
                      {(['positive', 'negative'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setOwnType(type)}
                          aria-pressed={ownType === type}
                          className={`flex-1 py-2 rounded-lg border text-sm font-semibold touch-manipulation ${
                            ownType === type
                              ? type === 'positive' ? 'border-green-500/60 bg-green-500/10 text-green-300' : 'border-red-500/60 bg-red-500/10 text-red-300'
                              : 'border-gray-700 text-gray-400'
                          }`}
                        >
                          {type === 'positive' ? t('actionGrid.ownPositive') : t('actionGrid.ownNegative')}
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={ownPoints}
                        onChange={(e) => setOwnPoints(Number(e.target.value))}
                        aria-label={t('actionGrid.ownPoints')}
                        className="w-20 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-center"
                      />
                    </div>
                    <button
                      onClick={createOwn}
                      disabled={savingOwn || !ownName.trim()}
                      className="w-full py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black text-sm font-bold touch-manipulation"
                    >
                      {t('actionGrid.ownCreate')}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-400">{t('actionGrid.ownLocked')}</p>
                    {onUpgrade && (
                      <button
                        onClick={() => { setShowMore(false); onUpgrade(); }}
                        className="w-full py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold touch-manipulation"
                      >
                        {t('upgradeToPremium')}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => setShowMore(false)}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              {t('actionGrid.done')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
