import { Type, type FunctionDeclaration } from '@google/genai';
import type { Template, TemplateAction } from '../contexts/TemplateContext';

export type VoiceLanguage = 'sv' | 'en';

// Modellen får mallens händelser som en enum. Vi använder det engelska namnet
// (name.en) som id eftersom det är samma nyckel Dashboard och sparade matcher
// redan bygger på — men visar/uttalar det i användarens språk via beskrivningen.
export function actionId(a: TemplateAction): string {
  return a.name.en;
}

export function actionLabel(a: TemplateAction, lang: VoiceLanguage): string {
  return a.name[lang] || a.name.en;
}

export function buildVoiceTools(template: Template, lang: VoiceLanguage): FunctionDeclaration[] {
  const ids = template.actions.map(actionId);
  const legend = template.actions
    .map((a) => `${actionId(a)} = "${actionLabel(a, lang)}"`)
    .join('; ');

  return [
    {
      name: 'register_action',
      description:
        'Registrerar EN händelse för spelaren som följs. Anropa bara när det är tydligt att det gäller spelaren. ' +
        `Händelser: ${legend}`,
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            enum: ids,
            description: 'Händelsens id, exakt som i listan.',
          },
          phrase: {
            type: Type.STRING,
            description: 'Kort: vad föräldern sa, med egna ord. Används i loggen.',
          },
        },
        required: ['action'],
      },
    },
    {
      name: 'undo_last',
      description: 'Tar bort den senast registrerade händelsen. Används när föräldern säger ångra/fel/ta bort.',
      parameters: { type: Type.OBJECT, properties: {} },
    },
    {
      name: 'get_match_stats',
      description: 'Hämtar matchens aktuella siffror (antal per händelse och totala poäng). Räkna aldrig själv — använd det här.',
      parameters: { type: Type.OBJECT, properties: {} },
    },
  ];
}
