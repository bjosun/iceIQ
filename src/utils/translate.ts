// Översättning till ETT bestämt språk, oberoende av besökarens valda språk.
// Spelarens lyssnakort ska följa språket coachen svarade på (förälderns konto),
// inte webbläsarens, så att text och röst aldrig blandas.
import { translations, Language } from './translations';

function lookup(lang: Language, key: string): string | undefined {
  let current: any = translations[lang];
  for (const k of key.split('.')) {
    if (current && typeof current === 'object' && k in current) current = current[k];
    else return undefined;
  }
  return typeof current === 'string' ? current : undefined;
}

export function translateFor(lang: Language) {
  return (key: string, params?: Record<string, string | number>): string => {
    let text = lookup(lang, key) ?? lookup('en', key) ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
      }
    }
    return text;
  };
}

// Gissar språket i en text. Används bara för äldre coachsvar som saknar
// sparad språkkod. Returnerar null när det inte går att avgöra.
export function detectLang(text: string | null | undefined): Language | null {
  if (!text) return null;
  const sv = (text.match(/[åäöÅÄÖ]/g) || []).length +
    (text.toLowerCase().match(/\b(och|att|det|som|inte|jag|du|är|på|för|med|en|ett|har|om)\b/g) || []).length;
  const en = (text.toLowerCase().match(/\b(the|and|you|your|that|with|for|are|was|this|have|it's|to)\b/g) || []).length;
  if (sv === 0 && en === 0) return null;
  return sv >= en ? 'sv' : 'en';
}
