// Känner igen när en länk öppnats i en annan apps inbyggda webbläsare
// (Facebook, Instagram, TikTok, Snapchat, LinkedIn, Messenger, LINE). Där
// saknas eller fungerar ofta inte uppläsning (och inloggning med Google), så
// sidan kan föreslå att öppna länken i Safari/Chrome i stället.
export function isInAppBrowser(userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|Snapchat|TikTok|musical_ly|BytedanceWebview|LinkedInApp|Line\/|MessengerLite|Messenger/i.test(userAgent);
}
