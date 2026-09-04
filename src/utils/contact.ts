// Kontaktadresser och bolagsuppgifter som visas för användare.
//
// Låg tidigare utspritt som tre hårdkodade mailto-länkar (support@iceiq.app i
// footern, legal@iceiq.app i villkoren, privacy@iceiq.app i policyn) — ingen
// av dem tog emot något, eftersom iceiq.app inte har någon mottagande e-post.
// Adressen nedan tar däremot emot: posten går in via en Cloudflare-worker och
// triageras av Ice IQ-agenten. När iceiq.app ligger hos Cloudflare kan
// support@iceiq.app ta över samma väg.
//
// Den dagen adressen byts: ändra här OCH i SUPPORT_REPLY_TO i
// functions/index.js. De två måste vara samma adress — annars ber mejlen om
// svar på ett ställe medan sajten pekar på ett annat.
export const SUPPORT_EMAIL = 'support-iceiq@squareversegroup.com';

// Samma inkorg tills vidare, men egna namn: den dag juridik- och
// dataskyddspost ska gå någon annanstans räcker det att ändra raden här,
// utan att leta upp rätt mailto i JSX.
export const LEGAL_EMAIL = SUPPORT_EMAIL;
export const PRIVACY_EMAIL = SUPPORT_EMAIL;

// Ice IQ är en produkt, inte en juridisk person. Det här är bolaget bakom
// tjänsten — samma bolag som mejlen kommer från, vilket är hela poängen med
// att skriva ut det: annars ser noreply@squareversegroup.com ut som en
// främmande avsändare.
export const COMPANY_NAME = 'SquareVerse Group AB';
export const COMPANY_COUNTRY = 'Sweden';
export const COMPANY_URL = 'https://squareversegroup.com';
// Aktiebolagslagen 28 kap. kräver att ett AB anger namn och organisationsnummer
// på sin webbplats — därför i footern och inte bara i villkoren.
export const COMPANY_ORG_NR = '559341-1829';
