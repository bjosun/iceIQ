import type { Plugin } from 'vite';
import type { Card } from '../src/lib/cardTypes.ts';

export const VIRTUAL_CARDS_ID: string;
export function validateCards(records: unknown[]): string[];
export function loadCardLibrary(root: string): Card[];
export function cardLibraryPlugin(): Plugin;
