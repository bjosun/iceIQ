import { useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';

// Generisk berättar-kortstack för rutiner: förloppssegment i toppen, ett
// koncept per kort, tap för att gå vidare. Samma mönster som Deepstashs
// "bite-sized cards" — men med en skillnad: ETT kort kan vara interaktivt
// (input) och ETT kort (belöningskortet) kan spegla tillbaka svaret. Det
// löser personalisering utan att någon AI skriver eller improviserar
// rutinens innehåll — texten är fast, granskad copy (se translations.ts),
// bara svaret som visas tillbaka är spelarens eget.
//
// Byggd generisk med avsikt: nästa rutin (t.ex. sömnrutin, uppvärmning)
// blir en ny steps-array, inte en ny komponent.
export interface RoutineStep {
  icon: LucideIcon;
  title: string;
  body?: string;
  /** Textfält på det här kortet — svaret hålls i RoutineStack, inte i steget. */
  input?: { placeholder: string; errorText: string };
  /** Valfri knapp på kortet, t.ex. "kör andningsövningen" som scrollar dit. */
  action?: { label: string; onClick: () => void };
  /**
   * Sista kortets text, byggd av det tidigare ihopsamlade svaret. Får tom
   * sträng om inget svar gavs (inputsteget kan i teorin hoppas över om
   * det någon gång blir valfritt) — funktionen avgör själv fallback-text.
   */
  rewardBody?: (answer: string) => string;
  /** Litet, tonat finstilt-tillägg — t.ex. en trygghetsrad om att prata med en vuxen. */
  footnote?: string;
}

interface RoutineStackProps {
  steps: RoutineStep[];
  backLabel: string;
  nextLabel: string;
  doneLabel: string;
  /**
   * Anropas EN gång, när spelaren först når sista kortet — det är då
   * rutinen faktiskt är gjord. Bakåt och framåt igen loggar inte om
   * (completedRef), så en bläddring fram och tillbaka inte dubbelloggar.
   */
  onComplete?: () => void;
  /** Visas på sista kortet, t.ex. streak-raden. Renderas bara när satt. */
  completionNote?: string;
}

export default function RoutineStack({
  steps, backLabel, nextLabel, doneLabel, onComplete, completionNote,
}: RoutineStackProps) {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const completedRef = useRef(false);

  const step = steps[i];
  const isLast = i === steps.length - 1;
  const Icon = step.icon;

  const goNext = () => {
    if (step.input) {
      const trimmed = draft.trim();
      if (!trimmed) {
        setError(step.input.errorText);
        return;
      }
      setAnswer(trimmed);
    }
    setError('');
    if (!isLast) {
      const next = i + 1;
      setI(next);
      if (next === steps.length - 1 && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }
  };

  const goBack = () => {
    setError('');
    if (i > 0) setI(i - 1);
  };

  return (
    <div>
      <div className="flex gap-1.5 mb-4" role="progressbar" aria-valuenow={i + 1} aria-valuemin={1} aria-valuemax={steps.length}>
        {steps.map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 h-1 rounded-full transition-colors ${idx <= i ? 'bg-cyan-400' : 'bg-white/10'}`}
          />
        ))}
      </div>

      <div className="flex flex-col items-center text-center gap-3 min-h-[220px] justify-center">
        <div className="p-2.5 bg-cyan-500/10 rounded-full border border-cyan-500/20">
          <Icon className="text-cyan-300" size={22} />
        </div>
        <h3 className="text-white font-semibold text-base leading-snug">{step.title}</h3>
        {step.body && <p className="text-gray-400 text-sm leading-relaxed max-w-xs">{step.body}</p>}
        {step.rewardBody && (
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">{step.rewardBody(answer)}</p>
        )}
        {isLast && completionNote && (
          <p className="text-cyan-300 text-sm font-semibold">{completionNote}</p>
        )}
        {step.footnote && (
          <p className="text-gray-500 text-xs italic leading-relaxed max-w-xs">{step.footnote}</p>
        )}

        {step.input && (
          <div className="w-full max-w-xs">
            <input
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError('');
              }}
              placeholder={step.input.placeholder}
              className="w-full bg-black/30 border border-white/10 text-white text-sm rounded-xl py-2.5 px-4 mt-1 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-gray-600"
            />
            {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
          </div>
        )}

        {step.action && (
          <button
            onClick={step.action.onClick}
            className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold underline underline-offset-2 mt-1"
          >
            {step.action.label}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-5">
        <button
          onClick={goBack}
          className={`text-xs text-gray-500 hover:text-gray-300 transition-colors ${i === 0 ? 'invisible' : ''}`}
        >
          {backLabel}
        </button>
        <button
          onClick={goNext}
          disabled={isLast}
          className="px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-default text-black text-xs font-bold transition-colors"
        >
          {isLast ? doneLabel : nextLabel}
        </button>
      </div>
    </div>
  );
}
