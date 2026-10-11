# Spelarens länk: tal med coachen och ljud att lyssna på

Status: plan, inget byggt. Skriven 2026-10-11. Fortsättning på [röstcoachen](voice-coach-plan.md), men för **spelaren** och inte föräldern.

## Mål

Spelaren ska kunna prata med coachen och lyssna på korta, roliga genomgångar av sin match, utan att läsa mycket text och utan att komma åt matchpanelen, saldot eller betalningen. Föräldern bestämmer, och ser allt.

Barn har ett kort koncentrationsspann. Allt på länken är därför byggt för **tal och korta stunder**, inte text.

## Utgångspunkt (finns redan)

Spelarens länk `/p/:token` (`src/pages/PlayerLinkPage.tsx`, `getPlayerLinkData`/`mintPlayerLink` i `functions/index.js`):
- Ingen inloggning. Token i URL:en är hela behörigheten, och föräldern kan återkalla länken.
- Visar säsongskurvan, senaste coachsvar och rutinerna. Aldrig saldo, e-post eller betalning.

Chatten och ljudet byggs **på samma länk**. Ingen egen barnapp: det skulle betyda en ny App Store-granskning med strängare barnregler och en inloggning barnen själva ska klara. Länken kan läggas på hemskärmen (manifestet är ifyllt).

## Tre delar

### 1. Lyssna: matchen som kort ljud (först)
När spelaren öppnar länken finns en stor knapp **"Lyssna på matchen"**.

- **Format:** 15–30 sekunder, en sak åt gången (en match = 2–3 korta klipp: "Det du gjorde bra", "En sak att öva på").
- **Ton:** som en kompis som pratar, ungefär som i korta videor: kort, direkt, energisk men lugn. Inga utropstecken-lavar, ingen jämförelse med andra, aldrig något som påstår mer än datan visar. Följer [kopieringsreglerna](../README.md): egen utveckling, misstag som något man övar bort.
- **Gränssnitt:** en stor spelknapp, undertexten visas medan det spelas (för den som inte kan lyssna), "nästa" och "igen". Inga menyer.
- **Källa:** texten kommer från samma data som sammanfattningen (poäng, eget snitt, märken, "att tänka på"), inte ett nytt fritt AI-svar. Det gör det billigt, förutsägbart och säkrare för barn.
- **Ljud:** text till tal, genereras första gången länken öppnas efter en match. Vilken tjänst och röst som ska användas är inte beslutat och ska verifieras (kvalitet på svenska, kostnad, att den kan genereras i EU). Ljudet är coachens egen röst och innehåller bara det som redan står i sammanfattningen, men sparas ändå bara tillfälligt (kort cache), inte som en användares inspelning.

### 2. Prata: spelaren pratar med coachen
En mikrofonknapp **håll för att prata** (inte alltid-lyssnande, som för föräldrar). Coachen svarar med tal.

- **Allt sparas som text, aldrig ljud.** Spelarens tal skrivs om till text och sparas i samma coachlogg som föräldern ser. Ljud sparas inte.
- **Korta svar:** några meningar, enkla ord, en fråga tillbaka åt gången.
- **Inget skrivande krävs.** Text som alternativ finns, men är inte huvudvägen.
- **Förälderns översikt:** föräldern ser samtalen i sin egen coachlogg (och kan stänga länken).
- **Minne:** det spelaren säger får läggas till i spelarens tidslinje (`coachTimeline`) så att coachen lär sig spelaren, men föräldern ser vad som lades till.

### 3. Tilltal: vem pratar?
Coachen pratar redan till den som skriver som om det vore spelaren. Det är rätt för spelaren, och går bra när en förälder, kompis eller tränare skriver. En liten väljare ("Jag är spelaren / Jag är en förälder") gör att svaret kan stå i rätt person när det delas vidare. Det är en liten ändring i prompten, inte i data.

## Beslut som behövs innan bygge

| Fråga | Förslag |
|---|---|
| Vem betalar? | Förälderns AI-krediter, med en **dagsgräns** per spelare så att en ivrig spelare inte tömmer allt. Lyssnaklippen kostar inga AI-krediter (de bygger på redan sparad data). |
| Åldersgräns | I Sverige är gränsen för eget samtycke 13 år. För yngre samtycker föräldern, vilket länken i praktiken redan gör genom att föräldern skickar den. Behöver bekräftas och stå i integritetspolicyn. |
| Säkerhet | Strikt barnprompt: håller sig till hockey, träning och mående kring matchen; hänvisar till en vuxen vid allvarliga ämnen; ingen personlig information ut. Svaret kontrolleras innan det visas. |
| Vilka får ha en länk? | Föräldern skapar och kan återkalla. Vem som helst med länken kan prata, så länken ska behandlas som ett lösenord (lägg till hastighetsgräns per länk). |
| Röstdata | Barns röst är känslig. Samtyckestexten (och policyn) ska täcka det. Föräldern ska uttryckligen godkänna att spelaren får prata, inte bara skicka länken. |

## Byggordning

1. **Lyssna:** knappen, klippen, spelaren, textning. Ingen mikrofon, inga AI-anrop. Mest värde per arbete, och det går att prova direkt med barn.
2. **Dagsgräns, hastighetsgräns, förälderns godkännande** för att spelaren ska få prata.
3. **Prata:** mikrofonknapp, transkribering till text, korta barnsvar, spara som text. Bygger på [röstcoachens](voice-coach-plan.md) delar (kortlivade sessionsnycklar via `mintVoiceSession`-mönstret, ljud lämnar aldrig enheten sparat).
4. **Tilltalsväljaren** och finjustering av tonen efter att ni hört den med riktiga barn.

## Risker

- **Barn och AI:** felaktiga eller olämpliga svar är värre här än hos en förälder. Därför lyssnaklippen först (kontrollerat innehåll), fritt tal sist.
- **Kostnad:** röst och ljudgenerering kostar per minut. Mät per match innan priset sätts (se röstplanen).
- **Länk som lösenord:** den som får länken kan prata med coachen. Hastighetsgräns och återkallning är därför krav, inte tillval.
- **Ton:** "som på TikTok" ska betyda kort och engagerande, inte överdrivet eller jämförande. Prova med barn och justera.
