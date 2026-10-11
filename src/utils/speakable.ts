// Skrivet språk blir konstigt uppläst: tankstreck, kolon och "×" läses som
// tecken eller ger fel betoning. Gör om dem till vanliga pauser och ord.
// Gäller även coachens rader, som är skrivna för att läsas.
export function speakable(text: string, lang: string): string {
  const times = lang === 'sv' ? 'gånger' : 'times';
  return text
    .replace(/(\d+)\s*[×x]\s*/g, `$1 ${times} `)
    .replace(/\s*[—–]\s*/g, '. ')
    .replace(/\s*[:;]\s+/g, '. ')
    .replace(/%/g, lang === 'sv' ? ' procent' : ' percent')
    .replace(/\.\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
