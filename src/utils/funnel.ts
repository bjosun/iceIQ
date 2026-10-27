// Egna, personuppgiftsfria milstolpar i första användningen — för att kunna se
// VAR i kedjan nya konton tar slut, utan tredjepartsverktyg (appen hanterar
// barns data och håller allt inom EU).
//
// Varje steg sparas högst en gång, som en tidsstämp på användarens eget
// dokument (funnel.<steg>). Ingen händelseström, ingen lagring på enheten,
// och inget innehåll: bara att steget nåtts och när. Läses i veckorapporten
// (functions/index.js, runOpsDigest).
//
// Mätning får aldrig störa appen: alla fel sväljs.

import { firestore } from '../services/firestore';

export type FunnelStep =
  | 'dashboardViewed'    // öppnade dashboarden
  | 'addPlayerOpened'    // öppnade "lägg till spelare"
  | 'demoActionTapped'   // tryckte in en aktion i exempelläget
  | 'demoSaveBlocked'    // försökte spara i exempelläget
  | 'actionTapped'       // tryckte in en aktion med en riktig spelare
  | 'saveTapped'         // tryckte på spara med en riktig spelare
  | 'gameSaved'         // matchen sparades
  | 'historyLockSeen'    // såg att äldre matcher är låsta (gratisfönstret)
  | 'historyUnlockClicked'; // tryckte på "lås upp" i den rutan

export const FUNNEL_STEPS: FunnelStep[] = [
  'dashboardViewed',
  'addPlayerOpened',
  'demoActionTapped',
  'demoSaveBlocked',
  'actionTapped',
  'saveTapped',
  'gameSaved',
  'historyLockSeen',
  'historyUnlockClicked',
];

// Per session räcker det att försöka en gång per steg.
const attempted = new Set<string>();

export async function trackFunnel(userId: string, step: FunnelStep): Promise<void> {
  const key = `${userId}:${step}`;
  if (attempted.has(key)) return;
  attempted.add(key);

  try {
    const data = await firestore.getUserDataCached(userId);
    if (data?.funnel?.[step]) return; // redan registrerat — behåll första tillfället
    await firestore.updateUserData(userId, { funnel: { [step]: new Date().toISOString() } });
  } catch {
    // Ett mätfel är aldrig värt att visa för användaren.
  }
}
