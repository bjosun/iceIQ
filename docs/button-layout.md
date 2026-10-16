# Knappvyn: fast "knapptelefon"-rutnät och dagens fokus

Status 2026-10-16. Kod: `src/utils/gridLayout.ts`, `src/components/dashboard/ActionGrid.tsx`, layouter i `src/contexts/TemplateContext.tsx` (`layout` per standardmall).

**Idé:** live går det inte att läsa 30 knappar. Tolv pluss och sex minus ligger alltid på samma plats (3 kolumner), så att händerna lär sig läget. Allt annat ligger under "Mer…". Det är bara en vy: alla aktioner finns kvar i mallen och sparas under samma engelska namn, så statistik, utmärkelser och coach påverkas inte.

| Roll | Pluss | Minus | Fokusplatser | Under "Mer…" |
|---|---|---|---|---|
| Back | 11 fasta + 1 fokus (förval: Höll blålinjen) | 5 | 1 | Poke check, på isen mål för |
| Forward | 11 fasta + 1 fokus (förval: Täcker backen vid blå) | 6 | 1 | 9 st (dribbling, tekning, poke check, blockerat skott m.fl.) |
| Center | 11 fasta + 1 fokus (förval: Framför mål) | 6 | 1 | 16 st (tekning per zon, tredje man, utspelsstöd m.fl.) |
| Målvakt | 6 | 4 | 0 | inget |

**Dagens fokus:** de lediga plusplatserna väljs i "Mer…". Valet sparas per mall på enheten (`iceiq-focus-<mall>`), och de markeras med en stjärna.

**Egna mallar:** utan layout (eller om de flesta namnen saknas) visas hela listan som förut.

**Ändra en layout:** lista engelska aktionsnamn i `layout.positive` (fasta platser, resten av tolv är fokus), `layout.negative` (max sex) och `layout.focus` (förval). Lägg korta namn i `SHORT_NAMES` för det som är långt. Tester: `node --test src/utils/gridLayout.test.mjs`.

**Nästa steg om det behövs:** "Märk"-knapp (spara ögonblick live, klassa efteråt) och röst som skriver till samma lista.
