// Väljer ut EN sann höjdpunkt ur en sparad match — den mening som gör
// matchrapporten värd att dela.
//
// Medvetet regelbaserad och inte AI-genererad: delningsrutan öppnas direkt
// efter sparning, alltså innan coachen hunnit tillfrågas, och varje
// coach-svar kostar en kredit (se askCoach i functions/index.js). En regel
// kostar ingenting, svarar direkt och fungerar vid varje sparad match.
//
// Grundregel: en höjdpunkt får bara påstå sådant som är belagt i datan.
// Ett glädjepåstående som föräldern kan motbevisa i sin egen historik är
// värre än ingen höjdpunkt alls — därför returnerar funktionen hellre null
// än något svagt.

export interface HighlightAction {
  label: string;
  count: number;
  type: 'positive' | 'negative';
}

export interface HighlightInput {
  /** Poängen för just den här matchen (totals.actionsPoints). */
  points: number;
  /** Spelarens tidigare matcher, äldst -> nyast. EXKLUSIVE den som just sparades. */
  previousGames: { points: number }[];
  /** Aktionerna i den här matchen. */
  actions: HighlightAction[];
}

// Nyckel + parametrar snarare än färdig text: översättningen görs av
// anroparen med t(key, params), så filen förblir språkoberoende och kan
// återanvändas server-side (t.ex. i veckomejlet) utan i18n-beroende.
export interface MatchHighlight {
  key: string;
  params?: Record<string, string | number>;
}

// Under så här få matcher är "säsongssnittet" brus, inte en nivå att slå.
const MIN_GAMES_FOR_AVERAGE = 3;
// En svit måste vara minst så här lång för att vara en svit och inte en slump.
const MIN_STREAK = 3;
// Färre än så här av samma aktion är inte värt att lyfta fram.
const MIN_ACTION_COUNT = 3;
// Marginaler under detta är avrundningsbrus, inte en prestation.
const MIN_PERCENT_ABOVE_AVERAGE = 10;

export function pickMatchHighlight({
  points,
  previousGames,
  actions,
}: HighlightInput): MatchHighlight | null {
  const previousPoints = previousGames.map((g) => g.points || 0);

  // 1. Första matchen — sann exakt en gång per spelare, och det är just
  //    den matchen en ny användare är mest benägen att dela.
  if (previousPoints.length === 0) {
    return { key: 'highlight.firstGame' };
  }

  const average =
    previousPoints.reduce((a, b) => a + b, 0) / previousPoints.length;

  // 2. Säsongsbästa. Kräver ett par matcher att slå — att "slå rekordet"
  //    mot en enda tidigare match betyder ingenting.
  if (previousPoints.length >= 2 && points > 0 && points > Math.max(...previousPoints)) {
    return { key: 'highlight.seasonBest', params: { points } };
  }

  // 3. Svit över snittet. Räknas bakifrån genom historiken med den här
  //    matchen inräknad.
  if (previousPoints.length >= MIN_GAMES_FOR_AVERAGE && points > average) {
    let streak = 1;
    for (let i = previousPoints.length - 1; i >= 0; i--) {
      if (previousPoints[i] > average) streak++;
      else break;
    }
    if (streak >= MIN_STREAK) {
      return { key: 'highlight.streak', params: { count: streak } };
    }
  }

  // 4. Över säsongssnittet. Bara när snittet är positivt — "+50 % bättre
  //    än -2 poäng" är matematiskt sant och samtidigt nonsens att dela.
  if (previousPoints.length >= MIN_GAMES_FOR_AVERAGE && average > 0 && points > average) {
    const percent = Math.round(((points - average) / average) * 100);
    if (percent >= MIN_PERCENT_ABOVE_AVERAGE) {
      return { key: 'highlight.aboveAverage', params: { percent } };
    }
  }

  // 5. Matchens vanligaste positiva aktion.
  const topAction = actions
    .filter((a) => a.type === 'positive')
    .sort((a, b) => b.count - a.count)[0];
  if (topAction && topAction.count >= MIN_ACTION_COUNT) {
    return {
      key: 'highlight.topAction',
      params: { count: topAction.count, action: topAction.label.toLowerCase() },
    };
  }

  // Medvetet INGEN "felfri match"-regel (noll registrerade misstag):
  // många registrerar bara positiva aktioner, och då vore den sann i
  // datan men falsk i verkligheten — vid varje match, för de användarna.
  return null;
}
