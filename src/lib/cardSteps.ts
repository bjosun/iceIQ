import { Backpack, PenLine, Moon, Check, type LucideIcon } from 'lucide-react';
import type { Card } from './cardTypes.ts';
import type { RoutineStep } from '../components/routines/RoutineStack';

const ICONS: Record<Card['icon'], LucideIcon> = {
  backpack: Backpack,
  'pen-line': PenLine,
  moon: Moon,
  check: Check,
};

export function cardToStep(card: Card, onBreathing: () => void): RoutineStep {
  const step: RoutineStep = { icon: ICONS[card.icon], title: card.title };
  const body = card.body && card.reflect ? `${card.body}\n\n${card.reflect}` : card.body ?? card.reflect;
  if (body) step.body = body;
  if (card.input) step.input = { placeholder: card.input.placeholder, errorText: card.input.errorText };
  if (card.action?.kind === 'breathing') step.action = { label: card.action.label, onClick: onBreathing };
  if (card.reward) {
    const { withAnswer, empty } = card.reward;
    step.rewardBody = (answer) =>
      answer ? withAnswer.replace(/\{answer\}/g, () => answer) : empty;
  }
  if (card.source) step.attribution = `${card.source.person}, ${card.source.work} (${card.source.year})`;
  if (card.footnote) step.footnote = card.footnote;
  return step;
}
