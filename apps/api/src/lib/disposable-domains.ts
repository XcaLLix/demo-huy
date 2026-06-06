// Curated list of commonly used disposable/throwaway email domains.
// Used to reject registrations from temporary email services.

export const DISPOSABLE_EMAIL_DOMAINS: Set<string> = new Set([
  // Major disposable email services
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'guerrillamail.de',
  'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com',
  'yopmail.com', 'yopmail.fr', 'mailinator.com', 'mailinator.net',
  'throwaway.email', 'throwaway.com', 'dispostable.com', 'sharklasers.com',
  'guerrillamail.info', 'grr.la', 'maildrop.cc', 'mailnesia.com',
  'mailsac.com', 'trashmail.com', 'trashmail.me', 'trashmail.net',
  'trashymail.com', 'trashymail.net', 'tempail.com', 'tempr.email',
  'temp-mail.io', 'tempmailo.com', 'tempmails.net',
  
  // Common 10-minute mail services
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  '10minute.email', 'minutemail.com', 'emailondeck.com',
  
  // Other popular disposable services
  'getnada.com', 'nada.email', 'tmpmail.net', 'tmpmail.org',
  'burpcollaborator.net', 'mailcatch.com', 'mytemp.email',
  'emailfake.com', 'fakeinbox.com', 'fakemail.net',
  'mohmal.com', 'crazymailing.com', 'inboxkitten.com',
  'harakirimail.com', 'discard.email', 'discardmail.com',
  'discardmail.de', 'spamgourmet.com', 'spamgourmet.net',
  'getairmail.com', 'mailnull.com', 'mailexpire.com',
  'tempinbox.com', 'emkei.cz', 'bugmenot.com',
  'mailforspam.com', 'safetymail.info', 'trashmail.org',
  'filzmail.com', 'mintemail.com', 'jetable.org',
  'mytrashmail.com', 'nomail.xl.cx', 'mail-temporaire.fr',
  'courrieltemporaire.com', 'spambox.us', 'spamfree24.org',
  'binkmail.com', 'despammed.com', 'devnullmail.com',
  'dontreg.com', 'e4ward.com', 'emailigo.de',
  'emailsensei.com', 'emailtemporario.com.br', 'ephemail.net',
  'example.com', 'fakemailgenerator.com', 'fasttrackoredirect.com',
  'flyspam.com', 'gishpuppy.com', 'great-host.in',
  'imails.info', 'incognitomail.org', 'jetable.com',
  'kasmail.com', 'koszmail.pl', 'kurzepost.de',
  'lhsdv.com', 'lookugly.com', 'lr78.com',
  'mailbidon.com', 'mailblocks.com', 'mailcatch.com',
  'maileater.com', 'mailexpire.com', 'mailfreeonline.com',
  'mailimate.com', 'mailmetrash.com', 'mailmoat.com',
  'mailnator.com', 'mailscrap.com', 'mailshell.com',
  'mailsiphon.com', 'mailslite.com', 'mailzilla.com',
  'mega.zik.dj', 'meltmail.com', 'mt2015.com',
  'nobulk.com', 'noclickemail.com', 'nogmailspam.info',
  'nomail.xl.cx', 'nospam.ze.tc', 'nospamfor.us',
  'nowmymail.com', 'objectmail.com', 'obobbo.com',
  'onewaymail.com', 'owlpic.com', 'pjjkp.com',
  'proxymail.eu', 'putthisinyouremail.com', 'reallymymail.com',
  'recode.me', 'regbypass.com', 'rppkn.com',
  'shortmail.net', 'skeefmail.com', 'slaskpost.se',
  'slipry.net', 'sogetthis.com', 'spambob.com',
  'spambog.com', 'spambog.de', 'spambog.ru',
  'spamcero.com', 'spamcorptastic.com', 'spamcowboy.com',
  'spamday.com', 'spamex.com', 'spamhereplease.com',
  'spaml.com', 'spamspot.com', 'superrito.com',
  'suremail.info', 'teleworm.us', 'thankyou2010.com',
  'thisisnotmyrealemail.com', 'tradermail.info',
  'turual.com', 'twinmail.de', 'tyldd.com',
  'uggsrock.com', 'veryreallycool.com', 'wegwerfmail.de',
  'wegwerfmail.net', 'wegwerfmail.org', 'wh4f.org',
  'whyspam.me', 'willselfdestruct.com', 'wuzupmail.net',
  'yep.it', 'yogamaven.com', 'yuurok.com',
  'zehnminutenmail.de', 'zippymail.info',
]);

/**
 * Check if an email address uses a known disposable/throwaway email domain.
 * @param email The email address to check
 * @returns true if the email uses a disposable domain
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1];
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Validate email format using a comprehensive regex.
 * @param email The email address to validate
 * @returns true if the email format is valid
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}
