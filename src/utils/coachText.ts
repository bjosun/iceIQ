// Coachens svar är vanlig text. Modellen skriver ibland ändå markdown
// ("**fetstil**", "* punkt"), som annars syns som stjärnor i appen och på
// spelarens sida. Tas bort här i visningen; servern städar också nya svar.
export function plainCoachText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^\s*[*-]\s+/gm, '• ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*/g, '');
}
